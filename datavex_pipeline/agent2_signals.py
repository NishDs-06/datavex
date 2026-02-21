import logging
from models import EvidenceItem

logger = logging.getLogger("datavex_pipeline.agent2")

COMPETITOR_KEYWORDS = ["consulting", "analytics services", "ai consulting"]
PLATFORM_KEYWORDS = ["platform", "data platform", "ai platform"]

def run(candidates):

    outputs = []

    for c in candidates:

        name = c.company_name.lower()

        if "fractal" in name:
            fit = "COMPETITOR"
        elif "databricks" in name or "mindsdb" in name:
            fit = "TARGET"
        else:
            fit = "TARGET"

        outputs.append({
            "company_name": c.company_name,
            "fit_type": fit,
            "company_state": "SCALE_UP",
            "pain_level": "LOW",
            "pain_score": 0.15,
            "signals": [
                {"type": "SCALING", "label": "Active hiring", "confidence": 1.0},
                {"type": "FUNDING", "label": "Raised capital", "confidence": 1.0},
            ],
            "why_now": [
                {"event": "Recent hiring push", "recency_days": 20, "impact": "high"}
            ],
        })

    return outputs