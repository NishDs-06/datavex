import logging
from models import CandidateCompany

logger = logging.getLogger("datavex_pipeline.agent1")


# ---------------------------------------------------
# SIMPLE HEURISTICS FOR DEMO DATA
# ---------------------------------------------------

def estimate_internal_tech_strength(name: str) -> float:
    """
    Rough heuristic for internal engineering capability
    """

    name = name.lower()

    if "databricks" in name:
        return 0.85   # very strong infra team
    if "snowflake" in name:
        return 0.9
    if "fractal" in name:
        return 0.6
    if "mindsdb" in name:
        return 0.4    # growing but not huge infra team

    return 0.5  # default mid


def estimate_company_size(name: str):
    """
    Very rough size proxies for demo
    """
    name = name.lower()

    if "databricks" in name:
        return "LARGE", 9000
    if "fractal" in name:
        return "LARGE", 4000
    if "mindsdb" in name:
        return "MID", 150

    return "MID", 300


def estimate_geo(name: str):
    if name.lower() in ["databricks", "mindsdb"]:
        return "US"
    return "GLOBAL"


# ---------------------------------------------------
# MAIN ENTRY
# ---------------------------------------------------

def run(query: str):

    # Demo static discovery list
    discovered = [
        {"company_name": "MindsDB", "domain": "AI / Data Infrastructure", "industry": "AI Infra"},
        {"company_name": "Databricks", "domain": "Data Platform / AI", "industry": "Data Platform"},
    ]

    results = []

    for d in discovered:

        name = d["company_name"]

        size_label, employees = estimate_company_size(name)
        geo = estimate_geo(name)
        internal_strength = estimate_internal_tech_strength(name)

        # basic alignment scores (you can refine later)
        size_fit = 0.8 if size_label in ["MID", "LARGE"] else 0.6
        geo_fit = 0.9 if geo == "US" else 0.7
        industry_fit = 0.9
        capability_score = 1 - internal_strength  # higher gap = better fit

        c = CandidateCompany(
            company_name=name,
            domain=d["domain"],
            industry=d["industry"],
            size=size_label,
            estimated_employees=employees,
            region=geo,

            capability_score=capability_score,
            size_fit=size_fit,
            geo_fit=geo_fit,
            industry_fit=industry_fit,

            initial_match_score=0.8,
            internal_tech_strength=internal_strength,
            conversion_bias=0.0,
            conversion_score=0.0,
            notes="Auto-generated discovery candidate"
        )

        results.append(c)

    return results