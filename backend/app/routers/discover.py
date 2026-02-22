"""
DataVex Backend — Discovery Router
POST /discover — auto-discover target companies using the 5-agent pipeline.
Calls agents 1-5 directly (no orchestrator). Only one scan at a time.
"""
import sys
import os
import threading
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal, ScanRecord, CompanyRecord, new_uuid, utcnow

# ── Add datavex_pipeline to path ─────────────────────────────
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
PIPELINE_DIR = os.path.join(PROJECT_ROOT, "datavex_pipeline")
if PIPELINE_DIR not in sys.path:
    sys.path.insert(0, PIPELINE_DIR)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["discover"])

# ── Rate limiter: one scan at a time ─────────────────────────
_scan_lock = threading.Lock()
_active_scan_id = None


# ── Helpers ──────────────────────────────────────────────────

def _priority_to_confidence(priority: str) -> str:
    return {"HIGH": "HIGH", "MEDIUM": "MEDIUM", "LOW": "LOW"}.get(priority, "LOW")


def _score_int(opportunity_score: float) -> int:
    return max(0, min(100, int(round(opportunity_score * 100))))


# ── Pipeline runner ──────────────────────────────────────────

def _run_discovery_pipeline(scan_id: str):
    """Run the 5-agent pipeline in a background thread. Calls each agent directly."""
    global _active_scan_id

    db = SessionLocal()
    try:
        scan = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
        if not scan:
            return

        scan.status = "running"
        scan.progress = 0.05
        scan.agents_pending = ["DISCOVERY", "SIGNALS", "SCORING", "STRATEGY", "DECISION", "OUTREACH"]
        db.commit()

        # ── Fresh import of pipeline modules ──────────────────
        for mod in list(sys.modules.keys()):
            if mod.startswith(("agent", "config", "models", "orchestrator", "demo_data", "scraper")):
                del sys.modules[mod]

        import agent1_discovery
        import agent2_signals
        import agent3_scoring
        import agent35_strategy
        import agent4_decision_maker
        import agent5_outreach

        # ── Agent 1: Target Discovery ─────────────────────────
        scan.company_name = "Discovering targets..."
        scan.progress = 0.10
        scan.agents_completed = ["DISCOVERY_INIT"]
        db.commit()

        query = "AI analytics, data platform, and ML database companies looking for data engineering and cloud modernization"
        candidates = agent1_discovery.run(query)

        scan.progress = 0.25
        scan.agents_completed = ["DISCOVERY"]
        scan.agents_pending = ["SIGNALS", "SCORING", "STRATEGY", "DECISION", "OUTREACH"]
        db.commit()

        if not candidates:
            scan.status = "failed"
            scan.error_message = "Agent 1 returned no candidates."
            db.commit()
            return

        # ── Agent 2: Signal Extraction ────────────────────────
        signals = agent2_signals.run(candidates)
        signal_map = {s["company_name"]: s for s in signals}

        scan.progress = 0.40
        scan.agents_completed = ["DISCOVERY", "SIGNALS"]
        scan.agents_pending = ["SCORING", "STRATEGY", "DECISION", "OUTREACH"]
        db.commit()

        # ── Agent 3: Opportunity Scoring ──────────────────────
        scored = agent3_scoring.run(candidates, signals)
        scored_map = {s["company_name"]: s for s in scored}

        scan.progress = 0.55
        scan.agents_completed = ["DISCOVERY", "SIGNALS", "SCORING"]
        scan.agents_pending = ["STRATEGY", "DECISION", "OUTREACH"]
        db.commit()

        # ── Agent 3.5: Strategy ───────────────────────────────
        strategies = agent35_strategy.run(scored, signals)
        strategy_map = {s["company_name"]: s for s in strategies}

        scan.progress = 0.65
        scan.agents_completed = ["DISCOVERY", "SIGNALS", "SCORING", "STRATEGY"]
        scan.agents_pending = ["DECISION", "OUTREACH"]
        db.commit()

        # ── Agent 4: Decision Maker ───────────────────────────
        decisions = agent4_decision_maker.run(scored)
        decision_map = {d["company_name"]: d for d in decisions}

        scan.progress = 0.80
        scan.agents_completed = ["DISCOVERY", "SIGNALS", "SCORING", "STRATEGY", "DECISION"]
        scan.agents_pending = ["OUTREACH"]
        db.commit()

        # ── Agent 5: Outreach ─────────────────────────────────
        outreach_list = agent5_outreach.run(decisions)
        outreach_map = {o["company_name"]: o for o in outreach_list}

        scan.progress = 0.90
        scan.agents_completed = ["DISCOVERY", "SIGNALS", "SCORING", "STRATEGY", "DECISION", "OUTREACH"]
        scan.agents_pending = []
        db.commit()

        # ── Assemble and save each company ────────────────────
        for candidate in candidates:
            name = candidate.company_name
            slug = name.lower().replace(" ", "-").replace(".", "")

            a1 = {
                "company_name": name,
                "domain": candidate.domain,
                "industry": candidate.industry,
                "size": candidate.size,
                "estimated_employees": candidate.estimated_employees,
                "region": candidate.region,
            }

            a2 = signal_map.get(name, {})
            a3 = scored_map.get(name, {})
            a35 = strategy_map.get(name, {})
            a4 = decision_map.get(name, {})
            a5 = outreach_map.get(name, {})

            # Scores for top-level indexed columns
            opp_score = a3.get("opportunity_score", 0.5)
            priority = a3.get("priority", "LOW")
            score_int = _score_int(opp_score)
            confidence = _priority_to_confidence(priority)

            # Pain level from agent2
            pain_level = a2.get("pain_level", "LOW")

            # Receptivity string from priority
            receptivity_map = {
                "HIGH":   "HIGH — ACT WITHIN 90 DAYS",
                "MEDIUM": "MODERATE — ACT WITHIN 6 MONTHS",
                "LOW":    "LOW — MONITOR",
            }
            receptivity = receptivity_map.get(priority, "LOW — MONITOR")

            # Descriptor string
            descriptor = f"{a1['industry']} · {a1['estimated_employees']} employees · {a1['size']} · {a1['region']}"

            # Signal confidence for coverage
            sig_confidence = a3.get("opportunity_score", 0.5)

            # Build flat data blob — all agents namespaced
            data = {
                "descriptor": descriptor,
                "receptivity": receptivity,
                "pain_level": pain_level,
                "pain_tags": [pain_level + " PAIN"],

                "agent1": a1,
                "agent2": {
                    "fit_type":        a2.get("fit_type", "TARGET"),
                    "company_state":   a2.get("company_state", "UNKNOWN"),
                    "expansion_score": a2.get("expansion_score", 0.0),
                    "strain_score":    a2.get("strain_score", 0.0),
                    "risk_score":      a2.get("risk_score", 0.0),
                    "pain_score":      a2.get("pain_score", 0.0),
                    "pain_level":      pain_level,
                    "signals":         a2.get("signals", []),
                },
                "agent3": {
                    "priority":         priority,
                    "opportunity_score": opp_score,
                    "intent_score":     a3.get("intent_score", 0.0),
                    "conversion_score": a3.get("conversion_score", 0.0),
                    "deal_size_score":  a3.get("deal_size_score", 0.0),
                    "expansion_score":  a3.get("expansion_score", 0.0),
                    "strain_score":     a3.get("strain_score", 0.0),
                    "risk_score":       a3.get("risk_score", 0.0),
                    "key_signals":      a3.get("key_signals", []),
                    "summary":          a3.get("summary", ""),
                },
                "agent35": {
                    "buying_style":   a35.get("buying_style", ""),
                    "tech_strength":  a35.get("tech_strength", 0.0),
                    "offer":          a35.get("offer", ""),
                    "entry_point":    a35.get("entry_point", ""),
                    "strategy_note":  a35.get("strategy_note", ""),
                },
                "agent4": {
                    "priority":          a4.get("priority", "LOW"),
                    "strategy":          a4.get("strategy", "MONITOR"),
                    "recommended_offer": a4.get("recommended_offer", ""),
                    "entry_point":       a4.get("entry_point", ""),
                    "intent_score":      a4.get("intent_score", 0.0),
                    "conversion_score":  a4.get("conversion_score", 0.0),
                    "deal_size_score":   a4.get("deal_size_score", 0.0),
                    "risk_score":        a4.get("risk_score", 0.0),
                    "key_signals":       a4.get("key_signals", []),
                },
                "agent5": {
                    "persona":           a5.get("persona", ""),
                    "channel":           a5.get("channel", ""),
                    "subject":           a5.get("subject", ""),
                    "message":           a5.get("message", ""),
                    "priority":          a5.get("priority", "LOW"),
                    "conversion_score":  a5.get("conversion_score", 0.0),
                    "deal_size_score":   a5.get("deal_size_score", 0.0),
                },

                # Legacy fields kept so existing frontend code doesn't break
                "financials":     {"quarters": [], "margin": [], "revenue": []},
                "hiring":         [],
                "scoreBreakdown": [
                    {"label": "Intent",       "value": int(a3.get("intent_score", 0) * 35),     "max": 35},
                    {"label": "Conversion",   "value": int(a3.get("conversion_score", 0) * 25), "max": 25},
                    {"label": "Deal Size",    "value": int(a3.get("deal_size_score", 0) * 20),  "max": 20},
                    {"label": "Signal Depth", "value": int(a2.get("expansion_score", 0) * 20),  "max": 20},
                ],
                "timeline": [],
                "painClusters": [],
                "decisionMaker": {
                    "name": a4.get("strategy", ""),
                    "role": a5.get("persona", ""),
                    "messaging": {
                        "angle": a4.get("recommended_offer", ""),
                        "vocab": a4.get("key_signals", []),
                        "tone":  a4.get("strategy", "consultative"),
                    }
                },
                "outreach": {
                    "email":    a5.get("message", ""),
                    "linkedin": a5.get("message", ""),
                    "opener":   a5.get("subject", ""),
                    "footnote": f"Channel: {a5.get('channel', '')} · Strategy: {a4.get('strategy', '')}",
                },
                "capabilityMatch": [],
                "strongestMatch":  {},
                "trace": [
                    {"time": "00:01", "agent": "TARGET_DISCOVERY",   "action": f"Found {name} — {a1['industry']}, {a1['size']}, {a1['region']}"},
                    {"time": "00:05", "agent": "SIGNAL_EXTRACTION",  "action": f"Pain: {pain_level} (expansion={a2.get('expansion_score', 0):.2f}, strain={a2.get('strain_score', 0):.2f}, risk={a2.get('risk_score', 0):.2f})"},
                    {"time": "00:10", "agent": "OPPORTUNITY_SCORING", "action": f"Score: {score_int}/100, Priority: {priority}, Intent: {a3.get('intent_score', 0):.2f}, Conversion: {a3.get('conversion_score', 0):.2f}"},
                    {"time": "00:14", "agent": "STRATEGY",           "action": f"Style: {a35.get('buying_style', '')} — {a35.get('offer', '')}"},
                    {"time": "00:18", "agent": "DECISION_MAKER",     "action": f"Strategy: {a4.get('strategy', '')} → {a4.get('recommended_offer', '')} via {a4.get('entry_point', '')}"},
                    {"time": "00:24", "agent": "OUTREACH",           "action": f"Persona: {a5.get('persona', '')} · Channel: {a5.get('channel', '')} · Subject: {a5.get('subject', '')}"},
                ],
            }

            # Upsert company record
            existing = db.query(CompanyRecord).filter(CompanyRecord.id == slug).first()
            if existing:
                existing.score      = score_int
                existing.confidence = confidence
                existing.coverage   = int(sig_confidence * 100)
                existing.descriptor = descriptor
                existing.data       = data
                existing.updated_at = utcnow()
            else:
                db.add(CompanyRecord(
                    id          = slug,
                    scan_id     = scan_id,
                    name        = name,
                    descriptor  = descriptor,
                    score       = score_int,
                    confidence  = confidence,
                    coverage    = int(sig_confidence * 100),
                    data        = data,
                    created_at  = utcnow(),
                    updated_at  = utcnow(),
                ))
            db.commit()
            logger.info(f"Saved company: {name} (score={score_int}, priority={priority})")

        # ── Mark complete ─────────────────────────────────────
        scan.status       = "completed"
        scan.progress     = 1.0
        scan.completed_at = utcnow()
        db.commit()
        logger.info(f"Discovery scan {scan_id} completed — {len(candidates)} companies saved")

    except Exception as e:
        logger.error(f"Discovery pipeline error: {e}", exc_info=True)
        try:
            scan = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
            if scan:
                scan.status        = "failed"
                scan.error_message = str(e)[:500]
                db.commit()
        except Exception:
            pass
    finally:
        db.close()
        _active_scan_id = None
        _scan_lock.release()


