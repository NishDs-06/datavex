import { CAPABILITIES } from './data';

export default function CapabilityMatch({ company }) {
    const match = company.strongestMatch;

    return (
        <div>
            {/* Strongest match summary */}
            <div style={{
                background: 'var(--accent-tint)', border: '1px solid var(--accent)',
                borderRadius: '16px', padding: '24px 28px', marginBottom: '32px',
                display: 'flex', alignItems: 'center', gap: '24px',
            }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: 'var(--accent)', lineHeight: 1 }}>
                    {match.score}%
                </span>
                <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                        STRONGEST MATCH
                    </span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', marginTop: '4px' }}>
                        {match.capability} →  {match.pain}
                    </p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                        GAP: {match.gap}
                    </p>
                </div>
            </div>

            {/* Full-width capability cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {CAPABILITIES.map((cap) => {
                    const matches = company.capabilityMatch.filter(cm => cm.capability === cap.name);
                    const hasMatch = matches.length > 0;
                    const avgScore = hasMatch ? cap.score : 0;

                    return (
                        <div key={cap.name} style={{
                            borderBottom: '1px solid var(--border)', paddingBottom: '16px', paddingTop: '16px',
                        }}>
                            {/* Capability header row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                        {cap.name}
                                    </h4>
                                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                        {cap.desc}
                                    </p>
                                </div>
                                <span style={{
                                    fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500,
                                    padding: '4px 10px', borderRadius: '6px', flexShrink: 0,
                                    border: '1px solid',
                                    borderColor: avgScore >= 80 ? 'var(--accent)' : 'var(--warning)',
                                    color: avgScore >= 80 ? 'var(--accent)' : 'var(--warning)',
                                }}>
                                    {cap.score}%
                                </span>
                            </div>

                            {/* Inline pain matches */}
                            {hasMatch && (
                                <div style={{ marginTop: '10px' }}>
                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)' }}>
                                        Matches: {matches.map(m => m.pain).join(' · ')}
                                    </span>
                                </div>
                            )}
                            {!hasMatch && (
                                <div style={{ marginTop: '10px' }}>
                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        No matching pain signal detected
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
