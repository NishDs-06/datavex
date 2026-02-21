

const tagStyle = (tag) => {
    if (tag === 'HIGH PAIN' || tag === 'HIGH') return { border: '1px solid #C2601F', color: '#C2601F' };
    if (tag === 'MED PAIN' || tag === 'MEDIUM') return { border: '1px solid #9B9489', color: '#9B9489' };
    return { border: '1px solid #E8E4DE', color: '#9B9489' };
};

export default function LeadBoard({ companies = [], onSelectCompany, onScan, scanState }) {

    return (
        <div style={{ animation: 'contentFade 160ms ease-out' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '48px' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 400, color: 'var(--text-primary)' }}>
                        Lead Intelligence Board
                    </h1>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#9B9489', marginTop: '6px' }}>
                        Prioritized accounts via multi-agent signal synthesis.
                    </p>
                </div>
                <button
                    onClick={onScan}
                    disabled={!!scanState}
                    style={{
                        border: 'none', borderRadius: '16px',
                        padding: '16px 32px', fontFamily: 'var(--font-body)', fontSize: '15px',
                        fontWeight: 600, color: '#FFFFFF',
                        background: scanState ? '#9B9489' : 'var(--accent)',
                        boxShadow: 'var(--shadow-button)',
                        transition: 'background 150ms, box-shadow 150ms',
                        cursor: scanState ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => { if (!scanState) { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.boxShadow = '0 3px 12px rgba(26,107,71,0.35)'; } }}
                    onMouseLeave={(e) => { if (!scanState) { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.boxShadow = 'var(--shadow-button)'; } }}
                >
                    {scanState ? 'Scanning...' : 'Run Scan'}
                </button>
            </div>

            {/* ═══════ SCAN PROGRESS ═══════ */}
            {scanState && (
                <div style={{
                    background: 'var(--surface)', border: '1px solid var(--accent)',
                    borderRadius: '20px', padding: '24px 32px', marginBottom: '32px',
                    animation: 'contentFade 200ms ease-out',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: scanState.status === 'completed' ? 'var(--accent)' : scanState.status === 'failed' ? 'var(--warning)' : 'var(--accent)',
                                animation: scanState.status === 'running' || scanState.status === 'queued' ? 'pulse 1.5s ease-in-out infinite' : 'none',
                            }} />
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--text-primary)' }}>
                                {scanState.status === 'completed' ? '✓ Scan Complete' :
                                    scanState.status === 'failed' ? '✗ Scan Failed' :
                                        `Scanning: ${scanState.company_name}`}
                            </span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)' }}>
                            {Math.round((scanState.progress || 0) * 100)}%
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{
                        height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%', background: scanState.status === 'failed' ? 'var(--warning)' : 'var(--accent)',
                            width: `${Math.max(5, (scanState.progress || 0) * 100)}%`,
                            borderRadius: '2px',
                            transition: 'width 500ms ease-out',
                        }} />
                    </div>

                    {/* Agent status */}
                    {(scanState.agents_completed?.length > 0 || scanState.agents_pending?.length > 0) && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                            {(scanState.agents_completed || []).map((a) => (
                                <span key={a} style={{
                                    fontFamily: 'var(--font-mono)', fontSize: '10px',
                                    padding: '4px 10px', borderRadius: '12px',
                                    background: 'var(--accent-tint)', color: 'var(--accent)',
                                    border: '1px solid var(--accent)',
                                }}>{a} ✓</span>
                            ))}
                            {(scanState.agents_pending || []).map((a) => (
                                <span key={a} style={{
                                    fontFamily: 'var(--font-mono)', fontSize: '10px',
                                    padding: '4px 10px', borderRadius: '12px',
                                    background: 'transparent', color: 'var(--text-muted)',
                                    border: '1px solid var(--border)',
                                }}>{a}</span>
                            ))}
                        </div>
                    )}

                    {scanState.error_message && (
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--warning)', marginTop: '12px' }}>
                            Error: {scanState.error_message}
                        </p>
                    )}
                </div>
            )}

            {/* ═══════ COMPANY CARDS ═══════ */}
            {companies.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    {companies.map((c) => {
                        const painTags = c.pain_tags || c.painTags || [];
                        const dm = c.decision_maker || c.decisionMaker || {};
                        const descriptorParts = (c.descriptor || '').split('·').slice(0, 2).map(s => s.trim()).join(' · ');

                        return (
                            <div
                                key={c.id}
                                onClick={() => onSelectCompany(c.id)}
                                style={{
                                    padding: '40px', cursor: 'pointer',
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '24px',
                                    boxShadow: 'var(--shadow)',
                                    transition: 'box-shadow 150ms, border-color 150ms',
                                    display: 'flex', flexDirection: 'column',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                            >
                                {/* Top: name + score */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <div>
                                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 400, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                                            {c.name}
                                        </h3>
                                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                            {descriptorParts || 'Analysis in progress...'}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <span style={{
                                            fontFamily: 'var(--font-display)', fontSize: '52px',
                                            color: c.score >= 80 ? 'var(--accent)' : c.score >= 60 ? 'var(--warning)' : 'var(--text-muted)',
                                            lineHeight: 1,
                                        }}>
                                            {c.score}
                                        </span>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '2px' }}>SCORE</div>
                                    </div>
                                </div>

                                {/* Confidence badge */}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                                    <span style={{
                                        fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600,
                                        padding: '4px 10px', borderRadius: '12px',
                                        background: c.confidence === 'HIGH' ? 'var(--accent-tint)' : 'transparent',
                                        color: c.confidence === 'HIGH' ? 'var(--accent)' : c.confidence === 'MEDIUM' ? 'var(--warning)' : 'var(--text-muted)',
                                        border: `1px solid ${c.confidence === 'HIGH' ? 'var(--accent)' : c.confidence === 'MEDIUM' ? 'var(--warning)' : 'var(--border)'}`,
                                    }}>{c.confidence}</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                                        {c.coverage}% coverage
                                    </span>
                                </div>

                                {/* Pain tags */}
                                {painTags.length > 0 && (
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                                        {painTags.map((tag, j) => (
                                            <span key={j} style={{
                                                fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 500,
                                                padding: '6px 12px', borderRadius: '20px',
                                                background: 'transparent',
                                                ...tagStyle(tag),
                                            }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* DM Target */}
                                {dm.name && (
                                    <div style={{ marginTop: '32px' }}>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#9B9489', textTransform: 'uppercase', letterSpacing: '0.1em' }}>DM TARGET</span>
                                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                                            {dm.name}
                                        </div>
                                        {dm.role && <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{dm.role}</div>}
                                    </div>
                                )}

                                {/* Profile link */}
                                <div style={{ marginTop: 'auto', paddingTop: '20px', textAlign: 'right' }}>
                                    <span
                                        className="profile-link"
                                        style={{
                                            fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--accent)',
                                            display: 'inline-block', transition: 'transform 150ms',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(3px)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                                    >
                                        Profile →
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : !scanState && (
                /* Empty state */
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '80px 40px',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '24px', boxShadow: 'var(--shadow)',
                }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        background: 'var(--accent-tint)', border: '2px solid var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '24px',
                    }}>
                        <span style={{ fontSize: '28px' }}>🔍</span>
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        No targets analyzed yet
                    </h2>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '400px' }}>
                        Type a company name in the search bar above and click <strong>Run Scan</strong> to start your first intelligence analysis.
                    </p>
                </div>
            )}
        </div>
    );
}
