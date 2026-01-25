"""Credit management service for handling user credits."""
import time
from typing import Optional
from sqlmodel import Session, select
from models import User, CreditTransaction, WorkflowExecution
import uuid


class CreditService:
    """Service for managing user credits."""
    
    @staticmethod
    def get_balance(session: Session, user_id: uuid.UUID) -> int:
        """Get current credit balance for a user."""
        user = session.get(User, user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")
        return user.credit_balance
    
    @staticmethod
    def has_sufficient_credits(session: Session, user_id: uuid.UUID, required_amount: int) -> bool:
        """Check if user has sufficient credits."""
        balance = CreditService.get_balance(session, user_id)
        return balance >= required_amount
    
    @staticmethod
    def add_credits(
        session: Session,
        user_id: uuid.UUID,
        amount: int,
        transaction_type: str,
        description: str,
        stripe_payment_intent_id: Optional[str] = None
    ) -> CreditTransaction:
        """Add credits to user account."""
        if amount <= 0:
            raise ValueError("Amount must be positive")
        
        # Get user
        user = session.get(User, user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        # Update balance
        user.credit_balance += amount
        
        # Create transaction record
        transaction = CreditTransaction(
            user_id=user_id,
            amount=amount,
            transaction_type=transaction_type,
            description=description,
            stripe_payment_intent_id=stripe_payment_intent_id,
            created_at=int(time.time() * 1000)
        )
        
        session.add(transaction)
        session.commit()
        session.refresh(transaction)
        
        return transaction
    
    @staticmethod
    def deduct_credits(
        session: Session,
        user_id: uuid.UUID,
        amount: int,
        description: str,
        execution_id: Optional[uuid.UUID] = None
    ) -> CreditTransaction:
        """Deduct credits from user account."""
        if amount <= 0:
            raise ValueError("Amount must be positive")
        
        # Get user
        user = session.get(User, user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        # Check balance
        if user.credit_balance < amount:
            raise ValueError(f"Insufficient credits. Required: {amount}, Available: {user.credit_balance}")
        
        # Update balance
        user.credit_balance -= amount
        
        # Create transaction record (negative amount)
        transaction = CreditTransaction(
            user_id=user_id,
            amount=-amount,  # Negative for deduction
            transaction_type="workflow_execution",
            description=description,
            workflow_execution_id=execution_id,
            created_at=int(time.time() * 1000)
        )
        
        session.add(transaction)
        session.commit()
        session.refresh(transaction)
        
        return transaction
    
    @staticmethod
    def refund_credits(session: Session, execution_id: uuid.UUID) -> Optional[CreditTransaction]:
        """Refund credits for a failed execution."""
        # Get the execution
        execution = session.get(WorkflowExecution, execution_id)
        if not execution:
            raise ValueError(f"Execution {execution_id} not found")
        
        # Check if credits were used
        if execution.credits_used == 0:
            return None
        
        # Find the deduction transaction
        deduction_tx = session.exec(
            select(CreditTransaction)
            .where(CreditTransaction.workflow_execution_id == execution_id)
            .where(CreditTransaction.amount < 0)
        ).first()
        
        if not deduction_tx:
            return None
        
        # Add credits back
        user = session.get(User, execution.user_id)
        if not user:
            raise ValueError(f"User {execution.user_id} not found")
        
        refund_amount = execution.credits_used
        user.credit_balance += refund_amount
        
        # Create refund transaction
        refund_tx = CreditTransaction(
            user_id=execution.user_id,
            amount=refund_amount,  # Positive for refund
            transaction_type="refund",
            description=f"Refund for failed execution {execution_id}",
            workflow_execution_id=execution_id,
            created_at=int(time.time() * 1000)
        )
        
        session.add(refund_tx)
        session.commit()
        session.refresh(refund_tx)
        
        return refund_tx
    
    @staticmethod
    def get_transaction_history(
        session: Session,
        user_id: uuid.UUID,
        limit: int = 50,
        offset: int = 0
    ) -> list[CreditTransaction]:
        """Get transaction history for a user."""
        transactions = session.exec(
            select(CreditTransaction)
            .where(CreditTransaction.user_id == user_id)
            .order_by(CreditTransaction.created_at.desc())
            .limit(limit)
            .offset(offset)
        ).all()
        
        return list(transactions)
