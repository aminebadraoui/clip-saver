"""Add workflow and credit tables

Revision ID: 5f8a9b3c4d2e
Revises: 4106d5e2c475
Create Date: 2026-01-24 23:36:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '5f8a9b3c4d2e'
down_revision: Union[str, Sequence[str], None] = '2ab388ca74e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add credit_balance to user table
    op.add_column('user', sa.Column('credit_balance', sa.Integer(), nullable=False, server_default='100'))
    
    # Create aiworkflow table
    op.create_table('aiworkflow',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('thumbnail', sa.String(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('workflow_data', sa.Text(), nullable=False),
        sa.Column('created_at', sa.BigInteger(), nullable=False),
        sa.Column('updated_at', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=True),
        sa.Column('space_id', sa.Uuid(), nullable=True),
        sa.ForeignKeyConstraint(['space_id'], ['space.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_aiworkflow_user_id'), 'aiworkflow', ['user_id'], unique=False)
    op.create_index(op.f('ix_aiworkflow_is_public'), 'aiworkflow', ['is_public'], unique=False)
    
    # Create workflowexecution table
    op.create_table('workflowexecution',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('workflow_id', sa.Uuid(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('input_data', sa.Text(), nullable=False),
        sa.Column('output_data', sa.Text(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('credits_used', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('execution_time_ms', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.BigInteger(), nullable=False),
        sa.Column('completed_at', sa.BigInteger(), nullable=True),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['workflow_id'], ['aiworkflow.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_workflowexecution_user_id'), 'workflowexecution', ['user_id'], unique=False)
    op.create_index(op.f('ix_workflowexecution_workflow_id'), 'workflowexecution', ['workflow_id'], unique=False)
    op.create_index(op.f('ix_workflowexecution_status'), 'workflowexecution', ['status'], unique=False)
    
    # Create credittransaction table
    op.create_table('credittransaction',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('transaction_type', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('workflow_execution_id', sa.Uuid(), nullable=True),
        sa.Column('stripe_payment_intent_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['workflow_execution_id'], ['workflowexecution.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_credittransaction_user_id'), 'credittransaction', ['user_id'], unique=False)
    op.create_index(op.f('ix_credittransaction_transaction_type'), 'credittransaction', ['transaction_type'], unique=False)
    
    # Create replicatemodelcache table
    op.create_table('replicatemodelcache',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('model_id', sa.String(), nullable=False),
        sa.Column('model_name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('input_schema', sa.Text(), nullable=False),
        sa.Column('output_schema', sa.Text(), nullable=False),
        sa.Column('cost_per_run', sa.Float(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_updated', sa.BigInteger(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_replicatemodelcache_model_id'), 'replicatemodelcache', ['model_id'], unique=True)
    op.create_index(op.f('ix_replicatemodelcache_category'), 'replicatemodelcache', ['category'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop tables in reverse order
    op.drop_index(op.f('ix_replicatemodelcache_category'), table_name='replicatemodelcache')
    op.drop_index(op.f('ix_replicatemodelcache_model_id'), table_name='replicatemodelcache')
    op.drop_table('replicatemodelcache')
    
    op.drop_index(op.f('ix_credittransaction_transaction_type'), table_name='credittransaction')
    op.drop_index(op.f('ix_credittransaction_user_id'), table_name='credittransaction')
    op.drop_table('credittransaction')
    
    op.drop_index(op.f('ix_workflowexecution_status'), table_name='workflowexecution')
    op.drop_index(op.f('ix_workflowexecution_workflow_id'), table_name='workflowexecution')
    op.drop_index(op.f('ix_workflowexecution_user_id'), table_name='workflowexecution')
    op.drop_table('workflowexecution')
    
    op.drop_index(op.f('ix_aiworkflow_is_public'), table_name='aiworkflow')
    op.drop_index(op.f('ix_aiworkflow_user_id'), table_name='aiworkflow')
    op.drop_table('aiworkflow')
    
    # Remove credit_balance from user table
    op.drop_column('user', 'credit_balance')
