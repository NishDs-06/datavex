"""
Agent 2 — SignalExtractionAgent
Extracts structured business signals with evidence from raw company data.
"""
import logging
from models import CandidateCompany, CompanySignals, Signal, EvidenceItem
from config import llm_call_with_retry
from demo_data import DEMO_COMPANIES

logger = logging.getLogger("datavex_pipeline.agent2")


def get_demo_signals(company_name: str) -> dict | None:
    """Look up pre-built signal data for demo companies."""
    for demo in DEMO_COMPANIES:
        if demo["company_name"] == company_name:
            return demo
    return None


def build_evidence_list(raw_items: list[dict]) -> list[EvidenceItem]:
    """Convert raw signal dicts to EvidenceItem models."""
    return [
        EvidenceItem(
            text=item["text"],
            source=item["source"],
            recency_days=item.get("recency_days"),
        )
        for item in raw_items
    ]


def compute_confidence(evidence: list[EvidenceItem]) -> float:
    """confidence = min(1.0, 0.3 + 0.1 * num_evidence_points)"""
    return min(1.0, 0.3 + 0.1 * len(evidence))


def classify_state(signals: dict, all_evidence: list[dict]) -> str:
    """Apply contradiction detection rules to determine company state."""
    all_text = " ".join(e.get("text", "") for e in all_evidence).lower()

    has_hiring = any(kw in all_text for kw in ["hiring", "roles", "engineer", "architect"])
    has_layoffs = any(kw in all_text for kw in ["layoff", "laid off", "cut", "reduce workforce"])
    has_legacy = any(kw in all_text for kw in ["legacy", "monolith", "migration", "technical debt", "tech debt"])
    has_cloud = any(kw in all_text for kw in ["cloud", "kubernetes", "microservices", "k8s", "aws"])
    has_cost_cutting = any(kw in all_text for kw in ["cost", "burn", "profitability", "budget", "layoff"])
    has_ai_investment = any(kw in all_text for kw in ["ai", "ml", "machine learning", "model", "inference"])
    has_growth = any(kw in all_text for kw in ["series", "raised", "funding", "expand", "growth", "revenue"])

    # Rule-based classification
    if has_hiring and has_layoffs:
        return "RESTRUCTURING"
    if has_legacy and has_cloud:
        return "TECH_MODERNIZATION"
    if has_cost_cutting and has_ai_investment:
        return "COST_OPTIMIZATION"
    if has_growth and has_hiring and not has_layoffs:
        return "GROWTH"
    return "STABLE"


def extract_signals_llm(company_name: str, raw_texts: list[dict]) -> dict:
    """Use LLM to classify raw text data into structured signals."""
    texts_formatted = "\n".join(f"[{t['source']}] {t['text']}" for t in raw_texts[:10])

    result = llm_call_with_retry(
        prompt=f"""Company: {company_name}

Raw signal data:
{texts_formatted}

Classify these into:
- pivot: any strategic direction change (new market, product shift, enterprise expansion)
- tech_debt: legacy systems, migration challenges, infrastructure issues
- fiscal_pressure: cost cutting, layoffs, burn rate concerns, funding pressure

Return JSON: {{"pivot": {{"label": "str", "evidence_indices": [int]}}, "tech_debt": {{"label": "str", "evidence_indices": [int]}}, "fiscal_pressure": {{"label": "str", "evidence_indices": [int]}}}}
Use null for any signal category with no evidence. evidence_indices are 0-based indices into the raw data list.""",
        system="You are a B2B signal extraction agent. Classify company data into strategic signals. Be specific about labels."
    )
    return result


def run(candidates: list[CandidateCompany]) -> list[CompanySignals]:
    """Run Agent 2: extract signals for each candidate company."""
    logger.info(f"AGENT 2 — SignalExtraction: processing {len(candidates)} companies")
    results = []

    for candidate in candidates:
        logger.info(f"  Extracting signals for {candidate.company_name}")

        # Get demo data or generate via LLM
        demo = get_demo_signals(candidate.company_name)
        if demo:
            raw_signals = demo["raw_signals"]
            why_now = demo.get("why_now_triggers", [])
        else:
            raw_signals = {"careers": [], "news": [], "tech_stack": [], "blog": []}
            why_now = []

        # Flatten all raw texts
        all_raw = []
        for category in ["careers", "news", "tech_stack", "blog"]:
            all_raw.extend(raw_signals.get(category, []))

        # Build evidence lists per category
        careers_evidence = build_evidence_list(raw_signals.get("careers", []))
        news_evidence = build_evidence_list(raw_signals.get("news", []))
        tech_evidence = build_evidence_list(raw_signals.get("tech_stack", []))
        blog_evidence = build_evidence_list(raw_signals.get("blog", []))
        all_evidence = careers_evidence + news_evidence + tech_evidence + blog_evidence

        # LLM signal extraction
        llm_signals = extract_signals_llm(candidate.company_name, all_raw)

        # Build Signal objects
        pivot_signal = None
        if llm_signals.get("pivot"):
            pivot_data = llm_signals["pivot"]
            pivot_evidence = []
            for idx in pivot_data.get("evidence_indices", []):
                if 0 <= idx < len(all_evidence):
                    pivot_evidence.append(all_evidence[idx])
            if not pivot_evidence and all_evidence:
                pivot_evidence = [all_evidence[0]]
            pivot_signal = Signal(
                label=pivot_data.get("label", "Strategic pivot detected"),
                confidence=compute_confidence(pivot_evidence),
                evidence=pivot_evidence,
            )

        tech_debt_signal = None
        if llm_signals.get("tech_debt"):
            td_data = llm_signals["tech_debt"]
            td_evidence = []
            for idx in td_data.get("evidence_indices", []):
                if 0 <= idx < len(all_evidence):
                    td_evidence.append(all_evidence[idx])
            if not td_evidence and all_evidence:
                td_evidence = [e for e in all_evidence if any(kw in e.text.lower() for kw in ["legacy", "monolith", "debt", "migration"])]
            tech_debt_signal = Signal(
                label=td_data.get("label", "Technical debt detected"),
                confidence=compute_confidence(td_evidence),
                evidence=td_evidence,
            )

        fiscal_signal = None
        if llm_signals.get("fiscal_pressure"):
            fp_data = llm_signals["fiscal_pressure"]
            fp_evidence = []
            for idx in fp_data.get("evidence_indices", []):
                if 0 <= idx < len(all_evidence):
                    fp_evidence.append(all_evidence[idx])
            if not fp_evidence and all_evidence:
                fp_evidence = [e for e in all_evidence if any(kw in e.text.lower() for kw in ["cost", "layoff", "burn", "profitability"])]
            fiscal_signal = Signal(
                label=fp_data.get("label", "Fiscal pressure detected"),
                confidence=compute_confidence(fp_evidence),
                evidence=fp_evidence,
            )

        # Classify state
        company_state = classify_state(llm_signals, all_raw)

        signals = CompanySignals(
            company_name=candidate.company_name,
            pivot=pivot_signal,
            tech_debt=tech_debt_signal,
            fiscal_pressure=fiscal_signal,
            why_now_triggers=why_now,
            company_state=company_state,
            raw_texts=all_raw,
        )
        results.append(signals)
        logger.info(f"  {candidate.company_name}: state={company_state}, pivot={pivot_signal is not None}, tech_debt={tech_debt_signal is not None}, fiscal={fiscal_signal is not None}")

    return results
