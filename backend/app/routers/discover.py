"""
DataVex Backend — Discovery Router
POST /discover — auto-discover target companies using the 5-agent pipeline.
Only one scan runs at a time (rate limiting for Ollama).
"""
import sys
import os
import threading
import logging
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal, ScanRecord, CompanyRecord, new_uuid, utcnow

# Add datavex_pipeline to path (project_root/datavex_pipeline)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
PIPELINE_DIR = os.path.join(PROJECT_ROOT, "datavex_pipeline")
if PIPELINE_DIR not in sys.path:
    sys.path.insert(0, PIPELINE_DIR)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["discover"])

# ── Rate limiter: only one scan at a time ────────────────
_scan_lock = threading.Lock()
_active_scan_id = None


def _run_discovery_pipeline(scan_id: str):
    """Run the 5-agent pipeline in a background thread."""
    global _active_scan_id

    # Configure pipeline to use Ollama
    os.environ["LLM_MODEL"] = os.getenv("BYTEZ_MODEL", "llama3.1:8b")
    os.environ["OPENAI_API_KEY"] = os.getenv("BYTEZ_API_KEY", "ollama")
    os.environ["BYTEZ_API_KEY"] = os.getenv("BYTEZ_API_KEY", "ollama")
    os.environ["BYTEZ_BASE_URL"] = os.getenv("BYTEZ_BASE_URL", "http://100.109.131.90:11434/v1")

    # Force reimport of pipeline modules so they pick up env vars
    for mod_name in list(sys.modules.keys()):
        if mod_name.startswith(("config", "models", "agent", "orchestrator", "demo_data")):
            del sys.modules[mod_name]

    db = SessionLocal()
    try:
        scan = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
        if not scan:
            return

        scan.status = "running"
        scan.progress = 0.1
        scan.agents_pending = ["DISCOVERY", "SIGNALS", "SCORING", "DECISION_MAKER", "OUTREACH"]
        db.commit()

        # Import pipeline modules fresh
        from orchestrator import run_pipeline

        # Default query for DataVex's target market
        user_input = "AI analytics, data platform, and ML database companies looking for data engineering and cloud modernization"

        # Update scan
        scan.company_name = "Auto-Discovery"
        scan.progress = 0.15
        scan.agents_completed = ["DISCOVERY_INIT"]
        db.commit()

        # Run the full 5-agent pipeline
        results = run_pipeline(user_input)

        scan.progress = 0.9
        scan.agents_completed = ["DISCOVERY", "SIGNALS", "SCORING", "DECISION_MAKER", "OUTREACH"]
        scan.agents_pending = []
        db.commit()

        # Store each company result in the database
        for r in results:
            company_slug = r.company_name.lower().replace(" ", "-").replace(".", "")

            # Get the decision maker info — r.decision_maker is DecisionMakerOutput, .decision_maker is the actual DecisionMaker
            dm_output = r.decision_maker
            dm = dm_output.decision_maker if dm_output else None
            dm_data = {}
            if dm:
                dm_data = {
                    "name": dm.role,  # Use role title like "CTO" — not a hallucinated name
                    "role": f"{dm.role} · {r.company_name}",
                    "topics": dm.pain_points_aligned[:3] if dm.pain_points_aligned else [],
                    "messaging": {
                        "angle": dm.messaging_angle or "",
                        "vocab": dm.psychographic_signals[:4] if dm.psychographic_signals else [],
                        "tone": dm.priority_profile.communication_style if dm.priority_profile else "consultative",
                    }
                }

            # Build outreach data
            outreach_data = {}
            if r.outreach:
                outreach_data = {
                    "email": r.outreach.email or "",
                    "linkedin": r.outreach.linkedin_dm or "",
                    "opener": r.outreach.call_opener or "",
                    "footnote": f"Generated via DataVex 5-agent pipeline · Tone: {r.outreach.tone}",
                }

            # Build signals into timeline — why_now_triggers are dicts with 'event' key
            timeline = []
            if r.signals:
                for trigger in (r.signals.why_now_triggers or []):
                    trigger_text = trigger.get("event", str(trigger)) if isinstance(trigger, dict) else str(trigger)
                    timeline.append({
                        "date": "Recent",
                        "type": "positive" if any(k in trigger_text.lower() for k in ["growth", "series", "raise", "expand"]) else "pressure",
                        "label": trigger_text,
                        "source": "AGENT ANALYSIS",
                    })

            # Build pain clusters from signals
            pain_clusters = []
            pain_tags = []
            if r.signals:
                if r.signals.pivot:
                    pain_clusters.append({
                        "title": "Strategic Pivot",
                        "evidence": [{"source": e.source.upper(), "text": e.text[:200]} for e in (r.signals.pivot.evidence or [])[:3]],
                    })
                    pain_tags.append("PIVOT")
                if r.signals.tech_debt:
                    pain_clusters.append({
                        "title": "Tech Debt",
                        "evidence": [{"source": e.source.upper(), "text": e.text[:200]} for e in (r.signals.tech_debt.evidence or [])[:3]],
                    })
                    pain_tags.append("TECH DEBT")
                if r.signals.fiscal_pressure:
                    pain_clusters.append({
                        "title": "Fiscal Pressure",
                        "evidence": [{"source": e.source.upper(), "text": e.text[:200]} for e in (r.signals.fiscal_pressure.evidence or [])[:3]],
                    })
                    pain_tags.append("COST PRESSURE")

            # Build capability match — use r.opportunity (not r.scoring)
            opp = r.opportunity
            cap_matches = []
            if opp:
                for reason in (opp.why_we_win or []):
                    cap_matches.append({
                        "pain": reason[:100],
                        "source": "PIPELINE ANALYSIS",
                        "severity": "HIGH" if opp.priority == "HIGH" else "MED",
                        "capability": "Data Engineering" if "data" in reason.lower() else "Cloud DevOps" if "cloud" in reason.lower() or "k8s" in reason.lower() else "AI Analytics",
                    })

            # Score: convert 0-1 float to 0-100 int
            score_int = int((opp.opportunity_score if opp else 0.5) * 100)
            confidence = opp.priority if opp else "LOW"

            # Receptivity window
            receptivity = ""
            if opp:
                if opp.priority == "HIGH":
                    receptivity = "HIGH — ACT WITHIN 90 DAYS"
                elif opp.priority == "MEDIUM":
                    receptivity = "MODERATE — ACT WITHIN 6 MONTHS"
                else:
                    receptivity = "LOW — MONITOR"

            # Score breakdown
            score_breakdown = []
            if opp:
                score_breakdown = [
                    {"label": "Capability Alignment", "value": int(opp.capability_alignment * 35), "max": 35},
                    {"label": "Urgency", "value": int(opp.urgency_score * 25), "max": 25},
                    {"label": "Market Timing", "value": int(opp.opportunity_score * 20), "max": 20},
                    {"label": "Company Fit", "value": int(r.candidate.initial_match_score * 20), "max": 20},
                ]

            # Company descriptor
            descriptor = f"{r.candidate.industry} · {r.candidate.estimated_employees} employees · {r.candidate.size} · {r.candidate.region}"

            # Signal confidence
            sig_confidence = r.signals.pivot.confidence if r.signals and r.signals.pivot else (
                r.signals.tech_debt.confidence if r.signals and r.signals.tech_debt else 0.5
            )

            # Build the full data blob
            data = {
                "descriptor": descriptor,
                "receptivity": receptivity,
                "financials": {"quarters": [], "margin": [], "revenue": []},
                "hiring": [],
                "scoreBreakdown": score_breakdown,
                "timeline": timeline,
                "painClusters": pain_clusters,
                "painTags": pain_tags,
                "decisionMaker": dm_data,
                "outreach": outreach_data,
                "capabilityMatch": cap_matches,
                "strongestMatch": {
                    "score": int((opp.capability_alignment if opp else 0) * 100),
                    "capability": cap_matches[0]["capability"] if cap_matches else "Data Engineering",
                    "pain": cap_matches[0]["pain"][:80] if cap_matches else "",
                },
                "trace": [
                    {"time": "00:01", "agent": "TARGET_DISCOVERY", "action": f"Identified {r.company_name} (score: {r.candidate.initial_match_score:.2f})"},
                    {"time": "00:05", "agent": "SIGNAL_EXTRACTION", "action": f"State: {r.signals.company_state if r.signals else 'UNKNOWN'} (confidence: {sig_confidence:.2f})"},
                    {"time": "00:12", "agent": "OPPORTUNITY_SCORING", "action": f"Score: {score_int}/100, Priority: {confidence}"},
                    {"time": "00:18", "agent": "DECISION_MAKER", "action": f"Target: {dm_data.get('name', 'Unknown')} — {dm_data.get('messaging', {}).get('tone', 'consultative')} approach"},
                    {"time": "00:25", "agent": "OUTREACH", "action": f"Generated email + LinkedIn + call opener"},
                ],
            }

            # Check if company already exists, update or create
            existing = db.query(CompanyRecord).filter(CompanyRecord.id == company_slug).first()
            if existing:
                existing.score = score_int
                existing.confidence = confidence
                existing.coverage = int(sig_confidence * 100)
                existing.descriptor = descriptor
                existing.data = data
                existing.updated_at = utcnow()
            else:
                company = CompanyRecord(
                    id=company_slug,
                    scan_id=scan_id,
                    name=r.company_name,
                    descriptor=descriptor,
                    score=score_int,
                    confidence=confidence,
                    coverage=int(sig_confidence * 100),
                    data=data,
                    created_at=utcnow(),
                    updated_at=utcnow(),
                )
                db.add(company)
            db.commit()

        # Mark scan complete
        scan.status = "completed"
        scan.progress = 1.0
        scan.completed_at = utcnow()
        db.commit()

        logger.info(f"Discovery scan {scan_id} completed — {len(results)} companies found")

    except Exception as e:
        logger.error(f"Discovery pipeline error: {e}", exc_info=True)
        try:
            scan = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
            if scan:
                scan.status = "failed"
                scan.error_message = str(e)[:500]
                db.commit()
        except:
            pass
    finally:
        db.close()
        _active_scan_id = None
        _scan_lock.release()


