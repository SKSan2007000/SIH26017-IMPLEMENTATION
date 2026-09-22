from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class RiskDriver(BaseModel):
    label: str
    contributionPct: int


class CategoryRisk(BaseModel):
    name: str
    pct: int


class RiskPredictionResponse(BaseModel):
    projectId: str
    overallPct: int
    band: str  # 'critical' | 'high' | 'medium' | 'low'
    predictedDelayLabel: str
    confidencePct: int
    trend: List[int]
    trendStatus: str
    categories: List[CategoryRisk]
    drivers: List[RiskDriver]
    originalCompletionMonths: int
    predictedCompletionMonths: int
    delay_probability: Optional[float] = None
    risk_score: Optional[int] = None
    risk_category: Optional[str] = None
    expected_delay_months: Optional[float] = None
    expected_delay_days: Optional[int] = None
    model_version: Optional[str] = "1.0.0-rf"
    recommendations: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True


class RiskFactorResponse(BaseModel):
    id: str
    projectId: str
    factorName: str
    category: str
    score: float
    weight: float
    description: Optional[str] = None
    mitigation: Optional[str] = None

    class Config:
        from_attributes = True


class WhatIfRequest(BaseModel):
    leverIds: List[str]
    customFeatures: Optional[Dict[str, Any]] = None


class WhatIfLeverResponse(BaseModel):
    id: str
    label: str
    resultingRiskPct: int
    reductionPct: Optional[int] = None
    simulatedDelayMonths: Optional[float] = None
    savedTimelineMonths: Optional[float] = None
    description: Optional[str] = None
    isActive: Optional[bool] = False
