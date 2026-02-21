import logging
from models import CandidateCompany

logger = logging.getLogger("datavex_pipeline.agent3")

def compute_conversion_fit(c):
    return (
        0.35 * c.capability_score +
        0.20 * c.size_fit +
        0.20 * c.geo_fit +
        0.25 * c.industry_fit
    )

def compute_timing_boost(why_now):
    if not why_now:
        return 0.0
    return 0.25

def classify_priority(score):
    if score > 0.60:
        return "HIGH"
    elif score > 0.40:
        return "MEDIUM"
    return "LOW"

def run(candidates, signals):

    signal_map = {s["company_name"]: s for s in signals}
    results = []

    for c in candidates:

        s = signal_map[c.company_name]

        if s["fit_type"] == "COMPETITOR":
            continue

        conversion_fit = compute_conversion_fit(c)
        urgency = s["pain_score"]
        timing = compute_timing_boost(s["why_now"])

        score = 0.50 * conversion_fit + 0.35 * urgency + 0.15 * timing
        score = round(score, 3)

        results.append({
            "company_name": c.company_name,
            "priority": classify_priority(score),
            "opportunity_score": score,
            "company_state": s["company_state"],
            "pain_level": s["pain_level"],
            "summary": f"{c.company_name} is scaling rapidly — likely needs help stabilizing data/AI infrastructure."
        })

    return results