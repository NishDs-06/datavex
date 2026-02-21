import { useState, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   DATA — 3 companies, fully specific copy, zero generics
   ═══════════════════════════════════════════════════════════════ */

const COMPANIES = [
  {
    id: 'meridian',
    name: 'Meridian Systems',
    descriptor: 'Enterprise SaaS · 2,400 employees · Series D · $180M ARR',
    score: 87,
    confidence: 'HIGH',
    coverage: 73,
    receptivity: 'HIGH — ACT WITHIN 90 DAYS',
    timeline: [
      { date: '2025.11', type: 'positive', label: 'CEO keynote at SaaStr Annual: "Enterprise-first by end of 2026." Three public commitments to upmarket shift in 90 days.', source: 'SAASTR ANNUAL' },
      { date: '2025.10', type: 'pressure', label: 'Q3 earnings miss — revenue $42.1M against a $44.8M consensus estimate. Stock dropped 9% intraday, recovered to –4% by close.', source: 'SEC FILING' },
      { date: '2025.09', type: 'positive', label: '14 enterprise Account Executive roles posted across LinkedIn and Lever within a 3-week window. No corresponding SMB backfills.', source: 'JOB BOARDS' },
      { date: '2025.08', type: 'pressure', label: 'CTO Sarah Chen departs after 6 years. No successor named for 45 days. Engineering blog goes silent.', source: 'LINKEDIN' },
      { date: '2025.07', type: 'pressure', label: 'Glassdoor engineering satisfaction score drops from 4.1 to 3.4. Three reviews cite "unclear technical direction."', source: 'GLASSDOOR' },
      { date: '2025.06', type: 'positive', label: '9 Kubernetes migration roles opened on Greenhouse — infra overhaul confirmed. Jenkins deprecation RFC merged January 14.', source: 'GREENHOUSE' },
    ],
    painClusters: [
      {
        title: 'Data Pipeline Failures',
        evidence: [
          { source: 'GH', text: '22 issues tagged "legacy-pipeline" — 14 marked P0 — average resolution time 11.3 days, up from 4.7 days in Q1.' },
          { source: 'G2', text: '"Data sync breaks every time we scale past 10K events/sec." — Verified buyer review, posted September 12, 2025.' },
          { source: 'JD', text: 'Senior Data Engineer role description: "Rebuild batch processing layer, migrate from Airflow 1.x to Dagster. Immediate start."' },
        ],
      },
      {
        title: 'Deployment Velocity',
        evidence: [
          { source: 'GH', text: 'CI/CD pipeline average build time: 34 minutes. Six PRs reference "flaky test" in the last 30 days.' },
          { source: 'JD', text: 'DevOps Lead role: "Reduce deployment cycle from weekly to daily releases. Must have experience with trunk-based development."' },
        ],
      },
      {
        title: 'Observability Gaps',
        evidence: [
          { source: 'G2', text: '"No centralized logging — teams use 3 different tools and nobody trusts any of them." — IT Director review, August 20, 2025.' },
          { source: 'GH', text: 'RFC #847: "Unified observability stack" — 43 comments, still in draft after 90 days. No owner assigned.' },
          { source: 'JD', text: 'SRE Manager: "Implement SLO-based alerting. Consolidate from Datadog + Grafana + custom scripts into a single pane."' },
        ],
      },
    ],
    decisionMaker: {
      name: 'Marcus Rivera',
      role: 'VP Engineering · Reports to interim CTO',
      topics: ['Platform Migration', 'Developer Velocity', 'Cost-per-Deploy'],
      messaging: {
        angle: 'Your infra migration is exposed — 22 legacy pipeline issues and a 34-minute CI cycle will bottleneck the enterprise pivot before Q3.',
        vocab: ['deployment velocity', 'platform consolidation', 'eng leverage'],
        tone: 'Direct',
      },
    },
    outreach: {
      email: `Marcus —\n\nMeridian posted 9 Kubernetes roles in 60 days while carrying 22 open legacy-pipeline issues on GitHub. Your CI builds are averaging 34 minutes.\n\nThat math doesn't close before the enterprise launch.\n\nWe cut that migration timeline by 60% for teams at your stage — consolidated infra, sub-8-minute builds, one observability layer instead of three.\n\nWorth 20 minutes this week to show you the before/after from a $160M ARR SaaS company that faced the same wall?\n\n— DataVex`,
      linkedin: `Marcus — noticed Meridian's 9 Kubernetes roles + the legacy pipeline backlog on GitHub. That infra gap will bottleneck the enterprise pivot.\n\nWe helped a similar-stage company cut migration time 60% and drop CI builds from 35 min to 7. Happy to share the breakdown if useful.`,
      opener: `"Marcus, quick question — with Sarah's departure and 22 legacy pipeline issues still open, who's owning the infra migration timeline for the enterprise launch?"`,
      footnote: 'GENERATED FROM: Q3 margin signal + CTO departure + 9 Kubernetes roles + 22 legacy-pipeline GitHub issues',
    },
    trace: [
      { time: '2026.02.21 09:14:02', agent: 'RESEARCH_AGENT ', action: 'fetched Q2–Q4 2024 earnings transcripts for Meridian Systems' },
      { time: '2026.02.21 09:14:04', agent: 'FINANCE_AGENT  ', action: 'detected operating margin decline: –2.3% over 3 quarters' },
      { time: '2026.02.21 09:14:06', agent: 'TECH_AGENT     ', action: '9 Kubernetes roles + 22 legacy pipeline GitHub issues filed' },
      { time: '2026.02.21 09:14:08', agent: 'CONFLICT_AGENT ', action: 'contradiction: hiring spend rising despite cost pressure signal' },
      { time: '2026.02.21 09:14:10', agent: 'SYNTHESIS_AGENT', action: 'resolved: budget shifting ops→transformation — confirms receptivity' },
      { time: '2026.02.21 09:14:11', agent: 'DECISION_AGENT ', action: 'verdict: HIGH. Window: 60–90 days. Recommended persona: VP Eng.' },
    ],
  },
  {
    id: 'lattice',
    name: 'Lattice Dynamics',
    descriptor: 'Fintech / Capital Markets · 890 employees · Series C · $67M ARR',
    score: 64,
    confidence: 'MEDIUM',
    coverage: 58,
    receptivity: 'MEDIUM — MONITOR FOR 30 DAYS',
    timeline: [
      { date: '2025.12', type: 'pressure', label: 'SOC2 Type II audit returns 3 control failures. Remediation deadline: 90 days. Board notified same week.', source: 'AUDIT REPORT' },
      { date: '2025.11', type: 'pressure', label: 'Customer acquisition cost increased 31%. Average sales cycle extended from 45 to 68 days. Pipeline velocity declining.', source: 'BOARD DECK' },
      { date: '2025.10', type: 'positive', label: 'Multi-asset expansion announced internally — 4 new asset class teams formed. 8 quant researcher roles posted.', source: 'LINKEDIN' },
      { date: '2025.08', type: 'pressure', label: '14 CVEs across 3 public repos flagged by external security researcher on GitHub Advisory. 6 rated HIGH severity.', source: 'GITHUB ADVISORY' },
      { date: '2025.07', type: 'positive', label: 'Series C closed: $67M at $340M valuation. Lead investor: Ribbit Capital.', source: 'CRUNCHBASE' },
    ],
    painClusters: [
      {
        title: 'Compliance Gaps',
        evidence: [
          { source: 'JD', text: 'Head of Compliance role: "Remediate SOC2 failures and build continuous compliance monitoring from scratch."' },
          { source: 'GH', text: '14 CVEs across 3 public repos — 6 rated HIGH severity — oldest has been open for 140 days with no assignee.' },
        ],
      },
      {
        title: 'Monolith Decomposition',
        evidence: [
          { source: 'GH', text: 'RFC #312: "Strangler fig migration plan" — filed June 2025. Zero PRs linked. Status: stalled.' },
          { source: 'JD', text: '3 Staff Engineer roles posted: "Decompose trading engine monolith into event-driven services."' },
          { source: 'G2', text: '"Every feature deployment risks the entire platform. We held our breath on every release." — Engineering team lead, October 2025.' },
        ],
      },
      {
        title: 'Quant Infrastructure Scaling',
        evidence: [
          { source: 'JD', text: 'Quant Platform Engineer: "Build real-time feature store for multi-asset pricing models. Must handle 500K+ instruments."' },
          { source: 'GH', text: 'Issue #1847: "Backtesting pipeline OOM at 500K instruments" — open 45 days, no proposed solution.' },
        ],
      },
    ],
    decisionMaker: {
      name: 'Diana Kowalski',
      role: 'CTO · Co-founder · 7 years tenure',
      topics: ['Event-Driven Architecture', 'Regulatory Tech', 'Quant Infrastructure'],
      messaging: {
        angle: 'Your SOC2 failures and stalled monolith RFC will block the multi-asset launch unless decomposition accelerates — the compliance clock is ticking.',
        vocab: ['event-driven', 'continuous compliance', 'strangler fig'],
        tone: 'Consultative',
      },
    },
    outreach: {
      email: `Diana —\n\n3 SOC2 control failures, 14 open CVEs, and a monolith decomposition RFC that's been stalled since June. Meanwhile, 4 new multi-asset teams need a platform that doesn't exist yet.\n\nWe've run this exact remediation at 6 fintech companies — average SOC2 compliance in 47 days, and the decomposition tooling cuts strangler-fig timelines by 45%.\n\n20 minutes to walk through the compliance-to-launch sequence?\n\n— DataVex`,
      linkedin: `Diana — saw Lattice's SOC2 audit results and the stalled monolith RFC. Multi-asset expansion on a monolith with 14 open CVEs is a compounding risk.\n\nWe helped 6 similar fintechs hit compliance in 47 days while decomposing in parallel. Happy to share specifics.`,
      opener: `"Diana, with the SOC2 remediation and multi-asset launch both targeting 2026 — how are you sequencing the monolith decomposition against the compliance timeline?"`,
      footnote: 'GENERATED FROM: SOC2 audit failures + stalled RFC #312 + 14 CVEs + multi-asset expansion signal',
    },
    trace: [
      { time: '2026.02.21 09:16:01', agent: 'RESEARCH_AGENT ', action: 'scanned 3 public repos, 8 job posts, 2 G2 reviews for Lattice' },
      { time: '2026.02.21 09:16:03', agent: 'FINANCE_AGENT  ', action: 'CAC up 31%, burn multiple 1.8x — profitability pressure confirmed' },
      { time: '2026.02.21 09:16:05', agent: 'TECH_AGENT     ', action: '14 CVEs, monolith RFC stalled 6 months, 3 staff eng roles open' },
      { time: '2026.02.21 09:16:07', agent: 'CONFLICT_AGENT ', action: 'tension: multi-asset expansion vs compliance remediation timeline' },
      { time: '2026.02.21 09:16:09', agent: 'SYNTHESIS_AGENT', action: 'compliance must precede expansion — creates tooling window' },
      { time: '2026.02.21 09:16:10', agent: 'DECISION_AGENT ', action: 'verdict: MEDIUM. Window: 30–60 days. Recommended persona: CTO.' },
    ],
  },
  {
    id: 'aperture',
    name: 'Aperture Robotics',
    descriptor: 'Industrial Automation · 5,100 employees · Public (NASD: APRT) · $420M revenue',
    score: 41,
    confidence: 'LOW',
    coverage: 81,
    receptivity: 'LOW — LONG CYCLE, PLANT SEEDS',
    timeline: [
      { date: '2025.12', type: 'pressure', label: 'Stock drops 14% post-acquisition announcement. Two analyst downgrades citing integration risk and margin dilution.', source: '10-K FILING' },
      { date: '2025.11', type: 'positive', label: 'MotionIQ acquisition closes — $28M, 120 engineers absorbed. Integration timeline set at 18 months.', source: 'SEC FILING' },
      { date: '2025.09', type: 'positive', label: 'VectorFlow acquisition closes — $34M, 85 engineers. Unified control plane is the stated goal by Q4 2026.', source: 'SEC FILING' },
      { date: '2025.08', type: 'pressure', label: 'Internal memo leaks to Glassdoor: "3 CI systems, no shared artifact registry, no unified auth. Integration is behind."', source: 'GLASSDOOR' },
      { date: '2025.06', type: 'pressure', label: 'Board approves $18M integration budget over 4 quarters. CFO calls it "necessary but painful."', source: 'BOARD MINUTES' },
    ],
    painClusters: [
      {
        title: 'Multi-System Integration',
        evidence: [
          { source: 'JD', text: 'Integration Architect: "Unify 3 CI/CD systems, establish shared artifact registry, implement cross-org auth. Urgent."' },
          { source: 'GH', text: '47 Jira tickets tagged "integration-blocker" — 12 marked critical — average age: 67 days and growing.' },
        ],
      },
      {
        title: 'Talent Retention Risk',
        evidence: [
          { source: 'G2', text: '"Acquisition killed our velocity — 3 layers of approval for every deploy now." — Former VectorFlow engineer, November 2025.' },
          { source: 'JD', text: '11 backfill roles posted for VectorFlow team positions within 60 days of close. Attrition accelerating.' },
        ],
      },
      {
        title: 'Control Plane Unification',
        evidence: [
          { source: 'JD', text: 'Principal Engineer — Control Systems: "Design unified control plane spanning 3 robot firmware architectures."' },
          { source: 'GH', text: 'RFC #201: "Cross-subsidiary API gateway" — 89 comments, 4 competing proposals, no decision after 120 days.' },
        ],
      },
    ],
    decisionMaker: {
      name: 'James Okafor',
      role: 'SVP Platform Engineering · Joined via VectorFlow acquisition',
      topics: ['Post-Merger Integration', 'Platform Unification', 'Engineering Culture'],
      messaging: {
        angle: 'Three CI systems and 47 integration blockers at 67-day average age — the unified control plane will miss the 2026 Q4 deadline without consolidation tooling.',
        vocab: ['integration velocity', 'platform unification', 'cross-org governance'],
        tone: 'Conceptual',
      },
    },
    outreach: {
      email: `James —\n\n47 integration-blocker tickets averaging 67 days open, 3 CI systems with no shared registry, and 11 VectorFlow backfills posted in 60 days. The integration clock is running.\n\nWe unified CI across 3 entities at two public industrials in 90 days — shared artifact registry, cross-org auth, single deployment pipeline. Cut integration-blocker resolution time by 70%.\n\nThis is a longer conversation, but worth starting now. 20 minutes to compare architectures?\n\n— DataVex`,
      linkedin: `James — having led the VectorFlow integration, you're seeing the 3-CI-system problem firsthand. 47 blockers at 67-day avg age compounds fast.\n\nWe ran very similar unification at 2 public industrials — 90 days to single pipeline. Happy to compare notes.`,
      opener: `"James, with 47 integration blockers and the Q4 2026 control plane deadline — what's the current unification sequencing across the 3 engineering orgs?"`,
      footnote: 'GENERATED FROM: dual acquisition + 47 integration blockers + 3 CI systems + 11 backfill roles',
    },
    trace: [
      { time: '2026.02.21 09:18:01', agent: 'RESEARCH_AGENT ', action: 'fetched 2 SEC filings, 6 job posts, 3 Glassdoor reviews for Aperture' },
      { time: '2026.02.21 09:18:03', agent: 'FINANCE_AGENT  ', action: 'gross margin stable 62%, $18M integration cost, stock –14%' },
      { time: '2026.02.21 09:18:05', agent: 'TECH_AGENT     ', action: '3 CI systems, 47 integration blockers, no shared artifact registry' },
      { time: '2026.02.21 09:18:07', agent: 'CONFLICT_AGENT ', action: 'risk: VectorFlow talent attrition — 11 backfills in 60 days' },
      { time: '2026.02.21 09:18:09', agent: 'SYNTHESIS_AGENT', action: 'long cycle but high data coverage — plant seeds now, harvest Q3 2026' },
      { time: '2026.02.21 09:18:10', agent: 'DECISION_AGENT ', action: 'verdict: LOW. Window: 6+ months. Recommended persona: SVP Platform.' },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   APP
   ═══════════════════════════════════════════════════════════════ */

export default function App() {
  const [activeCompany, setActiveCompany] = useState(0);
  const [outreachTab, setOutreachTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [contentKey, setContentKey] = useState(0);

  const company = COMPANIES[activeCompany];
  const outreachKeys = ['email', 'linkedin', 'opener'];
  const outreachLabels = ['EMAIL', 'LINKEDIN', 'OPENER'];

  const handleCompanySelect = useCallback((idx) => {
    setActiveCompany(idx);
    setOutreachTab(0);
    setCopied(false);
    setContentKey((k) => k + 1);
    // Scroll main content to top on company switch
    const el = document.getElementById('main-scroll');
    if (el) el.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleCopy = useCallback(() => {
    const text = company.outreach[outreachKeys[outreachTab]];
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [company, outreachTab]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ════════════ SIDEBAR ════════════ */}
      <aside style={{
        width: '220px',
        flexShrink: 0,
        height: '100vh',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border)',
        padding: '40px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        overflowY: 'auto',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: '16px',
          paddingLeft: '8px',
        }}>
          Active Targets
        </div>

        {COMPANIES.map((c, i) => {
          const isActive = activeCompany === i;
          return (
            <button
              key={c.id}
              onClick={() => handleCompanySelect(i)}
              style={{
                textAlign: 'left',
                padding: '16px',
                borderRadius: 'var(--radius-card)',
                border: isActive ? 'none' : '1px solid var(--border)',
                borderLeft: isActive ? '2px solid var(--accent)' : undefined,
                background: isActive ? 'var(--surface)' : 'var(--surface)',
                boxShadow: isActive ? 'var(--shadow)' : 'none',
                cursor: 'pointer',
                transition: 'border-color 150ms',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.borderColor = '#C8C3BA'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}>
                {c.name}
              </span>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}>
                {c.descriptor.split('·')[0].trim()}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: 500,
                color: c.confidence === 'HIGH' ? 'var(--accent)' :
                  c.confidence === 'MEDIUM' ? 'var(--warning)' :
                    'var(--text-muted)',
                marginTop: '4px',
              }}>
                {c.score} · {c.confidence}
              </span>
            </button>
          );
        })}
      </aside>

      {/* ════════════ MAIN CONTENT ════════════ */}
      <main
        id="main-scroll"
        key={contentKey}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          justifyContent: 'center',
          padding: '64px 40px 96px',
          animation: 'contentFade 160ms ease-out',
        }}
      >
        <div style={{ width: '100%', maxWidth: '720px' }}>

          {/* ── SECTION 1: COMPANY HEADER ── */}
          <Section index={0}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '48px',
              fontWeight: 400,
              color: 'var(--text-primary)',
              lineHeight: 1.1,
            }}>
              {company.name}
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              color: 'var(--text-muted)',
              marginTop: '8px',
            }}>
              {company.descriptor}
            </p>
            <div style={{ marginTop: '40px' }}>
              <ScoreCounter target={company.score} key={activeCompany} />
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginTop: '8px',
            }}>
              {'CONFIDENCE · '}
              <span style={{
                color: company.confidence === 'HIGH' ? 'var(--accent)' :
                  company.confidence === 'MEDIUM' ? 'var(--warning)' :
                    'var(--text-muted)',
              }}>
                {company.confidence}
              </span>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--text-muted)',
              marginTop: '8px',
            }}>
              DATA COVERAGE: {company.coverage}%
            </div>
          </Section>

          {/* ── SECTION 2: WHY NOW ── */}
          <Section index={1} label="WHY NOW">
            {/* Receptivity badge */}
            <div style={{
              display: 'inline-block',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.08em',
              padding: '8px 16px',
              background: 'var(--accent-tint)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-input)',
              color: 'var(--accent)',
              marginBottom: '40px',
            }}>
              RECEPTIVITY WINDOW · {company.receptivity}
            </div>

            {/* Timeline */}
            <div style={{ position: 'relative', paddingLeft: '24px' }}>
              <div style={{
                position: 'absolute',
                left: '2px',
                top: '4px',
                bottom: '4px',
                width: '1px',
                background: 'var(--border)',
              }} />

              {company.timeline.map((evt, i) => (
                <div key={i} style={{
                  position: 'relative',
                  marginBottom: i < company.timeline.length - 1 ? '40px' : '0',
                }}>
                  {/* Dot */}
                  <div style={{
                    position: 'absolute',
                    left: '-24px',
                    top: '4px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: evt.type === 'positive' ? 'var(--accent)' : 'var(--warning)',
                    marginLeft: '-2px',
                  }} />

                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    marginBottom: '8px',
                  }}>
                    {evt.date}
                  </div>
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    lineHeight: 1.65,
                  }}>
                    {evt.label}
                  </p>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                  }}>
                    [{evt.source}]
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── SECTION 3: PAIN MAP ── */}
          <Section index={2} label="WHERE IT HURTS">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {company.painClusters.map((cluster, i) => (
                <div key={i} style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  padding: '32px',
                  boxShadow: 'var(--shadow)',
                }}>
                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '22px',
                    fontWeight: 400,
                    color: 'var(--text-primary)',
                    marginBottom: '16px',
                  }}>
                    {cluster.title}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cluster.evidence.map((ev, j) => (
                      <div key={j} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          background: 'var(--sidebar-bg)',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-input)',
                          flexShrink: 0,
                          marginTop: '3px',
                        }}>
                          {ev.source}
                        </span>
                        <p style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '13px',
                          color: 'var(--text-primary)',
                          lineHeight: 1.6,
                        }}>
                          {ev.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── SECTION 4: DECISION MAKER ── */}
          <Section index={3} label="WHO TO TALK TO">
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '30px',
              fontWeight: 400,
              color: 'var(--text-primary)',
            }}>
              {company.decisionMaker.name}
            </h3>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'var(--text-muted)',
              marginTop: '8px',
            }}>
              {company.decisionMaker.role}
            </p>

            {/* Topic chips */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
              {company.decisionMaker.topics.map((t) => (
                <span key={t} style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-input)',
                  padding: '6px 8px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                }}>
                  {t}
                </span>
              ))}
            </div>

            {/* Messaging Vector */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding: '24px',
              boxShadow: 'var(--shadow)',
              marginTop: '24px',
            }}>
              <MiniLabel>PRIMARY ANGLE</MiniLabel>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                marginBottom: '16px',
              }}>
                {company.decisionMaker.messaging.angle}
              </p>

              <MiniLabel>VOCABULARY MATCH</MiniLabel>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {company.decisionMaker.messaging.vocab.map((v) => (
                  <span key={v} style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-input)',
                    padding: '4px 8px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    color: 'var(--accent)',
                  }}>
                    {v}
                  </span>
                ))}
              </div>

              <MiniLabel>TONE</MiniLabel>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                color: 'var(--accent)',
              }}>
                {company.decisionMaker.messaging.tone}
              </span>
            </div>
          </Section>

          {/* ── SECTION 5: OUTREACH ── */}
          <Section index={4} label="REACH OUT">
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
              {outreachLabels.map((label, i) => (
                <button
                  key={label}
                  onClick={() => { setOutreachTab(i); setCopied(false); }}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: outreachTab === i ? 'var(--accent)' : 'var(--text-muted)',
                    borderBottom: outreachTab === i ? '2px solid var(--accent)' : '2px solid transparent',
                    paddingBottom: '8px',
                    transition: 'color 150ms, border-color 150ms',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { if (outreachTab !== i) e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { if (outreachTab !== i) e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Message card with inset */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding: '24px',
              boxShadow: 'var(--shadow)',
            }}>
              <div style={{
                background: 'var(--sidebar-bg)',
                borderRadius: '12px',
                padding: '16px',
              }}>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  lineHeight: 1.75,
                  whiteSpace: 'pre-wrap',
                }}>
                  {company.outreach[outreachKeys[outreachTab]]}
                </p>
              </div>
            </div>

            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--text-muted)',
              marginTop: '16px',
              lineHeight: 1.4,
            }}>
              {company.outreach.footnote}
            </div>

            <button
              onClick={handleCopy}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-input)',
                padding: '8px 16px',
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                color: copied ? 'var(--accent)' : 'var(--text-primary)',
                borderColor: copied ? 'var(--accent)' : 'var(--border)',
                background: copied ? 'var(--accent-tint)' : 'transparent',
                marginTop: '16px',
                transition: 'color 150ms, border-color 150ms, background 150ms',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!copied) {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--accent)';
                }
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
            >
              {copied ? 'Copied' : 'Copy to clipboard'}
            </button>
          </Section>

          {/* ── SECTION 6: AGENT TRACE ── */}
          <Section index={5} label="HOW WE GOT HERE">
            <div style={{
              background: 'var(--sidebar-bg)',
              borderRadius: 'var(--radius-section)',
              padding: '16px 24px',
              maxHeight: '220px',
              overflowY: 'auto',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
                marginBottom: '16px',
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}>
                  LIVE
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {company.trace.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      lineHeight: 1.7,
                      display: 'flex',
                      gap: '16px',
                      animation: 'traceIn 200ms ease-out both',
                      animationDelay: `${i * 40}ms`,
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{line.time}</span>
                    <span style={{ color: 'var(--accent)', flexShrink: 0, minWidth: '130px', fontWeight: 500 }}>{line.agent}</span>
                    <span style={{ color: 'var(--text-primary)' }}>→  {line.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

        </div>
      </main>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   SECTION WRAPPER
   ═══════════════════════════════════════════════════════════════ */

function Section({ children, index, label }) {
  return (
    <section style={{
      marginBottom: '64px',
      animation: 'sectionUp 200ms ease-out both',
      animationDelay: `${index * 70}ms`,
    }}>
      {label && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: '16px',
        }}>
          {label}
        </div>
      )}
      {children}
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════
   SCORE COUNTER
   ═══════════════════════════════════════════════════════════════ */

function ScoreCounter({ target }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) { setValue(target); return; }

    const duration = 600;
    const start = performance.now();
    let raf;
    setValue(0);

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return (
    <span style={{
      fontFamily: 'var(--font-display)',
      fontSize: '88px',
      fontWeight: 400,
      color: 'var(--accent)',
      lineHeight: 1,
    }}>
      {value}
    </span>
  );
}


/* ═══════════════════════════════════════════════════════════════
   MINI LABEL
   ═══════════════════════════════════════════════════════════════ */

function MiniLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginBottom: '8px',
    }}>
      {children}
    </div>
  );
}
