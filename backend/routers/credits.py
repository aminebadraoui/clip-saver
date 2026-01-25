"""API routes for credit management."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List
from pydantic import BaseModel
import time

from database import get_session
from models import User, CreditTransaction
from auth import get_current_user
from services.credit_service import CreditService


router = APIRouter(prefix="/api/credits", tags=["credits"])


class CreditBalanceResponse(BaseModel):
    balance: int
    user_id: str


class CreditTransactionResponse(BaseModel):
    id: str
    amount: int
    transaction_type: str
    description: str
    created_at: int


class CreditPackage(BaseModel):
    id: str
    name: str
    credits: int
    price: float  # USD
    bonus_credits: int = 0


class PurchaseRequest(BaseModel):
    package_id: str


# Credit packages
CREDIT_PACKAGES = [
    CreditPackage(id="starter", name="Starter Pack", credits=100, price=5.00),
    CreditPackage(id="basic", name="Basic Pack", credits=500, price=20.00, bonus_credits=50),
    CreditPackage(id="pro", name="Pro Pack", credits=1000, price=35.00, bonus_credits=150),
    CreditPackage(id="enterprise", name="Enterprise Pack", credits=5000, price=150.00, bonus_credits=1000),
]


@router.get("/balance", response_model=CreditBalanceResponse)
def get_balance(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get current credit balance."""
    credit_service = CreditService()
    balance = credit_service.get_balance(session, current_user.id)
    
    return CreditBalanceResponse(
        balance=balance,
        user_id=str(current_user.id)
    )


@router.get("/transactions", response_model=List[CreditTransactionResponse])
def get_transactions(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0
):
    """Get credit transaction history."""
    credit_service = CreditService()
    transactions = credit_service.get_transaction_history(
        session, current_user.id, limit, offset
    )
    
    return [
        CreditTransactionResponse(
            id=str(t.id),
            amount=t.amount,
            transaction_type=t.transaction_type,
            description=t.description,
            created_at=t.created_at
        )
        for t in transactions
    ]


@router.get("/pricing", response_model=List[CreditPackage])
def get_pricing():
    """Get available credit packages."""
    return CREDIT_PACKAGES


@router.post("/purchase")
def purchase_credits(
    purchase: PurchaseRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Purchase credits (Stripe integration placeholder)."""
    # Find package
    package = next((p for p in CREDIT_PACKAGES if p.id == purchase.package_id), None)
    
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found"
        )
    
    # TODO: Integrate with Stripe
    # For now, just add credits directly (for testing)
    
    credit_service = CreditService()
    total_credits = package.credits + package.bonus_credits
    
    transaction = credit_service.add_credits(
        session=session,
        user_id=current_user.id,
        amount=total_credits,
        transaction_type="purchase",
        description=f"Purchased {package.name}",
        stripe_payment_intent_id=None  # Will be set by Stripe webhook
    )
    
    return {
        "success": True,
        "credits_added": total_credits,
        "new_balance": credit_service.get_balance(session, current_user.id),
        "transaction_id": str(transaction.id)
    }
