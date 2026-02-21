import { useState, useEffect, useCallback, useRef } from 'react';
import LoginScreen from './Login';
import LeadBoard from './LeadBoard';
import CapabilityMatch from './CapabilityMatch';
import { Sparkline, ScoreArc } from './Charts';
import { getCompanies, getCompany, triggerDiscovery, getDiscoveryStatus } from './api';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [view, setView] = useState('leadboard');
  const [companies, setCompanies] = useState([]);
  const [activeCompanyId, setActiveCompanyId] = useState(null);
  const [companyDetail, setCompanyDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [outreachTab, setOutreachTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [scanState, setScanState] = useState(null); // { scanId, status, progress, company_name, agents_completed }
  const pollRef = useRef(null);

  useEffect(() => {
    if (localStorage.getItem('datavex_auth')) setLoggedIn(true);
  }, []);

  // Fetch companies on login
  useEffect(() => {
    if (loggedIn) fetchCompanies();
  }, [loggedIn]);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await getCompanies();
      setCompanies(res.data || []);
    } catch (e) {
      console.error('Failed to fetch companies:', e);
    }
  }, []);

  const handleCompanySelect = useCallback(async (companyId) => {
    setActiveCompanyId(companyId);
    setOutreachTab(0);
    setCopied(false);
    setView('report');
    setLoading(true);
    try {
      const detail = await getCompany(companyId);
      setCompanyDetail(detail);
    } catch (e) {
      console.error('Failed to fetch company detail:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleScan = useCallback(async () => {
    try {
      setScanState({ status: 'queued', progress: 0, company_name: 'Auto-Discovery', agents_completed: [] });
      const res = await triggerDiscovery();
      const scanId = res.scan_id;

      // Poll for status
      pollRef.current = setInterval(async () => {
        try {
          const status = await getDiscoveryStatus(scanId);
          setScanState({
            scanId,
            status: status.status,
            progress: status.progress,
            company_name: status.company_name || 'Discovering targets...',
            agents_completed: status.agents_completed || [],
            agents_pending: status.agents_pending || [],
            error_message: status.error_message,
          });

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollRef.current);
            pollRef.current = null;
            if (status.status === 'completed') {
              await fetchCompanies();
            }
            // Clear scan state after 3 seconds
            setTimeout(() => setScanState(null), 4000);
          }
        } catch (e) {
          console.error('Poll error:', e);
        }
      }, 2000);
    } catch (e) {
      console.error('Discovery failed:', e);
      setScanState({ status: 'failed', error_message: e.message, progress: 0, agents_completed: [] });
      setTimeout(() => setScanState(null), 5000);
    }
  }, [fetchCompanies]);

  // Cleanup poll on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const outreachKeys = ['email', 'linkedin', 'opener'];
  const outreachLabels = ['EMAIL', 'LINKEDIN', 'OPENER'];

  const handleCopy = useCallback(() => {
    if (!companyDetail?.outreach) return;
    const text = companyDetail.outreach[outreachKeys[outreachTab]] || '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [companyDetail, outreachTab]);

  if (!loggedIn) return <LoginScreen onComplete={() => setLoggedIn(true)} />;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* ═══════ SIDEBAR ═══════ */}
      <aside style={{
        width: '220px', flexShrink: 0, height: '100vh',
        background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)',
        padding: '24px 12px', display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', marginBottom: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--text-primary)' }}>DataVex AI</span>
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.08em',
          color: 'var(--text-muted)', padding: '0 12px', marginBottom: '24px',
        }}>
          v2.4.1 — Synth Layer Active
        </div>

        {/* Lead Board nav */}
        <button onClick={() => setView('leadboard')} style={{
          textAlign: 'left', padding: '10px 12px', borderRadius: '12px',
          border: 'none', cursor: 'pointer',
          background: view === 'leadboard' ? 'var(--surface)' : 'transparent',
          borderLeft: view === 'leadboard' ? '3px solid var(--accent)' : '3px solid transparent',
          transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: '8px',
        }}
          onMouseEnter={(e) => { if (view !== 'leadboard') e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
          onMouseLeave={(e) => { if (view !== 'leadboard') e.currentTarget.style.background = view === 'leadboard' ? 'var(--surface)' : 'transparent'; }}>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: '13px',
            color: view === 'leadboard' ? 'var(--accent)' : 'var(--text-primary)',
            fontWeight: view === 'leadboard' ? 600 : 400,
          }}>Lead Board</span>
        </button>

        {/* Company scroll anchors */}
        {view === 'report' && companyDetail && (
          <div style={{ marginTop: '24px' }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '16px',
              color: 'var(--text-primary)', padding: '0 12px', marginBottom: '16px',
            }}>
              {companyDetail.name}
            </div>
            {[
              { id: 'section-signal', label: 'Signal Engine' },
              { id: 'section-capability', label: 'Capability Match' },
              { id: 'section-reasoning', label: 'Reasoning Log' },
            ].map((item) => (
              <button key={item.id} onClick={() => scrollTo(item.id)} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', border: 'none', cursor: 'pointer',
                background: 'transparent', borderRadius: '8px',
                fontFamily: 'var(--font-body)', fontSize: '12px',
                color: 'var(--text-muted)', transition: 'color 120ms, background 120ms',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
                {item.label}
              </button>
            ))}
          </div>
        )}

        <div style={{ margin: '20px 0', height: '1px', background: 'var(--border)' }} />

        {/* Active Targets */}
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--text-muted)', paddingLeft: '12px', marginBottom: '8px',
        }}>
          Active Targets ({companies.length})
        </div>
        {companies.map((c) => {
          const isActive = activeCompanyId === c.id && view === 'report';
          return (
            <button key={c.id} onClick={() => handleCompanySelect(c.id)} style={{
              textAlign: 'left', padding: '8px 12px', borderRadius: '8px',
              border: 'none', cursor: 'pointer',
              background: isActive ? 'var(--surface)' : 'transparent',
              transition: 'all 150ms', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = isActive ? 'var(--surface)' : 'transparent'; }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-primary)' }}>{c.name}</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600,
                color: c.score >= 80 ? 'var(--accent)' : c.score >= 60 ? 'var(--warning)' : 'var(--text-muted)',
              }}>{c.score}</span>
            </button>
          );
        })}

        {companies.length === 0 && (
          <div style={{ padding: '12px', fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
            No targets scanned yet.<br />Use the scan bar to analyze a company.
          </div>
        )}

        <div style={{ marginTop: 'auto', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>SYSTEM STATUS</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)' }}>Online</span>
          </span>
        </div>
      </aside>

      {/* ═══════ MAIN ═══════ */}
      <main id="main-scroll" key={`${view}-${activeCompanyId}`} style={{
        flex: 1, overflowY: 'auto', padding: '40px 64px 96px',
        animation: 'contentFade 160ms ease-out',
      }}>
        {view === 'leadboard' && (
          <LeadBoard
            companies={companies}
            onSelectCompany={handleCompanySelect}
            onScan={handleScan}
            scanState={scanState}
          />
        )}
        {view === 'report' && loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)', fontSize: '14px' }}>Loading intelligence report...</p>
            </div>
          </div>
        )}
        {view === 'report' && !loading && companyDetail && (
          <CompanyReport
            company={companyDetail}
            outreachTab={outreachTab} setOutreachTab={setOutreachTab}
            outreachLabels={outreachLabels} outreachKeys={outreachKeys}
            copied={copied} setCopied={setCopied} handleCopy={handleCopy}
          />
        )}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SINGLE-PAGE COMPANY REPORT — FULL WIDTH
   ═══════════════════════════════════════════════════ */

function CompanyReport({ company, outreachTab, setOutreachTab, outreachLabels, outreachKeys, copied, setCopied, handleCopy }) {
  const financials = company.financials || { quarters: [], margin: [], revenue: [] };
  const hasFinancials = financials.margin && financials.margin.length > 0;
  const trending = hasFinancials ? (financials.margin[financials.margin.length - 1] < financials.margin[0] ? 'down' : 'up') : 'up';
  const sparkColor = trending === 'down' ? 'var(--warning)' : 'var(--accent)';
  const scoreBreakdown = company.score_breakdown || company.scoreBreakdown || [];
  const hiring = company.hiring || [];
  const timeline = company.timeline || [];
  const painClusters = company.pain_clusters || company.painClusters || [];
  const decisionMaker = company.decision_maker || company.decisionMaker || {};
  const outreach = company.outreach || {};
  const trace = company.trace || [];
  const capabilityMatch = company.capability_match || company.capabilityMatch || [];
  const receptivity = company.receptivity || 'UNKNOWN';
  const painTags = company.pain_tags || company.painTags || [];

  return (
    <>
      {/* ════════ SIGNAL ENGINE ════════ */}
      <div id="section-signal">
        <Section index={0}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 400, color: 'var(--text-primary)', lineHeight: 1.1 }}>{company.name}</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-muted)', marginTop: '8px' }}>{company.descriptor}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '40px' }}>
            <ScoreArc score={company.score} />
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                CONFIDENCE · <span style={{ color: company.confidence === 'HIGH' ? 'var(--accent)' : company.confidence === 'MEDIUM' ? 'var(--warning)' : 'var(--text-muted)' }}>{company.confidence}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>DATA COVERAGE: {company.coverage}%</div>
            </div>
          </div>
        </Section>

        {/* At a Glance */}
        <Section index={1} label="AT A GLANCE">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            {/* Operating Margin */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '28px 32px', boxShadow: 'var(--shadow)' }}>
              <MiniLabel>OPERATING MARGIN</MiniLabel>
              {hasFinancials ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 500, color: trending === 'down' ? 'var(--warning)' : 'var(--accent)' }}>
                      {financials.margin[financials.margin.length - 1]}%
                    </span>
                    <Sparkline data={financials.margin} color={sparkColor} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>
                    {financials.quarters[0]} — {financials.quarters[financials.quarters.length - 1]}
                  </span>
                </>
              ) : (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px' }}>Financial data from agent analysis</p>
              )}
            </div>

            {/* Score Breakdown */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '28px 32px', boxShadow: 'var(--shadow)' }}>
              <MiniLabel>SCORE BREAKDOWN</MiniLabel>
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '12px' }}>
                {scoreBreakdown.length > 0 ? scoreBreakdown.map((row, i) => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: i < scoreBreakdown.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-primary)' }}>{row.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-primary)' }}>{row.value}/{row.max}</span>
                  </div>
                )) : (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)' }}>Score: {company.score}/100</p>
                )}
              </div>
            </div>
          </div>

          {/* Hiring Signals */}
          {hiring.length > 0 && (
            <div style={{ marginTop: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '28px 32px', boxShadow: 'var(--shadow)' }}>
              <MiniLabel>HIRING SIGNALS</MiniLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px', marginTop: '12px' }}>
                {hiring.map((h) => (
                  <div key={h.category} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0', borderBottom: '1px solid var(--border)',
                  }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-primary)' }}>{h.category}</span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 500,
                      color: h.type === 'positive' ? 'var(--accent)' : h.type === 'warning' ? 'var(--warning)' : 'var(--text-muted)',
                    }}>{h.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Why Now */}
        <Section index={2} label="WHY NOW">
          <div style={{
            display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: '11px',
            letterSpacing: '0.08em', padding: '8px 20px',
            background: 'var(--accent-tint)', border: '1px solid var(--accent)',
            borderRadius: '20px', color: 'var(--accent)', marginBottom: '40px',
          }}>RECEPTIVITY WINDOW · {receptivity}</div>
          {timeline.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 64px' }}>
              <div style={{ position: 'relative', paddingLeft: '24px' }}>
                <div style={{ position: 'absolute', left: '3px', top: '4px', bottom: '4px', width: '1px', background: 'var(--border)' }} />
                {timeline.slice(0, 3).map((evt, i) => (
                  <TimelineEvent key={i} evt={evt} isLast={i === 2} />
                ))}
              </div>
              <div style={{ position: 'relative', paddingLeft: '24px' }}>
                <div style={{ position: 'absolute', left: '3px', top: '4px', bottom: '4px', width: '1px', background: 'var(--border)' }} />
                {timeline.slice(3).map((evt, i) => (
                  <TimelineEvent key={i} evt={evt} isLast={i === timeline.slice(3).length - 1} />
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Pain Map */}
        {painClusters.length > 0 && (
          <Section index={3} label="WHERE IT HURTS">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {painClusters.map((cluster, i) => (
                <div key={i} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '24px', padding: '32px', boxShadow: 'var(--shadow)',
                }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '20px' }}>{cluster.title}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {(cluster.evidence || []).map((ev, j) => (
                      <div key={j} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)', fontWeight: 500,
                          background: 'var(--accent-tint)', padding: '4px 10px',
                          borderRadius: '20px', flexShrink: 0, marginTop: '3px',
                        }}>{ev.source}</span>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.65 }}>{ev.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Decision Maker */}
        {decisionMaker.name && (
          <Section index={4} label="WHO TO TALK TO">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 400, color: 'var(--text-primary)' }}>{decisionMaker.name}</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px' }}>{decisionMaker.role}</p>
                {decisionMaker.topics && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
                    {decisionMaker.topics.map((t) => (
                      <span key={t} style={{ border: '1px solid var(--border)', borderRadius: '20px', padding: '6px 14px', fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-primary)' }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
              {decisionMaker.messaging && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '28px', boxShadow: 'var(--shadow)' }}>
                  <MiniLabel>PRIMARY ANGLE</MiniLabel>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.65, marginBottom: '24px' }}>{decisionMaker.messaging.angle}</p>
                  {decisionMaker.messaging.vocab && (
                    <>
                      <MiniLabel>VOCABULARY</MiniLabel>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                        {decisionMaker.messaging.vocab.map((v) => (
                          <span key={v} style={{ border: '1px solid var(--accent)', borderRadius: '20px', padding: '4px 12px', fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--accent)' }}>{v}</span>
                        ))}
                      </div>
                    </>
                  )}
                  <MiniLabel>TONE</MiniLabel>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--accent)' }}>{decisionMaker.messaging.tone}</span>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Outreach */}
        {outreach.email && (
          <Section index={5} label="REACH OUT">
            <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
              {outreachLabels.map((label, i) => (
                <button key={label} onClick={() => { setOutreachTab(i); setCopied(false); }} style={{
                  fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500,
                  color: outreachTab === i ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: outreachTab === i ? '2px solid var(--accent)' : '2px solid transparent',
                  paddingBottom: '8px', transition: 'color 150ms, border-color 150ms', cursor: 'pointer',
                  background: 'transparent', border: 'none', borderBottomWidth: '2px', borderBottomStyle: 'solid',
                  borderBottomColor: outreachTab === i ? 'var(--accent)' : 'transparent',
                }}
                  onMouseEnter={(e) => { if (outreachTab !== i) e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { if (outreachTab !== i) e.currentTarget.style.color = 'var(--text-muted)'; }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px', boxShadow: 'var(--shadow)' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                {outreach[outreachKeys[outreachTab]] || 'Not available'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
              <button onClick={handleCopy} style={{
                borderRadius: '20px', padding: '10px 24px',
                fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500,
                color: copied ? '#fff' : 'var(--text-primary)',
                background: copied ? 'var(--accent)' : 'transparent',
                border: copied ? 'none' : '1px solid var(--border)',
                transition: 'all 150ms', cursor: 'pointer',
              }}
                onMouseEnter={(e) => { if (!copied) e.currentTarget.style.background = 'var(--hover-bg)'; }}
                onMouseLeave={(e) => { if (!copied) e.currentTarget.style.background = 'transparent'; }}>
                {copied ? '✓ Copied' : 'Copy to clipboard'}
              </button>
              {outreach.footnote && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>{outreach.footnote}</span>}
            </div>
          </Section>
        )}
      </div>

      {/* ════════ CAPABILITY MATCH ════════ */}
      {capabilityMatch.length > 0 && (
        <div id="section-capability">
          <Section index={6} label="CAPABILITY MATCH">
            <CapabilityMatch company={company} />
          </Section>
        </div>
      )}

      {/* ════════ REASONING LOG ════════ */}
      {trace.length > 0 && (
        <div id="section-reasoning">
          <Section index={7} label="REASONING LOG">
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '20px',
            }}>
              Analysis complete for {company.name} · Verdict: <span style={{
                color: company.confidence === 'HIGH' ? 'var(--accent)' : company.confidence === 'MEDIUM' ? 'var(--warning)' : 'var(--text-muted)',
                fontWeight: 600,
              }}>{company.confidence}</span>
              {decisionMaker.role && <> · Recommended persona: {decisionMaker.role.split('·')[0].trim()}</>}
            </p>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '28px 32px', boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginBottom: '20px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>LIVE</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {trace.map((line, i) => (
                  <div key={i} style={{
                    fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.7,
                    display: 'flex', gap: '16px',
                  }}>
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{line.time}</span>
                    <span style={{ color: 'var(--accent)', flexShrink: 0, minWidth: '140px', fontWeight: 500 }}>{line.agent}</span>
                    <span style={{ color: 'var(--text-primary)' }}>→  {line.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>
      )}
    </>
  );
}

/* ═══════ HELPERS ═══════ */

function TimelineEvent({ evt, isLast }) {
  return (
    <div style={{ position: 'relative', marginBottom: isLast ? '0' : '36px' }}>
      <div style={{
        position: 'absolute', left: '-24px', top: '4px', width: '8px', height: '8px',
        borderRadius: '50%', background: evt.type === 'positive' ? 'var(--accent)' : 'var(--warning)', marginLeft: '-3px',
      }} />
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>{evt.date}</div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.65 }}>{evt.label}</p>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>[{evt.source}]</span>
    </div>
  );
}

function Section({ children, index, label }) {
  return (
    <section style={{ marginBottom: '64px', animation: 'sectionUp 200ms ease-out both', animationDelay: `${index * 60}ms` }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</span>
        </div>
      )}
      {children}
    </section>
  );
}

function MiniLabel({ children }) {
  return <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>{children}</div>;
}
