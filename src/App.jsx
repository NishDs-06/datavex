import { useState, useEffect, useCallback } from 'react';
import { COMPANIES } from './data';
import LoginScreen from './Login';
import { MarginChart, HiringChart, ScoreDonut } from './Charts';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeCompany, setActiveCompany] = useState(0);
  const [outreachTab, setOutreachTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [contentKey, setContentKey] = useState(0);

  // Check localStorage on mount
  useEffect(() => {
    if (localStorage.getItem('datavex_setup')) setLoggedIn(true);
  }, []);

  const company = COMPANIES[activeCompany];
  const outreachKeys = ['email', 'linkedin', 'opener'];
  const outreachLabels = ['EMAIL', 'LINKEDIN', 'OPENER'];

  const handleCompanySelect = useCallback((idx) => {
    setActiveCompany(idx);
    setOutreachTab(0);
    setCopied(false);
    setContentKey((k) => k + 1);
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

  if (!loggedIn) return <LoginScreen onComplete={() => setLoggedIn(true)} />;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* ════════════ SIDEBAR ════════════ */}
      <aside style={{
        width: '220px', flexShrink: 0, height: '100vh',
        background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)',
        padding: '24px 16px', display: 'flex', flexDirection: 'column',
        gap: '8px', overflowY: 'auto',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', marginBottom: '24px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--text-primary)' }}>DataVex AI</span>
        </div>

        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--text-muted)', paddingLeft: '8px', marginBottom: '8px',
        }}>
          Active Targets
        </div>

        {COMPANIES.map((c, i) => {
          const isActive = activeCompany === i;
          return (
            <button key={c.id} onClick={() => handleCompanySelect(i)} style={{
              textAlign: 'left', padding: '16px', borderRadius: 'var(--radius-card)',
              border: isActive ? 'none' : '1px solid var(--border)',
              borderLeft: isActive ? '3px solid var(--accent)' : undefined,
              background: 'var(--surface)', boxShadow: isActive ? 'var(--shadow)' : 'none',
              cursor: 'pointer', transition: 'border-color 150ms',
              display: 'flex', flexDirection: 'column', gap: '4px',
            }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.borderColor = '#C8C3BA'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border)'; }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)' }}>{c.descriptor.split('·')[0].trim()}</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500, marginTop: '4px',
                color: c.confidence === 'HIGH' ? 'var(--accent)' : c.confidence === 'MEDIUM' ? 'var(--warning)' : 'var(--text-muted)',
              }}>{c.score} · {c.confidence}</span>
            </button>
          );
        })}

        {/* Logout */}
        <button onClick={() => { localStorage.removeItem('datavex_setup'); setLoggedIn(false); }}
          style={{ marginTop: 'auto', fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)', padding: '8px', textAlign: 'left' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--warning)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
          Reset setup →
        </button>
      </aside>

      {/* ════════════ MAIN ════════════ */}
      <main id="main-scroll" key={contentKey} style={{
        flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center',
        padding: '64px 40px 96px', animation: 'contentFade 160ms ease-out',
      }}>
        <div style={{ width: '100%', maxWidth: '720px' }}>

          {/* ── HEADER ── */}
          <Section index={0}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 400, color: 'var(--text-primary)', lineHeight: 1.1 }}>{company.name}</h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-muted)', marginTop: '8px' }}>{company.descriptor}</p>
            <div style={{ marginTop: '40px' }}><ScoreCounter target={company.score} key={activeCompany} /></div>
            <div style={{ width: '40px', height: '3px', background: 'var(--accent)', borderRadius: '2px', marginTop: '8px' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '16px' }}>
              {'CONFIDENCE · '}<span style={{ color: company.confidence === 'HIGH' ? 'var(--accent)' : company.confidence === 'MEDIUM' ? 'var(--warning)' : 'var(--text-muted)' }}>{company.confidence}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>DATA COVERAGE: {company.coverage}%</div>
          </Section>

          {/* ── AT A GLANCE (CHARTS) ── */}
          <Section index={1} label="AT A GLANCE">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Margin chart */}
              <ChartCard title="Operating Margin" subtitle={`${company.financials.margin[company.financials.margin.length - 1]}% current`}>
                <MarginChart data={company.financials} />
              </ChartCard>
              {/* Hiring chart */}
              <ChartCard title="Hiring Signals" subtitle={`${company.hiring.reduce((s, h) => s + h.count, 0)} open roles tracked`}>
                <HiringChart data={company.hiring} />
              </ChartCard>
            </div>
            {/* Score breakdown — full width */}
            <div style={{ marginTop: '16px' }}>
              <ChartCard title="Score Composition" subtitle={`${company.score} / 100 opportunity score`}>
                <ScoreDonut data={company.scoreBreakdown} total={company.score} />
              </ChartCard>
            </div>
          </Section>

          {/* ── WHY NOW ── */}
          <Section index={2} label="WHY NOW">
            <div style={{
              display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: '11px',
              letterSpacing: '0.08em', padding: '8px 16px',
              background: 'var(--accent-tint)', border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-input)', color: 'var(--accent)', marginBottom: '40px',
            }}>RECEPTIVITY WINDOW · {company.receptivity}</div>
            <div style={{ position: 'relative', paddingLeft: '24px' }}>
              <div style={{ position: 'absolute', left: '3px', top: '4px', bottom: '4px', width: '1px', background: 'var(--border)' }} />
              {company.timeline.map((evt, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: i < company.timeline.length - 1 ? '40px' : '0' }}>
                  <div style={{
                    position: 'absolute', left: '-24px', top: '4px', width: '8px', height: '8px', borderRadius: '50%',
                    background: evt.type === 'positive' ? 'var(--accent)' : 'var(--warning)', marginLeft: '-3px',
                  }} />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>{evt.date}</div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.65 }}>{evt.label}</p>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>[{evt.source}]</span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── PAIN MAP ── */}
          <Section index={3} label="WHERE IT HURTS">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {company.painClusters.map((cluster, i) => (
                <div key={i} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)', padding: '32px', boxShadow: 'var(--shadow)',
                }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '16px' }}>{cluster.title}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cluster.evidence.map((ev, j) => (
                      <div key={j} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)',
                          background: 'var(--accent-tint)', padding: '2px 6px',
                          borderRadius: 'var(--radius-input)', flexShrink: 0, marginTop: '3px', fontWeight: 500,
                        }}>{ev.source}</span>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>{ev.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── DECISION MAKER ── */}
          <Section index={4} label="WHO TO TALK TO">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: 400, color: 'var(--text-primary)' }}>{company.decisionMaker.name}</h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>{company.decisionMaker.role}</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
              {company.decisionMaker.topics.map((t) => (
                <span key={t} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-input)', padding: '6px 8px', fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-primary)' }}>{t}</span>
              ))}
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '24px', boxShadow: 'var(--shadow)', marginTop: '24px' }}>
              <MiniLabel>PRIMARY ANGLE</MiniLabel>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '16px' }}>{company.decisionMaker.messaging.angle}</p>
              <MiniLabel>VOCABULARY MATCH</MiniLabel>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {company.decisionMaker.messaging.vocab.map((v) => (
                  <span key={v} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-input)', padding: '4px 8px', fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--accent)' }}>{v}</span>
                ))}
              </div>
              <MiniLabel>TONE</MiniLabel>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--accent)' }}>{company.decisionMaker.messaging.tone}</span>
            </div>
          </Section>

          {/* ── OUTREACH ── */}
          <Section index={5} label="REACH OUT">
            <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
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
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '24px', boxShadow: 'var(--shadow)' }}>
              <div style={{ background: 'var(--sidebar-bg)', borderRadius: '12px', padding: '16px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                  {company.outreach[outreachKeys[outreachTab]]}
                </p>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginTop: '16px', lineHeight: 1.4 }}>{company.outreach.footnote}</div>
            <button onClick={handleCopy} style={{
              border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
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

          {/* ── AGENT TRACE ── */}
          <Section index={6} label="HOW WE GOT HERE">
            <div style={{ background: 'var(--sidebar-bg)', borderRadius: 'var(--radius-section)', padding: '16px 24px', maxHeight: '220px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>LIVE</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {company.trace.map((line, i) => (
                  <div key={i} style={{
                    fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.7,
                    display: 'flex', gap: '16px',
                    animation: 'traceIn 200ms ease-out both', animationDelay: `${i * 40}ms`,
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
      </main>
    </div>
  );
}

/* ═══════ HELPERS ═══════ */

function Section({ children, index, label }) {
  return (
    <section style={{ marginBottom: '64px', animation: 'sectionUp 200ms ease-out both', animationDelay: `${index * 70}ms` }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</span>
        </div>
      )}
      {children}
    </section>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card)', padding: '24px', boxShadow: 'var(--shadow)',
    }}>
      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</h4>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '16px' }}>{subtitle}</p>
      {children}
    </div>
  );
}

function MiniLabel({ children }) {
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
      {children}
    </div>
  );
}

function ScoreCounter({ target }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const r = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (r) { setValue(target); return; }
    const dur = 600, start = performance.now();
    let raf;
    setValue(0);
    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1);
      setValue(Math.round((1 - Math.pow(1 - t, 3)) * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return <span style={{ fontFamily: 'var(--font-display)', fontSize: '88px', fontWeight: 400, color: 'var(--accent)', lineHeight: 1 }}>{value}</span>;
}
