"""
LandGuard AI — Phase 3 Synthetic Historical Dataset Generator
Generates >= 10,000 realistic, correlated land acquisition cases
based on official SIH26017 parameters.
"""

import os
import numpy as np
import pandas as pd
from typing import Optional, Tuple


PROJECT_TYPES = [
    "Expressway / Highway",
    "Freight Corridor",
    "Ring Road / Bypass",
    "Port Connectivity",
    "Elevated Expressway",
    "High-Speed Rail Feeder",
]

STATES_AND_DISTRICTS = {
    "Tamil Nadu": ["Chennai", "Salem", "Coimbatore", "Madurai", "Tiruchirappalli", "Krishnagiri"],
    "Karnataka": ["Bengaluru Rural", "Mysuru", "Tumakuru", "Belagavi", "Dakshina Kannada"],
    "Maharashtra": ["Pune", "Nagpur", "Nashik", "Thane", "Aurangabad"],
    "Telangana": ["Rangareddy", "Hyderabad", "Medchal", "Sangareddy", "Warangal"],
    "Kerala": ["Ernakulam", "Kozhikode", "Palakkad", "Thrissur", "Thiruvananthapuram"],
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Chittoor", "Guntur", "Nellore"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Bharuch", "Rajkot"],
}


def generate_historical_dataset(
    num_records: int = 12000,
    seed: int = 42,
    save_path: Optional[str] = None,
) -> pd.DataFrame:
    """
    Generates a correlated synthetic dataset of historical land acquisition projects.
    Each record represents an acquisition project/corridor section with full
    features and verified delay outcomes.
    """
    np.random.seed(seed)
    
    # 1. Geographic & Project baseline distribution
    states = list(STATES_AND_DISTRICTS.keys())
    state_choices = np.random.choice(states, size=num_records, p=[0.25, 0.18, 0.16, 0.14, 0.11, 0.08, 0.08])
    district_choices = [np.random.choice(STATES_AND_DISTRICTS[st]) for st in state_choices]
    project_type_choices = np.random.choice(PROJECT_TYPES, size=num_records, p=[0.30, 0.20, 0.20, 0.12, 0.10, 0.08])

    # 2. Scale & Complexity Features
    project_complexity = np.random.choice([1, 2, 3, 4, 5], size=num_records, p=[0.10, 0.25, 0.35, 0.20, 0.10])
    
    # Land area in acres correlated with project type and complexity
    base_land = np.random.gamma(shape=3.5, scale=45.0, size=num_records) + (project_complexity * 35.0)
    land_area_acres = np.clip(np.round(base_land, 1), 15.0, 1500.0)
    
    # Affected parcels and families scale with land area
    parcels_per_acre = np.random.uniform(0.6, 2.2, size=num_records)
    affected_parcels = np.clip(np.round(land_area_acres * parcels_per_acre).astype(int), 12, 1200)
    
    families_per_parcel = np.random.uniform(0.8, 1.8, size=num_records)
    affected_families = np.clip(np.round(affected_parcels * families_per_parcel).astype(int), 10, 1800)
    
    # Historical performance score of executing authority (higher is better)
    hist_perf_mean = 70.0 - (project_complexity * 3.0)
    historical_performance_score = np.clip(np.round(np.random.normal(hist_perf_mean, 12.0, size=num_records), 1), 20.0, 98.0)

    # 3. Route & Alignment Features
    route_affected_parcel_count = affected_parcels
    route_land_area_acres = land_area_acres
    route_affected_households = affected_families
    route_complexity_score = np.clip(project_complexity + np.random.uniform(-0.5, 0.5, size=num_records), 1.0, 5.0)
    estimated_acquisition_cost_cr = np.round(land_area_acres * np.random.uniform(4.5, 14.0, size=num_records) + (affected_families * 0.15), 1)

    # 4. Latent Risk Propensity Driver (Governs correlated generation of bottlenecks)
    # Higher latent_risk -> more legal disputes, slower approvals, lower compensation progress
    latent_risk = (
        0.25 * (project_complexity / 5.0)
        + 0.20 * (land_area_acres / 800.0)
        + 0.20 * (1.0 - (historical_performance_score / 100.0))
        + 0.15 * (affected_families / 1000.0)
        + np.random.normal(0.0, 0.18, size=num_records)
    )
    latent_risk = np.clip((latent_risk - np.percentile(latent_risk, 5)) / (np.percentile(latent_risk, 95) - np.percentile(latent_risk, 5)), 0.0, 1.0)

    # 5. Risk Features (Correlated with latent risk)
    dispute_intensity = np.random.binomial(n=50, p=np.clip(latent_risk * 0.45 + 0.05, 0.02, 0.90), size=num_records)
    legal_disputes_count = np.clip(dispute_intensity, 0, 75)
    disputed_parcels_count = np.clip(np.round(legal_disputes_count * np.random.uniform(1.0, 1.8, size=num_records)).astype(int), 0, affected_parcels)
    route_legal_dispute_exposure = np.round(np.clip((disputed_parcels_count / np.maximum(1, affected_parcels)) * 100.0, 0.0, 100.0), 1)

    pending_approvals_count = np.clip(np.random.poisson(lam=latent_risk * 6.5 + 1.2, size=num_records), 0, 20)
    unresolved_grievances_count = np.clip(np.random.poisson(lam=latent_risk * 8.0 + 1.0, size=num_records), 0, 45)
    administrative_bottlenecks_score = np.round(np.clip(latent_risk * 75.0 + np.random.normal(15.0, 10.0, size=num_records), 5.0, 98.0), 1)
    field_verification_delay_days = np.round(np.clip(latent_risk * 90.0 + np.random.exponential(scale=14.0, size=num_records), 0.0, 180.0), 1)

    # 6. Acquisition Progress Features (Inversely correlated with latent risk)
    compensation_completion_pct = np.round(np.clip((1.0 - latent_risk) * 85.0 + np.random.normal(10.0, 12.0, size=num_records), 0.0, 100.0), 1)
    documentation_completion_pct = np.round(np.clip((1.0 - latent_risk) * 90.0 + np.random.normal(8.0, 10.0, size=num_records), 0.0, 100.0), 1)
    approval_completion_pct = np.round(np.clip((1.0 - (pending_approvals_count / 15.0)) * 90.0 + np.random.normal(5.0, 8.0, size=num_records), 0.0, 100.0), 1)
    possession_pct = np.round(np.clip((compensation_completion_pct * 0.65) + ((1.0 - latent_risk) * 30.0) + np.random.normal(0.0, 6.0, size=num_records), 0.0, 100.0), 1)
    rehabilitation_progress_pct = np.round(np.clip((possession_pct * 0.7) + ((1.0 - latent_risk) * 25.0) + np.random.normal(0.0, 8.0, size=num_records), 0.0, 100.0), 1)
    stakeholder_response_rate = np.round(np.clip((1.0 - latent_risk * 0.7) * 85.0 + np.random.normal(10.0, 9.0, size=num_records), 10.0, 100.0), 1)
    incomplete_documents_count = np.clip(np.round((1.0 - documentation_completion_pct / 100.0) * affected_parcels * 0.8).astype(int), 0, 300)

    # 7. Time Features
    planned_duration_months = np.random.choice([18.0, 24.0, 30.0, 36.0, 42.0, 48.0], size=num_records, p=[0.15, 0.35, 0.25, 0.15, 0.06, 0.04])
    elapsed_duration_months = np.round(np.clip(planned_duration_months * np.random.uniform(0.15, 0.85, size=num_records), 2.0, 40.0), 1)
    avg_approval_time_days = np.round(np.clip(25.0 + (latent_risk * 65.0) + np.random.normal(0.0, 10.0, size=num_records), 10.0, 150.0), 1)
    avg_verification_time_days = np.round(np.clip(14.0 + (latent_risk * 40.0) + np.random.normal(0.0, 7.0, size=num_records), 5.0, 90.0), 1)
    avg_stakeholder_response_days = np.round(np.clip(10.0 + (latent_risk * 30.0) + np.random.normal(0.0, 5.0, size=num_records), 4.0, 60.0), 1)

    # 8. True Ground-Truth Delay Target Generation (Physics of Land Acquisition Delays)
    # Delay score combines all risk components with domain weights
    dispute_factor = (legal_disputes_count / 30.0) * 0.30
    comp_deficit = ((100.0 - compensation_completion_pct) / 100.0) * 0.22
    doc_deficit = ((100.0 - documentation_completion_pct) / 100.0) * 0.18
    approval_deficit = (pending_approvals_count / 10.0) * 0.15
    bottleneck_factor = (administrative_bottlenecks_score / 100.0) * 0.10
    verification_factor = (field_verification_delay_days / 120.0) * 0.08
    stakeholder_factor = ((100.0 - stakeholder_response_rate) / 100.0) * 0.08

    # Non-linear interaction: Compounding penalty if disputes are high AND compensation is low
    interaction_penalty = np.where((legal_disputes_count > 12) & (compensation_completion_pct < 50.0), 0.18, 0.0)

    # Protective buffer from high historical performance
    performance_buffer = (historical_performance_score / 100.0) * 0.12

    delay_propensity = (
        dispute_factor
        + comp_deficit
        + doc_deficit
        + approval_deficit
        + bottleneck_factor
        + verification_factor
        + stakeholder_factor
        + interaction_penalty
        - performance_buffer
        + np.random.normal(0.0, 0.08, size=num_records)
    )

    # Convert to binary delayed target: threshold calibrated to ~42% delay rate
    threshold = np.percentile(delay_propensity, 58)  # Top 42% delayed
    delayed = (delay_propensity >= threshold).astype(int)

    # Delay duration in months (0 for no delay, >0 for delayed cases with non-linear tail)
    excess_risk = np.maximum(0.0, delay_propensity - threshold)
    max_excess = np.maximum(1e-5, np.max(delay_propensity) - threshold)
    base_delay_months = np.where(
        delayed == 1,
        np.clip(
            (excess_risk / max_excess) ** 1.3 * 14.5
            + np.random.exponential(scale=1.5, size=num_records)
            + 1.0,
            0.5,
            18.0,
        ),
        0.0,
    )
    actual_delay_months = np.round(base_delay_months, 1)
    actual_delay_days = np.round(actual_delay_months * 30.0).astype(int)

    # Construct DataFrame
    df = pd.DataFrame({
        "case_id": [f"CASE-{i+1:06d}" for i in range(num_records)],
        "project_type": project_type_choices,
        "state": state_choices,
        "district": district_choices,
        "land_area_acres": land_area_acres,
        "affected_families": affected_families,
        "affected_parcels": affected_parcels,
        "project_complexity": project_complexity,
        "historical_performance_score": historical_performance_score,
        "compensation_completion_pct": compensation_completion_pct,
        "approval_completion_pct": approval_completion_pct,
        "documentation_completion_pct": documentation_completion_pct,
        "possession_pct": possession_pct,
        "rehabilitation_progress_pct": rehabilitation_progress_pct,
        "stakeholder_response_rate": stakeholder_response_rate,
        "legal_disputes_count": legal_disputes_count,
        "disputed_parcels_count": disputed_parcels_count,
        "pending_approvals_count": pending_approvals_count,
        "incomplete_documents_count": incomplete_documents_count,
        "unresolved_grievances_count": unresolved_grievances_count,
        "administrative_bottlenecks_score": administrative_bottlenecks_score,
        "field_verification_delay_days": field_verification_delay_days,
        "planned_duration_months": planned_duration_months,
        "elapsed_duration_months": elapsed_duration_months,
        "avg_approval_time_days": avg_approval_time_days,
        "avg_verification_time_days": avg_verification_time_days,
        "avg_stakeholder_response_days": avg_stakeholder_response_days,
        "route_affected_parcel_count": route_affected_parcel_count,
        "route_land_area_acres": route_land_area_acres,
        "route_affected_households": route_affected_households,
        "route_complexity_score": np.round(route_complexity_score, 1),
        "route_legal_dispute_exposure": route_legal_dispute_exposure,
        "estimated_acquisition_cost_cr": estimated_acquisition_cost_cr,
        "delayed": delayed,
        "actual_delay_months": actual_delay_months,
        "actual_delay_days": actual_delay_days,
    })

    if save_path:
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        df.to_csv(save_path, index=False)
        print(f"Dataset of {len(df)} records saved to: {save_path}")

    return df


if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
    out_csv = os.path.join(backend_dir, "data", "historical_land_acquisitions.csv")
    generate_historical_dataset(num_records=12000, seed=42, save_path=out_csv)
