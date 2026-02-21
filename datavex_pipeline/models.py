"""
DataVex Pipeline — All Pydantic v2 Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional


# ── Agent 1 — Target Discovery ──────────────────────────────

class UserIntent(BaseModel):
    raw_text: str

class DealProfile(BaseModel):
    min_deal_usd: int = 500_000
    max_deal_usd: int = 10_000_000
    target_regions: list[str] = ["India", "US"]
    preferred_company_sizes: list[str] = ["small", "mid", "large"]

class CandidateCompany(BaseModel):
    company_name: str
    domain: str
    industry: str
    size: str  # small | mid | large
    estimated_employees: int
    region: str
    capability_score: float = 0.0
    size_fit: float = 0.0
    geo_fit: float = 0.0
    industry_fit: float = 0.0
    initial_match_score: float = 0.0
    notes: str = ""


# ── Agent 2 — Signal Extraction ─────────────────────────────

class EvidenceItem(BaseModel):
    text: str
    source: str  # careers | news | tech_stack | blog
    recency_days: Optional[int] = None

class Signal(BaseModel):
    label: str
    confidence: float  # 0-1
    evidence: list[EvidenceItem] = []

class CompanySignals(BaseModel):
    company_name: str
    pivot: Optional[Signal] = None
    tech_debt: Optional[Signal] = None
    fiscal_pressure: Optional[Signal] = None
    why_now_triggers: list[dict] = []
    company_state: str = "STABLE"
    raw_texts: list[dict] = []


# ── Agent 3 — Opportunity Scoring ───────────────────────────

class OpportunityScore(BaseModel):
    company_name: str
    opportunity_score: float = 0.0
    priority: str = "LOW"
    timing_window: str = ""
    company_state: str = "STABLE"
    capability_alignment: float = 0.0
    urgency_score: float = 0.0
    strategic_summary: str = ""
    why_we_win: list[str] = []
    risks: list[str] = []
    confidence: float = 0.0


# ── Agent 4 — Decision Maker ────────────────────────────────

class PriorityProfile(BaseModel):
    primary_focus: str = "innovation"
    secondary_focus: str = "scalability"
    risk_tolerance: str = "medium"
    innovation_bias: str = "moderate"
    communication_style: str = "technical"

class DecisionMaker(BaseModel):
    name: str
    role: str
    priority_profile: PriorityProfile = PriorityProfile()
    psychographic_signals: list[str] = []
    messaging_angle: str = ""
    pain_points_aligned: list[str] = []
    persona_risks: list[str] = []
    confidence: float = 0.0

class DecisionMakerOutput(BaseModel):
    company_name: str
    decision_maker: DecisionMaker
    role_selection_rationale: str = ""


# ── Agent 5 — Outreach Generation ───────────────────────────

class OutreachKit(BaseModel):
    company_name: str
    decision_maker_name: str
    decision_maker_role: str
    email: str = ""
    linkedin_dm: str = ""
    call_opener: str = ""
    personalization_notes: list[str] = []
    tone: str = "consultative"
    why_this_message: list[str] = []
    risk_adjustments: list[str] = []
    confidence: float = 0.0


# ── Pipeline Result ─────────────────────────────────────────

class PipelineResult(BaseModel):
    company_name: str
    candidate: CandidateCompany
    signals: CompanySignals
    opportunity: OpportunityScore
    decision_maker: DecisionMakerOutput
    outreach: OutreachKit
