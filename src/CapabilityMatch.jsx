import { CAPABILITIES } from './data';

const severityColor = (s) =>
    s === 'HIGH' ? '#C2601F' : s === 'MED' ? '#D4A017' : '#9B9489';

export default function CapabilityMatch({ company }) {
    const match = company.strongestMatch;

    return (
        <div>
            {/* Strongest match summary */}
            <div style={{
                background: 'var(--accent-tint)', border: '1px solid var(--accent)',
                borderRadius: 'var(--radius-card)', padding: '24px 28px', marginBottom: '32px',
                display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap',
            }}>
                <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                        STRONGEST MATCH
                    </span>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: 'var(--accent)', lineHeight: 1, marginTop: '4px' }}>
                        {match.score}%
                    </div>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {match.capability} →  {match.pain}
                    </p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                        GAP IDENTIFIED: {match.gap}
                    </p>
                </div>
            </div>

            {/* Two-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Left: Capabilities */}
                <div>
                    <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em',
                        textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px',
                    }}>
                        DATAVEX CAPABILITIES
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {CAPABILITIES.map((cap) => {
                            const matched = company.capabilityMatch.some(cm => cm.capability === cap.name);
                            return (
                                <div key={cap.name} style={{
                                    background: 'var(--surface)', border: '1px solid',
                                    borderColor: matched ? 'var(--accent)' : 'var(--border)',
                                    borderRadius: 'var(--radius-card)', padding: '20px',
                                    boxShadow: matched ? '0 0 0 1px var(--accent)' : 'var(--shadow)',
                                    transition: 'border-color 150ms',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {cap.name}
                                        </h4>
                                        <span style={{
                                            fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600,
                                            color: cap.score >= 90 ? 'var(--accent)' : cap.score >= 80 ? 'var(--text-primary)' : 'var(--text-muted)',
                                        }}>
                                            {cap.score}%
                                        </span>
                                    </div>
                                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                        {cap.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Detected Pain Points */}
                <div>
                    <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em',
                        textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px',
                    }}>
                        DETECTED PAIN POINTS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {company.capabilityMatch.map((cm, i) => (
                            <div key={i} style={{
                                background: 'var(--surface)', border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-card)', padding: '20px',
                                boxShadow: 'var(--shadow)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                            }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                        {cm.pain}
                                    </p>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        {cm.source}
                                    </span>
                                </div>
                                <span style={{
                                    fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700,
                                    letterSpacing: '0.06em', padding: '4px 10px',
                                    borderRadius: '4px', color: '#fff', flexShrink: 0,
                                    background: severityColor(cm.severity),
                                }}>
                                    {cm.severity}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