@router.post("/discover")
def trigger_discovery(db: Session = Depends(get_db)):
    """
    Auto-discover target companies using the 5-agent pipeline.
    Only one scan runs at a time to protect Ollama.
    """
    global _active_scan_id

    if not _scan_lock.acquire(blocking=False):
        raise HTTPException(
            status_code=429,
            detail=f"A scan is already running (ID: {_active_scan_id}). Wait for it to finish."
        )

    scan_id = new_uuid()
    _active_scan_id = scan_id

    scan = ScanRecord(
        id=scan_id,
        user_request="Auto-discover target companies",
        status="queued",
        progress=0.0,
        created_at=utcnow(),
    )
    db.add(scan)
    db.commit()

    thread = threading.Thread(
        target=_run_discovery_pipeline,
        args=(scan_id,),
        daemon=True,
    )
    thread.start()

    logger.info(f"Discovery scan {scan_id} queued")
    return {
        "scan_id": scan_id,
        "status": "queued",
        "estimated_duration_seconds": 90,
        "message": "Discovering target companies based on DataVex capabilities...",
    }


@router.get("/discover/{scan_id}")
def get_discovery_status(scan_id: str, db: Session = Depends(get_db)):
    """Check discovery scan progress."""
    scan = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    return {
        "scan_id": scan.id,
        "status": scan.status,
        "progress": scan.progress or 0.0,
        "company_name": scan.company_name,
        "agents_completed": scan.agents_completed or [],
        "agents_pending": scan.agents_pending or [],
        "error_message": scan.error_message,
    }
