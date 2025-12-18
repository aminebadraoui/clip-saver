from fastapi import APIRouter, Depends, HTTPException, Request, Header
from fastapi.responses import JSONResponse, RedirectResponse
from sqlmodel import Session, select
import stripe
import os
import time
from typing import Optional
from pydantic import BaseModel

from database import get_session
from models import User
from auth import get_current_user

router = APIRouter(prefix="/billing", tags=["billing"])

# Strip API Key Configuration
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
CLIENT_URL = os.getenv("CLIENT_URL", "http://localhost:5173") # Make sure to set this in .env or default
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

class CheckoutSessionRequest(BaseModel):
    priceId: Optional[str] = None # Optional override if we have multiple plans later

@router.post("/create-checkout-session")
async def create_checkout_session(
    request: Optional[CheckoutSessionRequest] = None, 
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    try:
        # Create or retrieve Stripe Customer
        if not current_user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=current_user.email,
                metadata={"user_id": str(current_user.id)}
            )
            current_user.stripe_customer_id = customer.id
            session.add(current_user)
            session.commit()
            session.refresh(current_user)
        
        # Create Checkout Session
        try:
            checkout_session = stripe.checkout.Session.create(
                customer=current_user.stripe_customer_id,
                line_items=[
                    {
                        'price': STRIPE_PRICE_ID,
                        'quantity': 1,
                    },
                ],
                mode='subscription',
                success_url=f'{CLIENT_URL}/?session_id={{CHECKOUT_SESSION_ID}}',
                cancel_url=f'{CLIENT_URL}/subscription?canceled=true',
                subscription_data={
                    "metadata": {"user_id": str(current_user.id)}
                }
            )
        except stripe.error.InvalidRequestError as e:
            if "No such customer" in str(e):
                print(f"Customer {current_user.stripe_customer_id} missing in Stripe. Creating new one.")
                # Create new customer
                customer = stripe.Customer.create(
                    email=current_user.email,
                    metadata={"user_id": str(current_user.id)}
                )
                current_user.stripe_customer_id = customer.id
                session.add(current_user)
                session.commit()
                session.refresh(current_user)
                
                # Retry Checkout Session creation
                checkout_session = stripe.checkout.Session.create(
                    customer=current_user.stripe_customer_id,
                    line_items=[
                        {
                            'price': STRIPE_PRICE_ID,
                            'quantity': 1,
                        },
                    ],
                    mode='subscription',
                    success_url=f'{CLIENT_URL}/?session_id={{CHECKOUT_SESSION_ID}}',
                    cancel_url=f'{CLIENT_URL}/subscription?canceled=true',
                    subscription_data={
                        "metadata": {"user_id": str(current_user.id)}
                    }
                )
            else:
                raise e
        
        return JSONResponse({"url": checkout_session.url})
        
    except Exception as e:
        import traceback
        error_msg = f"Error creating checkout session: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        with open("error.log", "w") as f:
            f.write(error_msg)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-portal-session")
async def create_portal_session(
    current_user: User = Depends(get_current_user)
):
    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="User has no billing account associated.")

    try:
        portal_session = stripe.billing_portal.Session.create(
            customer=current_user.stripe_customer_id,
            return_url=f'{CLIENT_URL}/settings',
        )
        return JSONResponse({"url": portal_session.url})
    except Exception as e:
        print(f"Error creating portal session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/debug-activate")
async def debug_activate_subscription(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Temporary debug endpoint to manually active subscription"""
    print(f"Manually activating subscription for {current_user.email}")
    current_user.subscription_status = "active"
    current_user.stripe_customer_id = "debug_customer_id" 
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return {"status": "activated", "user": current_user}

@router.post("/webhook")
async def webhook(request: Request, stripe_signature: str = Header(None)):
    payload = await request.body()
    print(f"Received Webhook! Signature: {stripe_signature[:10]}...") 
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
        print(f"Webhook event constructed: {event['type']}")
    except ValueError as e:
        print(f"Webhook Error: Invalid payload - {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        print(f"Webhook Error: Invalid signature - {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event['type'] in [
        'customer.subscription.created', 
        'customer.subscription.updated', 
        'customer.subscription.deleted'
    ]:
        subscription = event['data']['object']
        print(f"Processing subscription event for customer: {subscription.get('customer')}")
        await handle_subscription_change(subscription)
    
    return JSONResponse({"status": "success"})

async def handle_subscription_change(subscription):
    from database import engine
    
    customer_id = subscription['customer']
    status = subscription['status']
    subscription_id = subscription['id']
    cancel_at_period_end = subscription.get('cancel_at_period_end', False)
    current_period_end = subscription.get('current_period_end')
    
    print(f"Handling change: Customer {customer_id}, Status {status}, CancelAtEnd {cancel_at_period_end}")

    # We need a fresh session here since this is called from webhook (no dep injection)
    with Session(engine) as session:
        user = session.exec(select(User).where(User.stripe_customer_id == customer_id)).first()
        
        if user:
            user.subscription_status = status
            user.subscription_id = subscription_id
            user.cancel_at_period_end = cancel_at_period_end
            user.current_period_end = current_period_end
            session.add(user)
            session.commit()
            print(f"Updated subscription for user {user.email} to {status}")
        else:
            print(f"User not found for customer_id {customer_id} in webhook handler")