# ── Routes ────────────────────────────────────────────────────

@router.post("/discover")
def trigger_discovery(db: Session = Depends(get_db)):
    """
    Auto-discover target companies using the 5-agent pipeline.
    Only one scan runs at a time.
    """
    global _active_scan_id

    if not _scan_lock.acquire(blocking=False):
        raise HTTPException(
            status_code=429,
            detail=f"A scan is already running (ID: {_active_scan_id}). Wait for it to finish."
        )

    scan_id        = new_uuid()
    _active_scan_id = scan_id

    scan = ScanRecord(
        id           = scan_id,
        user_request = "Auto-discover target companies",
        status       = "queued",
        progress     = 0.0,
        created_at   = utcnow(),
    )
    db.add(scan)
    db.commit()

    threading.Thread(
        target=_run_discovery_pipeline,
        args=(scan_id,),
        daemon=True,
    ).start()

    logger.info(f"Discovery scan {scan_id} queued")
    return {
        "scan_id":                    scan_id,
        "status":                     "queued",
        "estimated_duration_seconds": 30,
        "message":                    "5-agent pipeline starting...",
    }


@router.get("/discover/{scan_id}")
def get_discovery_status(scan_id: str, db: Session = Depends(get_db)):
    """Check discovery scan progress."""
    scan = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    return {
        "scan_id":          scan.id,
        "status":           scan.status,
        "progress":         scan.progress or 0.0,
        "company_name":     scan.company_name,
        "agents_completed": scan.agents_completed or [],
        "agents_pending":   scan.agents_pending   or [],
        "error_message":    scan.error_message,
    }
