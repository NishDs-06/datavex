import { COMPANIES } from './data';

const severityColor = (s) =>
    s === 'HIGH PAIN' ? '#C2601F' : s === 'MED PAIN' ? '#D4A017' : '#9B9489';

export default function LeadBoard({ onSelectCompany }) {
    return (
        <div style={{ animation: 'contentFade 160ms ease-out' }}>
            {/* Header bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
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
                        border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
                        padding: '8px 16px', fontFamily: 'var(--font-body)', fontSize: '13px',
                        color: 'var(--text-primary)', transition: 'border-color 150ms',
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                        Export Config
                    </button>
                    <button style={{
                        border: 'none', borderRadius: 'var(--radius-input)',
                        padding: '8px 16px', fontFamily: 'var(--font-body)', fontSize: '13px',
                        fontWeight: 500, color: 'var(--surface)', background: 'var(--accent)',
                        transition: 'opacity 150ms',
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                        Run Full Scan
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {COMPANIES.map((c, i) => (
                    <button
                        key={c.id}
                        onClick={() => onSelectCompany(i)}
                        style={{
                            textAlign: 'left', padding: '28px',
                            background: 'var(--surface)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow)',
                            cursor: 'pointer', transition: 'border-color 150ms, box-shadow 150ms',
                            display: 'flex', flexDirection: 'column', gap: '12px',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                    >
                        {/* Name + Score */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 400, color: 'var(--text-primary)' }}>{c.name}</h3>
                                <p style={{
                                    fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em',
                                    textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '4px',
                                }}>
                                    {c.descriptor.split('·').slice(0, 2).map(s => s.trim()).join(' · ')}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{
                                    fontFamily: 'var(--font-display)', fontSize: '36px',
                                    color: c.score >= 80 ? 'var(--accent)' : c.score >= 60 ? 'var(--warning)' : 'var(--text-muted)',
                                    lineHeight: 1,
                                }}>
                                    {c.score}
                                </span>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>SCORE</div>
                            </div>
                        </div>

                        {/* Pain tags */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {c.painTags.map((tag, j) => (
                                <span key={j} style={{
                                    fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 600,
                                    letterSpacing: '0.06em', padding: '3px 8px',
                                    borderRadius: '4px', color: '#fff',
                                    background: severityColor(tag),
                                }}>
                                    {tag}
                                </span>
                            ))}
                            {c.painTags.length > 0 && (
                                <span style={{
                                    fontFamily: 'var(--font-mono)', fontSize: '9px',
                                    padding: '3px 8px', borderRadius: '4px',
                                    border: '1px solid var(--border)', color: 'var(--text-muted)',
                                }}>
                                    +{c.capabilityMatch.length - c.painTags.length > 0 ? c.capabilityMatch.length - c.painTags.length : 0}
                                </span>
                            )}
                        </div>

                        {/* DM Target */}
                        <div style={{ marginTop: '4px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>DM TARGET:</span>
                            <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                                {c.decisionMaker.name}
                            </div>
                        </div>

                        {/* Profile link */}
                        <div style={{ textAlign: 'right', marginTop: 'auto' }}>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--accent)' }}>
                                Profile →
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
