"""Initial schema for LandGuard AI

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-09-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('email', sa.String(), unique=True, index=True, nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('designation', sa.String(), nullable=True),
        sa.Column('department', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('is_superuser', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )

    # 2. projects
    op.create_table(
        'projects',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('name', sa.String(), index=True, nullable=False),
        sa.Column('type', sa.String(), nullable=True),
        sa.Column('state', sa.String(), index=True, nullable=False),
        sa.Column('district', sa.String(), index=True, nullable=False),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('coords', sa.JSON(), nullable=False),
        sa.Column('start_location', sa.String(), nullable=False),
        sa.Column('destination', sa.String(), nullable=False),
        sa.Column('estimated_budget_cr', sa.Float(), nullable=False),
        sa.Column('target_completion', sa.String(), nullable=False),
        sa.Column('required_land_area_acres', sa.Float(), nullable=True),
        sa.Column('current_stage_index', sa.Integer(), nullable=True),
        sa.Column('bottleneck_stage_index', sa.Integer(), nullable=True),
        sa.Column('selected_route_id', sa.String(), nullable=True),
        sa.Column('parcels_count', sa.Integer(), nullable=True),
        sa.Column('stakeholders_count', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )

    # 3. routes
    op.create_table(
        'routes',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('label', sa.String(), nullable=False),
        sa.Column('strategy', sa.String(), nullable=False),
        sa.Column('path', sa.JSON(), nullable=False),
        sa.Column('distance_km', sa.Float(), nullable=False),
        sa.Column('affected_parcels', sa.Integer(), nullable=True),
        sa.Column('affected_parcel_ids', sa.JSON(), nullable=True),
        sa.Column('stakeholders', sa.Integer(), nullable=True),
        sa.Column('estimated_cost_cr', sa.Float(), nullable=False),
        sa.Column('estimated_delay_months', sa.Integer(), nullable=True),
        sa.Column('delay_probability_pct', sa.Integer(), nullable=True),
        sa.Column('infrastructure_impact', sa.String(), nullable=True),
        sa.Column('overall_score', sa.Integer(), nullable=True),
        sa.Column('ai_recommended', sa.Boolean(), nullable=True),
        sa.Column('corridor_width_meters', sa.Float(), nullable=True),
        sa.Column('lanes', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )

    # 4. parcels
    op.create_table(
        'parcels',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('route_ids', sa.JSON(), nullable=True),
        sa.Column('coords', sa.JSON(), nullable=False),
        sa.Column('polygon_coords', sa.JSON(), nullable=True),
        sa.Column('area_sq_ft', sa.Float(), nullable=False),
        sa.Column('impact', sa.String(), nullable=True),
        sa.Column('land_type', sa.String(), nullable=True),
        sa.Column('owner_ref', sa.String(), index=True, nullable=False),
        sa.Column('verification', sa.String(), nullable=True),
        sa.Column('acquisition_status', sa.String(), nullable=True),
        sa.Column('response_status', sa.String(), nullable=True),
        sa.Column('notification_status', sa.String(), nullable=True),
        sa.Column('documents_complete', sa.Integer(), nullable=True),
        sa.Column('documents_required', sa.Integer(), nullable=True),
        sa.Column('disputed', sa.Boolean(), nullable=True),
        sa.Column('risk_contribution', sa.String(), nullable=True),
        sa.Column('structures_present', sa.Boolean(), nullable=True),
        sa.Column('structure_type', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )

    # 5. stakeholders
    op.create_table(
        'stakeholders',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('ref', sa.String(), index=True, nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('parcel_id', sa.String(), nullable=False),
        sa.Column('parcel_ids', sa.JSON(), nullable=True),
        sa.Column('contact_ref', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('response_status', sa.String(), nullable=True),
        sa.Column('notification_status', sa.String(), nullable=True),
        sa.Column('documents_complete', sa.Boolean(), nullable=True),
        sa.Column('documents_count', sa.Integer(), nullable=True),
        sa.Column('documents_required', sa.Integer(), nullable=True),
        sa.Column('compensation_status', sa.String(), nullable=True),
        sa.Column('last_contact', sa.String(), nullable=True),
        sa.Column('preferred_language', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )

    # 6. documents
    op.create_table(
        'documents',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('parcel_id', sa.String(), sa.ForeignKey('parcels.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=True, index=True),
        sa.Column('stakeholder_id', sa.String(), nullable=True, index=True),
        sa.Column('type', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('verification_status', sa.String(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(), nullable=True),
        sa.Column('file_size', sa.String(), nullable=True),
        sa.Column('ocr', sa.JSON(), nullable=True),
    )

    # 7. field_verifications
    op.create_table(
        'field_verifications',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('parcel_id', sa.String(), sa.ForeignKey('parcels.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('officer_ref', sa.String(), nullable=False),
        sa.Column('officer_name', sa.String(), nullable=True),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('priority', sa.String(), nullable=True),
        sa.Column('deadline', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('verification_status', sa.String(), nullable=True),
        sa.Column('gps_captured', sa.Boolean(), nullable=True),
        sa.Column('gps_coordinates', sa.JSON(), nullable=True),
        sa.Column('photos_count', sa.Integer(), nullable=True),
        sa.Column('videos_count', sa.Integer(), nullable=True),
        sa.Column('photo_evidence_ref', sa.String(), nullable=True),
        sa.Column('video_evidence_ref', sa.String(), nullable=True),
        sa.Column('observation', sa.Text(), nullable=True),
        sa.Column('supervisor_decision', sa.String(), nullable=True),
        sa.Column('assigned_date', sa.String(), nullable=True),
        sa.Column('completed_date', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )

    # 8. citizen_reports
    op.create_table(
        'citizen_reports',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=True, index=True),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('report_type', sa.String(), nullable=True),
        sa.Column('citizen_ref', sa.String(), nullable=True, index=True),
        sa.Column('has_photo', sa.Boolean(), nullable=True),
        sa.Column('has_video', sa.Boolean(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('submitted_at', sa.String(), nullable=False),
        sa.Column('response_note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )

    # 9. notifications
    op.create_table(
        'notifications',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('type', sa.String(), nullable=True),
        sa.Column('severity', sa.String(), nullable=True),
        sa.Column('message', sa.String(), nullable=False),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=True, index=True),
        sa.Column('parcel_id', sa.String(), nullable=True),
        sa.Column('recipient', sa.String(), nullable=True),
        sa.Column('channel', sa.String(), nullable=True),
        sa.Column('timestamp', sa.String(), nullable=False),
        sa.Column('read', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )

    # 10. risk_predictions
    op.create_table(
        'risk_predictions',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='CASCADE'), unique=True, nullable=False, index=True),
        sa.Column('overall_pct', sa.Integer(), nullable=False),
        sa.Column('band', sa.String(), nullable=True),
        sa.Column('predicted_delay_label', sa.String(), nullable=True),
        sa.Column('confidence_pct', sa.Integer(), nullable=True),
        sa.Column('trend', sa.JSON(), nullable=True),
        sa.Column('trend_status', sa.String(), nullable=True),
        sa.Column('categories', sa.JSON(), nullable=True),
        sa.Column('drivers', sa.JSON(), nullable=True),
        sa.Column('original_completion_months', sa.Integer(), nullable=True),
        sa.Column('predicted_completion_months', sa.Integer(), nullable=True),
        sa.Column('predicted_at', sa.DateTime(), nullable=True),
    )

    # 11. risk_factors
    op.create_table(
        'risk_factors',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('prediction_id', sa.String(), sa.ForeignKey('risk_predictions.id', ondelete='CASCADE'), nullable=True),
        sa.Column('factor_name', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('weight', sa.Float(), nullable=True),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('mitigation', sa.String(), nullable=True),
    )

    # 12. audit_logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('actor', sa.String(), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('entity', sa.String(), nullable=False),
        sa.Column('entity_id', sa.String(), nullable=False),
        sa.Column('label', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('extra_metadata', sa.JSON(), nullable=True),
        sa.Column('time', sa.String(), nullable=False),
        sa.Column('date', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('risk_factors')
    op.drop_table('risk_predictions')
    op.drop_table('notifications')
    op.drop_table('citizen_reports')
    op.drop_table('field_verifications')
    op.drop_table('documents')
    op.drop_table('stakeholders')
    op.drop_table('parcels')
    op.drop_table('routes')
    op.drop_table('projects')
    op.drop_table('users')
