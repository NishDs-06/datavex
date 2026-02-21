import { COMPANIES } from './data';

const severityColor = (s) =>
    s === 'HIGH PAIN' ? '#C2601F' : s === 'MED PAIN' ? '#D4A017' : '#9B9489';

export default function LeadBoard({ onSelectCompany, activeCompany }) {
    return (
        <div style={{ animation: 'contentFade 160ms ease-out' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 400, color: 'var(--text-primary)' }}>
                        Lead Intelligence Board
                    </h1>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Prioritized accounts via multi-agent signal synthesis.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={{
                        border: '1px solid var(--border)', borderRadius: '10px',
                        padding: '10px 20px', fontFamily: 'var(--font-body)', fontSize: '13px',
                        color: 'var(--text-primary)', transition: 'border-color 150ms', cursor: 'pointer',
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                        Export Config
                    </button>
                    <button style={{
                        border: 'none', borderRadius: '10px',
                        padding: '10px 20px', fontFamily: 'var(--font-body)', fontSize: '13px',
                        fontWeight: 500, color: 'var(--surface)', background: 'var(--accent)',
                        transition: 'opacity 150ms', cursor: 'pointer',
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                        Run Full Scan
                    </button>
                </div>
            </div>

            {/* Stacked rows */}
            <div>
                {COMPANIES.map((c, i) => {
                    const isActive = activeCompany === i;
                    return (
                        <button
                            key={c.id}
                            onClick={() => onSelectCompany(i)}
                            style={{
                                display: 'flex', alignItems: 'center', width: '100%',
                                textAlign: 'left', padding: '24px 20px',
                                background: isActive ? 'var(--surface)' : 'transparent',
                                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                                borderTop: 'none', borderRight: 'none',
                                borderBottom: '1px solid var(--border)',
                                cursor: 'pointer', transition: 'background 120ms',
                                gap: '16px',
                            }}
                            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#F5F3F0'; }}
                            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = isActive ? 'var(--surface)' : 'transparent'; }}
                        >
                            {/* Left: name + industry */}
                            <div style={{ flex: '0 0 220px' }}>
                                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 400, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                                    {c.name}
                                </h3>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {c.descriptor.split('·').slice(0, 2).map(s => s.trim()).join(' · ')}
                                </p>
                            </div>

                            {/* Middle: pain chips + DM */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {c.painTags.map((tag, j) => (
                                        <span key={j} style={{
                                            fontFamily: 'var(--font-body)', fontSize: '11px',
                                            padding: '4px 8px', borderRadius: '6px',
                                            border: '1px solid', borderColor: severityColor(tag),
                                            color: severityColor(tag),
                                        }}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)' }}>
                                    DM: {c.decisionMaker.name}
                                </span>
                            </div>

                            {/* Right: score */}
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <span style={{
                                    fontFamily: 'var(--font-mono)', fontSize: '32px', fontWeight: 500,
                                    color: c.score >= 80 ? 'var(--accent)' : c.score >= 60 ? 'var(--warning)' : 'var(--text-muted)',
                                    lineHeight: 1,
                                }}>
                                    {c.score}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
