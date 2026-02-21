"""
Agent 1 — Balanced Discovery Agent
"""

import logging
from models import CandidateCompany

logger = logging.getLogger("datavex_pipeline.agent1")

AI_INFRA_COMPANIES = [
    CandidateCompany(
        company_name="MindsDB",
        domain="mindsdb.com",
        industry="AI / Data Infrastructure",
        size="mid",
        estimated_employees=120,
        region="US",
        capability_score=0.8,
        size_fit=0.7,
        geo_fit=0.9,
        industry_fit=0.9,
        notes="AI-in-database startup scaling rapidly"
    ),
    CandidateCompany(
        company_name="Databricks",
        domain="databricks.com",
        industry="Data Platform / AI",
        size="large",
        estimated_employees=9000,
        region="US",
        capability_score=0.6,
        size_fit=0.4,
        geo_fit=0.9,
        industry_fit=0.8,
        notes="Large-scale data/AI platform leader"
    ),
]

AI_SERVICES_COMPANIES = [
    CandidateCompany(
        company_name="Fractal Analytics",
        domain="fractal.ai",
        industry="AI Consulting / Analytics",
        size="large",
        estimated_employees=4000,
        region="India",
        capability_score=0.3,
        size_fit=0.6,
        geo_fit=0.8,
        industry_fit=0.7,
        notes="AI consulting firm — competitor-like"
    )
]

def route_query(query: str):
    q = query.lower()

    if "infra" in q or "platform" in q or "data" in q:
        return AI_INFRA_COMPANIES

    if "consulting" in q or "services" in q:
        return AI_SERVICES_COMPANIES

    return AI_INFRA_COMPANIES + AI_SERVICES_COMPANIES

def run(query: str):
    logger.info(f"AGENT 1 — Discovery for query: {query}")
    companies = route_query(query)
    logger.info(f"AGENT 1 — Returned {len(companies)} companies")
    return companies