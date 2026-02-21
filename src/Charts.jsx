/* SVG business charts — pure React, no libraries */

/* ═══════════ MARGIN AREA CHART ═══════════ */

export function MarginChart({ data }) {
    const { quarters, margin } = data;
    const W = 260, H = 120, PAD = { t: 8, r: 8, b: 24, l: 36 };
    const cW = W - PAD.l - PAD.r;
    const cH = H - PAD.t - PAD.b;
    const minV = Math.floor(Math.min(...margin) - 1);
    const maxV = Math.ceil(Math.max(...margin) + 1);
    const range = maxV - minV || 1;

    const pts = margin.map((v, i) => ({
        x: PAD.l + (i / (margin.length - 1)) * cW,
        y: PAD.t + (1 - (v - minV) / range) * cH,
    }));

    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const areaPath = `${linePath} L${pts[pts.length - 1].x},${PAD.t + cH} L${pts[0].x},${PAD.t + cH} Z`;
    const trending = margin[margin.length - 1] < margin[0] ? 'down' : 'up';
    const color = trending === 'down' ? 'var(--warning)' : 'var(--accent)';
    const fillColor = trending === 'down' ? 'rgba(194, 96, 31, 0.12)' : 'rgba(26, 107, 71, 0.12)';

    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
            {/* Y-axis labels */}
            {[minV, Math.round((minV + maxV) / 2), maxV].map((v) => {
                const y = PAD.t + (1 - (v - minV) / range) * cH;
                return (
                    <g key={v}>
                        <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="var(--border)" strokeWidth="0.5" />
                        <text x={PAD.l - 4} y={y + 3} textAnchor="end" fontSize="8" fontFamily="var(--font-mono)" fill="var(--text-muted)">{v}%</text>
                    </g>
                );
            })}
            {/* Area + line */}
            <path d={areaPath} fill={fillColor} />
            <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Dots */}
            {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} />
            ))}
            {/* X-axis labels */}
            {quarters.map((q, i) => (
                <text key={q} x={PAD.l + (i / (quarters.length - 1)) * cW} y={H - 4} textAnchor="middle" fontSize="7" fontFamily="var(--font-mono)" fill="var(--text-muted)">{q}</text>
            ))}
        </svg>
    );
}


/* ═══════════ HIRING BAR CHART ═══════════ */

export function HiringChart({ data }) {
    const maxCount = Math.max(...data.map(d => d.count), 1);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.map((d) => (
                <div key={d.category} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)',
                        width: '110px', flexShrink: 0, textAlign: 'right',
                    }}>
                        {d.category}
                    </span>
                    <div style={{ flex: 1, height: '14px', background: 'var(--accent-soft)', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${(d.count / maxCount) * 100}%`,
                            background: d.type === 'warning' ? 'var(--warning)' : d.type === 'positive' ? 'var(--accent)' : 'var(--border)',
                            borderRadius: '8px',
                            transition: 'width 400ms ease-out',
                            minWidth: d.count > 0 ? '4px' : '0',
                        }} />
                    </div>
                    <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500,
                        color: d.type === 'warning' ? 'var(--warning)' : d.type === 'positive' ? 'var(--accent)' : 'var(--text-muted)',
                        width: '24px', flexShrink: 0,
                    }}>
                        {d.count}
                    </span>
                </div>
            ))}
        </div>
    );
}


/* ═══════════ SCORE DONUT CHART ═══════════ */

export function ScoreDonut({ data, total }) {
    const R = 42, CX = 56, CY = 56, SW = 10;
    const C = 2 * Math.PI * R;
    let offset = 0;
    const colors = ['#1A6B47', '#2D8B63', '#4DA67E', '#8FCBB3'];

    const segments = data.map((d, i) => {
        const pct = d.value / 100;
        const len = pct * C;
        const seg = { ...d, dashLen: len, dashOffset: -offset, color: colors[i % colors.length] };
        offset += len;
        return seg;
    });

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <svg viewBox="0 0 112 112" style={{ width: '112px', height: '112px', flexShrink: 0 }}>
                <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--accent-soft)" strokeWidth={SW} />
                {segments.map((s, i) => (
                    <circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={s.color} strokeWidth={SW}
                        strokeDasharray={`${s.dashLen} ${C - s.dashLen}`}
                        strokeDashoffset={s.dashOffset}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${CX} ${CY})`}
                    />
                ))}
                <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle"
                    fontSize="20" fontFamily="var(--font-display)" fill="var(--accent)">
                    {total}
                </text>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {segments.map((s) => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)' }}>
                            {s.label}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-primary)', fontWeight: 500 }}>
                            {s.value}/{s.max}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
