import { useState, useEffect, useCallback } from 'react';
import { COMPANIES } from './data';
import LoginScreen from './Login';
import LeadBoard from './LeadBoard';
import CapabilityMatch from './CapabilityMatch';
import { Sparkline, ScoreArc } from './Charts';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [view, setView] = useState('leadboard'); // 'leadboard' or 'report'
  const [activeCompany, setActiveCompany] = useState(0);
  const [outreachTab, setOutreachTab] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('datavex_auth')) setLoggedIn(true);
  }, []);

  const company = COMPANIES[activeCompany];
  const outreachKeys = ['email', 'linkedin', 'opener'];
  const outreachLabels = ['EMAIL', 'LINKEDIN', 'OPENER'];

  const handleCompanySelect = useCallback((idx) => {
    setActiveCompany(idx);
    setOutreachTab(0);
    setCopied(false);
    setView('report');
    setTimeout(() => {
      const el = document.getElementById('main-scroll');
      if (el) el.scrollTo({ top: 0, behavior: 'instant' });
    }, 10);
  }, []);

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(company.outreach[outreachKeys[outreachTab]]).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [company, outreachTab]);

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
          textAlign: 'left', padding: '10px 12px', borderRadius: '10px',
          border: 'none', cursor: 'pointer',
          background: view === 'leadboard' ? 'var(--surface)' : 'transparent',
          borderLeft: view === 'leadboard' ? '3px solid var(--accent)' : '3px solid transparent',
          transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: '8px',
        }}
          onMouseEnter={(e) => { if (view !== 'leadboard') e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
          onMouseLeave={(e) => { if (view !== 'leadboard') e.currentTarget.style.background = 'transparent'; }}>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: '13px',
            color: view === 'leadboard' ? 'var(--accent)' : 'var(--text-primary)',
            fontWeight: view === 'leadboard' ? 600 : 400,
          }}>Lead Board</span>
        </button>

        {/* Company section — only when a company is selected and in report view */}
        {view === 'report' && (
          <div style={{ marginTop: '24px' }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '16px',
              color: 'var(--text-primary)', padding: '0 12px', marginBottom: '16px',
            }}>
              {company.name}
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
                color: 'var(--text-muted)', transition: 'color 120ms',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* Divider */}
        <div style={{ margin: '20px 0', height: '1px', background: 'var(--border)' }} />

        {/* Active Targets */}
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--text-muted)', paddingLeft: '12px', marginBottom: '8px',
        }}>
          Active Targets
        </div>
        {COMPANIES.map((c, i) => {
          const isActive = activeCompany === i && view === 'report';
          return (
            <button key={c.id} onClick={() => handleCompanySelect(i)} style={{
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

        {/* Bottom status */}
        <div style={{ marginTop: 'auto', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>SYSTEM STATUS</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)' }}>Online</span>
          </span>
        </div>
      </aside>

      {/* ═══════ MAIN ═══════ */}
      <main id="main-scroll" key={`${view}-${activeCompany}`} style={{
        flex: 1, overflowY: 'auto', padding: '48px 48px 96px',
        animation: 'contentFade 160ms ease-out',
      }}>
        <div style={{ width: '100%', maxWidth: view === 'leadboard' ? '860px' : '800px', margin: '0 auto' }}>
          {view === 'leadboard' && <LeadBoard onSelectCompany={handleCompanySelect} activeCompany={activeCompany} />}
          {view === 'report' && <CompanyReport
            company={company} activeCompany={activeCompany}
            outreachTab={outreachTab} setOutreachTab={setOutreachTab}
            outreachLabels={outreachLabels} outreachKeys={outreachKeys}
            copied={copied} setCopied={setCopied} handleCopy={handleCopy}
          />}
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SINGLE-PAGE COMPANY REPORT
   ═══════════════════════════════════════════════════ */

function CompanyReport({ company, activeCompany, outreachTab, setOutreachTab, outreachLabels, outreachKeys, copied, setCopied, handleCopy }) {
  const trending = company.financials.margin[company.financials.margin.length - 1] < company.financials.margin[0] ? 'down' : 'up';
  const sparkColor = trending === 'down' ? 'var(--warning)' : 'var(--accent)';

  return (
    <>
      {/* ════════ SIGNAL ENGINE ════════ */}
      <div id="section-signal">
        {/* Header */}
        <Section index={0}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 400, color: 'var(--text-primary)', lineHeight: 1.1 }}>{company.name}</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-muted)', marginTop: '8px' }}>{company.descriptor}</p>

          {/* Score with arc */}
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

        {/* At a glance — inline sparkline + text tables */}
        <Section index={1} label="AT A GLANCE">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            {/* Operating Margin — sparkline */}
            <div>
              <MiniLabel>OPERATING MARGIN</MiniLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 500, color: trending === 'down' ? 'var(--warning)' : 'var(--accent)' }}>
                  {company.financials.margin[company.financials.margin.length - 1]}%
                </span>
                <Sparkline data={company.financials.margin} color={sparkColor} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                {company.financials.quarters[0]} — {company.financials.quarters[company.financials.quarters.length - 1]}
              </span>
            </div>

            {/* Score Breakdown — table */}
            <div>
              <MiniLabel>SCORE BREAKDOWN</MiniLabel>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {company.scoreBreakdown.map((row, i) => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: i < company.scoreBreakdown.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-primary)' }}>{row.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-primary)' }}>{row.value}/{row.max}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hiring signals — ranked text list */}
          <div style={{ marginTop: '32px' }}>
            <MiniLabel>HIRING SIGNALS</MiniLabel>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {company.hiring.map((h, i) => (
                <div key={h.category} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: i < company.hiring.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-primary)' }}>{h.category}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500,
                    color: h.type === 'positive' ? 'var(--accent)' : h.type === 'warning' ? 'var(--warning)' : 'var(--text-muted)',
                  }}>{h.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Why Now */}
        <Section index={2} label="WHY NOW">
          <div style={{
            display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: '11px',
            letterSpacing: '0.08em', padding: '8px 16px',
            background: 'var(--accent-tint)', border: '1px solid var(--accent)',
            borderRadius: '10px', color: 'var(--accent)', marginBottom: '40px',
          }}>RECEPTIVITY WINDOW · {company.receptivity}</div>
          <div style={{ position: 'relative', paddingLeft: '24px' }}>
            <div style={{ position: 'absolute', left: '3px', top: '4px', bottom: '4px', width: '1px', background: 'var(--border)' }} />
            {company.timeline.map((evt, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: i < company.timeline.length - 1 ? '40px' : '0' }}>
                <div style={{
                  position: 'absolute', left: '-24px', top: '4px', width: '8px', height: '8px',
                  borderRadius: '50%', background: evt.type === 'positive' ? 'var(--accent)' : 'var(--warning)', marginLeft: '-3px',
                }} />
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>{evt.date}</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.65 }}>{evt.label}</p>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>[{evt.source}]</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Pain Map */}
        <Section index={3} label="WHERE IT HURTS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {company.painClusters.map((cluster, i) => (
              <div key={i} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow)',
              }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '20px' }}>{cluster.title}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {cluster.evidence.map((ev, j) => (
                    <div key={j} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)', fontWeight: 500,
                        background: 'var(--accent-tint)', padding: '3px 8px',
                        borderRadius: '6px', flexShrink: 0, marginTop: '3px',
                      }}>{ev.source}</span>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.65 }}>{ev.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Decision Maker */}
        <Section index={4} label="WHO TO TALK TO">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: 400, color: 'var(--text-primary)' }}>{company.decisionMaker.name}</h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px' }}>{company.decisionMaker.role}</p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            {company.decisionMaker.topics.map((t) => (
              <span key={t} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 10px', fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-primary)' }}>{t}</span>
            ))}
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', marginTop: '24px' }}>
            <MiniLabel>PRIMARY ANGLE</MiniLabel>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.65, marginBottom: '20px' }}>{company.decisionMaker.messaging.angle}</p>
            <MiniLabel>VOCABULARY MATCH</MiniLabel>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {company.decisionMaker.messaging.vocab.map((v) => (
                <span key={v} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '4px 10px', fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--accent)' }}>{v}</span>
              ))}
            </div>
            <MiniLabel>TONE</MiniLabel>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--accent)' }}>{company.decisionMaker.messaging.tone}</span>
          </div>
        </Section>

        {/* Outreach */}
        <Section index={5} label="REACH OUT">
          <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
            {outreachLabels.map((label, i) => (
              <button key={label} onClick={() => { setOutreachTab(i); setCopied(false); }} style={{
                fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500,
                color: outreachTab === i ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: outreachTab === i ? '2px solid var(--accent)' : '2px solid transparent',
                paddingBottom: '8px', transition: 'color 150ms, border-color 150ms', cursor: 'pointer',
              }}
                onMouseEnter={(e) => { if (outreachTab !== i) e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { if (outreachTab !== i) e.currentTarget.style.color = 'var(--text-muted)'; }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ background: 'var(--sidebar-bg)', borderRadius: '16px', padding: '24px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
              {company.outreach[outreachKeys[outreachTab]]}
            </p>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginTop: '16px' }}>{company.outreach.footnote}</div>
          <button onClick={handleCopy} style={{
            border: '1px solid', borderRadius: '10px',
            padding: '8px 16px', fontFamily: 'var(--font-body)', fontSize: '13px',
            color: copied ? 'var(--accent)' : 'var(--text-primary)',
            borderColor: copied ? 'var(--accent)' : 'var(--border)',
            background: copied ? 'var(--accent-tint)' : 'transparent',
            marginTop: '16px', transition: 'all 150ms', cursor: 'pointer',
          }}
            onMouseEnter={(e) => { if (!copied) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; } }}
            onMouseLeave={(e) => { if (!copied) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}>
            {copied ? 'Copied' : 'Copy to clipboard'}
          </button>
        </Section>
      </div>

      {/* ════════ CAPABILITY MATCH ════════ */}
      <div id="section-capability">
        <Section index={6} label="CAPABILITY MATCH">
          <CapabilityMatch company={company} />
        </Section>
      </div>

      {/* ════════ REASONING LOG ════════ */}
      <div id="section-reasoning">
        <Section index={7} label="REASONING LOG">
          {/* Verdict header */}
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '20px',
          }}>
            Analysis complete for {company.name} · Verdict: <span style={{
              color: company.confidence === 'HIGH' ? 'var(--accent)' : company.confidence === 'MEDIUM' ? 'var(--warning)' : 'var(--text-muted)',
              fontWeight: 600,
            }}>{company.confidence}</span> · Recommended persona: {company.decisionMaker.role.split('·')[0].trim()}
          </p>

          <div style={{
            background: 'var(--sidebar-bg)', borderRadius: '16px', padding: '24px 28px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginBottom: '20px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>LIVE</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {company.trace.map((line, i) => (
                <div key={i} style={{
                  fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.7,
                  display: 'flex', gap: '16px',
                }}>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{line.time}</span>
                  <span style={{ color: 'var(--accent)', flexShrink: 0, minWidth: '130px', fontWeight: 500 }}>{line.agent}</span>
                  <span style={{ color: 'var(--text-primary)' }}>→  {line.action}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}

/* ═══════ HELPERS ═══════ */

function Section({ children, index, label }) {
  return (
    <section style={{ marginBottom: '64px', animation: 'sectionUp 200ms ease-out both', animationDelay: `${index * 60}ms` }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
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
