"""
DataVex Pipeline — Orchestrator
Runs the full 5-agent pipeline sequentially with progress tracking.
"""
import json
import logging
import time
from datetime import datetime

from models import (
    UserIntent, DealProfile, PipelineResult,
    CandidateCompany, CompanySignals, OpportunityScore,
    DecisionMakerOutput, OutreachKit,
)
import agent1_discovery
import agent2_signals
import agent3_scoring
import agent4_decision_maker
import agent5_outreach
import agent6_recommender

logger = logging.getLogger("datavex_pipeline")

# ── Live Tracker ────────────────────────────────────────────
TRACKER_PATH = "tracker.md"


def _update_tracker(stage: str, details: str):
    """Append progress to tracker.md for live pickup."""
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"| {ts} | {stage} | {details} |\n"
    try:
        with open(TRACKER_PATH, "a") as f:
            f.write(line)
    except Exception:
        pass


def _init_tracker(user_input: str):
    """Initialize the tracker file."""
    with open(TRACKER_PATH, "w") as f:
        f.write(f"# DataVex Pipeline — Live Tracker\n\n")
        f.write(f"**Query:** {user_input}\n")
        f.write(f"**Started:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("| Time | Stage | Details |\n")
        f.write("|------|-------|---------|\n")


# ── Pipeline ────────────────────────────────────────────────

def run_pipeline(user_input: str, deal_profile: dict | None = None) -> list[PipelineResult]:
    """
    Run the full 5-agent pipeline.

    Args:
        user_input: Natural language query, e.g. "mid-size fintech SaaS companies doing AI in India"
        deal_profile: Optional dict with min_deal_usd, max_deal_usd, target_regions, preferred_company_sizes

    Returns:
        List of PipelineResult, one per qualifying company.
    """
    start = time.time()

    # Parse inputs
    intent = UserIntent(raw_text=user_input)
    profile = DealProfile(**(deal_profile or {}))

    _init_tracker(user_input)
    _update_tracker("INIT", f"Intent: {user_input[:80]}")

    # ── Agent 1: Target Discovery ───────────────────────────
    print("\n╔══════════════════════════════════════════════════╗")
    print("║  Agent 1 — Target Discovery                     ║")
    print("╚══════════════════════════════════════════════════╝")
    t1 = time.time()
    candidates = agent1_discovery.run(intent, profile)
    _update_tracker("AGENT 1 ✓", f"{len(candidates)} candidates: {', '.join(c.company_name for c in candidates)} ({time.time()-t1:.1f}s)")

    if not candidates:
        print("  ⚠ No candidates found above threshold. Exiting.")
        _update_tracker("EXIT", "No candidates above 0.4 threshold")
        return []

    for c in candidates:
        print(f"  ✓ {c.company_name:20s} score={c.initial_match_score:.3f}  cap={c.capability_score:.2f}  size={c.size_fit:.1f}  geo={c.geo_fit:.1f}")

    # ── Agent 2: Signal Extraction ──────────────────────────
    print("\n╔══════════════════════════════════════════════════╗")
    print("║  Agent 2 — Signal Extraction                    ║")
    print("╚══════════════════════════════════════════════════╝")
    t2 = time.time()
    all_signals = agent2_signals.run(candidates)
    _update_tracker("AGENT 2 ✓", f"Signals extracted for {len(all_signals)} companies ({time.time()-t2:.1f}s)")

    for s in all_signals:
        print(f"  ✓ {s.company_name:20s} state={s.company_state:20s} pivot={'YES' if s.pivot else 'NO':3s}  debt={'YES' if s.tech_debt else 'NO':3s}  fiscal={'YES' if s.fiscal_pressure else 'NO':3s}")

    # ── Agent 3: Opportunity Scoring ────────────────────────
    print("\n╔══════════════════════════════════════════════════╗")
    print("║  Agent 3 — Opportunity Scoring                  ║")
    print("╚══════════════════════════════════════════════════╝")
    t3 = time.time()
    opportunities = agent3_scoring.run(candidates, all_signals)
    _update_tracker("AGENT 3 ✓", f"Scored: {', '.join(f'{o.company_name}={o.priority}' for o in opportunities)} ({time.time()-t3:.1f}s)")

    for o in opportunities:
        print(f"  ✓ {o.company_name:20s} score={o.opportunity_score:.3f}  priority={o.priority:6s}  cap_align={o.capability_alignment:.2f}  urgency={o.urgency_score:.2f}")

    # ── Agent 4: Decision Maker ─────────────────────────────
    print("\n╔══════════════════════════════════════════════════╗")
    print("║  Agent 4 — Decision Maker Identification        ║")
    print("╚══════════════════════════════════════════════════╝")
    t4 = time.time()
    decision_makers = agent4_decision_maker.run(opportunities, all_signals)
    _update_tracker("AGENT 4 ✓", f"DMs: {', '.join(f'{d.decision_maker.name}({d.decision_maker.role})' for d in decision_makers)} ({time.time()-t4:.1f}s)")

    for d in decision_makers:
        dm = d.decision_maker
        print(f"  ✓ {d.company_name:20s} DM={dm.name:20s} role={dm.role:25s} style={dm.priority_profile.communication_style}")

    # ── Agent 6: What to Sell Recommender (RAG + LLM) ───────────
    print("\n╔══════════════════════════════════════════════════╗")
    print("║  Agent 6 — What to Sell (RAG Recommender)      ║")
    print("╚══════════════════════════════════════════════════╝")
    t6 = time.time()
    recommendations = agent6_recommender.run(decision_makers, all_signals)
    _update_tracker("AGENT 6 ✓", f"Recommendations: {', '.join(r['company_name'] + '=' + r['lead_service'] for r in recommendations)} ({time.time()-t6:.1f}s)")

    for r in recommendations:
        print(f"  ✓ {r['company_name']:20s} lead={r['lead_service']:35s} confidence={r['confidence']}")

    # ── Agent 5: Outreach Generation ───────────────────────────────
    print("\n╔══════════════════════════════════════════════════╗")
    print("║  Agent 5 — Outreach Generation (LLM)            ║")
    print("╚══════════════════════════════════════════════════╝")
    t5 = time.time()
    outreach_kits = agent5_outreach.run(decision_makers, recommendations, all_signals)
    _update_tracker("AGENT 5 ✓", f"Outreach generated for {len(outreach_kits)} targets ({time.time()-t5:.1f}s)")

    for ok in outreach_kits:
        print(f"  ✓ {ok.company_name:20s} tone={ok.tone:15s} confidence={ok.confidence:.2f}")

    # ── Assemble Results ────────────────────────────────────
    results = []
    for cand, sig, opp, dm, out in zip(candidates, all_signals, opportunities, decision_makers, outreach_kits):
        results.append(PipelineResult(
            company_name=cand.company_name,
            candidate=cand,
            signals=sig,
            opportunity=opp,
            decision_maker=dm,
            outreach=out,
        ))

    elapsed = time.time() - start
    _update_tracker("DONE", f"Pipeline complete. {len(results)} results. Total: {elapsed:.1f}s")

    print(f"\n{'='*60}")
    print(f"  Pipeline complete — {len(results)} results in {elapsed:.1f}s")
    print(f"{'='*60}")

    return results


# ── CLI Summary Printer ─────────────────────────────────────

def print_detailed_results(results: list[PipelineResult]):
    """Print a structured trace for each company."""
    for r in results:
        opp = r.opportunity
        dm = r.decision_maker.decision_maker
        out = r.outreach

        print(f"\n{'━'*70}")
        print(f"  {r.company_name}")
        print(f"  {opp.company_state} | {opp.priority} priority | Score: {opp.opportunity_score:.3f}")
        print(f"{'━'*70}")

        print(f"\n  ┌─ CANDIDATE ───────────────────────────────")
        print(f"  │ Industry: {r.candidate.industry}  |  Size: {r.candidate.size}  |  Employees: {r.candidate.estimated_employees}")
        print(f"  │ Region: {r.candidate.region}  |  Domain: {r.candidate.domain}")
        print(f"  │ Match: cap={r.candidate.capability_score:.2f}  size={r.candidate.size_fit:.1f}  geo={r.candidate.geo_fit:.1f}  ind={r.candidate.industry_fit:.1f}")

        print(f"\n  ┌─ SIGNALS ─────────────────────────────────")
        for sig_name, sig in [("Pivot", r.signals.pivot), ("Tech Debt", r.signals.tech_debt), ("Fiscal", r.signals.fiscal_pressure)]:
            if sig:
                print(f"  │ {sig_name}: {sig.label} (conf={sig.confidence:.2f})")
                for e in sig.evidence[:2]:
                    print(f"  │   [{e.source}] {e.text[:90]}...")
        if r.signals.why_now_triggers:
            print(f"  │ Triggers: {', '.join(t.get('event','')[:50] for t in r.signals.why_now_triggers[:3])}")

        print(f"\n  ┌─ OPPORTUNITY ──────────────────────────────")
        print(f"  │ Score: {opp.opportunity_score:.3f}  |  Priority: {opp.priority}  |  Window: {opp.timing_window}")
        print(f"  │ Cap Alignment: {opp.capability_alignment:.2f}  |  Urgency: {opp.urgency_score:.2f}  |  Confidence: {opp.confidence:.2f}")
        print(f"  │ Summary: {opp.strategic_summary[:120]}...")
        if opp.why_we_win:
            print(f"  │ Why we win:")
            for w in opp.why_we_win[:3]:
                print(f"  │   • {w[:90]}")
        if opp.risks:
            print(f"  │ Risks:")
            for risk in opp.risks[:2]:
                print(f"  │   ⚠ {risk[:90]}")

        print(f"\n  ┌─ DECISION MAKER ─────────────────────────")
        print(f"  │ {dm.name} — {dm.role}")
        print(f"  │ Focus: {dm.priority_profile.primary_focus} / {dm.priority_profile.secondary_focus}")
        print(f"  │ Style: {dm.priority_profile.communication_style}  |  Risk: {dm.priority_profile.risk_tolerance}")
        print(f"  │ Angle: {dm.messaging_angle[:100]}")
        if dm.pain_points_aligned:
            print(f"  │ Pain: {', '.join(dm.pain_points_aligned[:3])}")

        print(f"\n  ┌─ OUTREACH KIT ────────────────────────────")
        print(f"  │ Tone: {out.tone}  |  Confidence: {out.confidence:.2f}")
        print(f"  │")
        print(f"  │ ── EMAIL ──")
        for line in out.email.split("\n")[:8]:
            print(f"  │ {line}")
        if len(out.email.split("\n")) > 8:
            print(f"  │ ...")
        print(f"  │")
        print(f"  │ ── LINKEDIN ──")
        print(f"  │ {out.linkedin_dm[:200]}")
        print(f"  │")
        print(f"  │ ── CALL OPENER ──")
        print(f"  │ {out.call_opener[:200]}")
        print(f"  │")
        print(f"  │ ── TRACEABILITY ──")
        for note in out.personalization_notes[:3]:
            print(f"  │   📌 {note[:90]}")
        for why in out.why_this_message[:3]:
            print(f"  │   🔗 {why[:90]}")
        for ra in out.risk_adjustments[:2]:
            print(f"  │   ⚙ {ra[:90]}")
