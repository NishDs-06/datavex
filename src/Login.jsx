import { useState } from 'react';

const STEPS = ['Company Profile', 'Data Sources'];

export default function LoginScreen({ onComplete }) {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState({
        companyName: '', industry: '', website: '', companySize: '',
        contactName: '', contactEmail: '', contactRole: '',
        dbHost: '', dbPort: '5432', dbName: '', dbUser: '', dbPassword: '',
        crmKey: '', analyticsKey: '',
        sources: { github: true, g2: true, linkedin: true, jobBoards: true, sec: false },
    });

    const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
    const toggleSource = (key) => setForm((f) => ({
        ...f, sources: { ...f.sources, [key]: !f.sources[key] },
    }));

    const canProceed = step === 0
        ? form.companyName && form.contactName && form.contactEmail
        : form.dbHost && form.dbName && form.dbUser;

    const handleSubmit = () => {
        localStorage.setItem('datavex_setup', JSON.stringify(form));
        onComplete(form);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '520px',
                animation: 'contentFade 200ms ease-out',
            }}>
                {/* Logo */}
                <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: 'var(--accent)', flexShrink: 0,
                        }} />
                        <span style={{
                            fontFamily: 'var(--font-display)', fontSize: '28px',
                            color: 'var(--text-primary)',
                        }}>
                            DataVex AI
                        </span>
                    </div>
                    <p style={{
                        fontFamily: 'var(--font-body)', fontSize: '14px',
                        color: 'var(--text-muted)', marginTop: '4px',
                    }}>
                        Intelligence setup — connect once, monitor continuously
                    </p>
                </div>

                {/* Progress */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
                    {STEPS.map((s, i) => (
                        <div key={s} style={{ flex: 1 }}>
                            <div style={{
                                height: '3px',
                                borderRadius: '2px',
                                background: i <= step ? 'var(--accent)' : 'var(--border)',
                                transition: 'background 200ms',
                                marginBottom: '8px',
                            }} />
                            <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: '10px',
                                letterSpacing: '0.1em', textTransform: 'uppercase',
                                color: i <= step ? 'var(--accent)' : 'var(--text-muted)',
                            }}>
                                {i + 1}. {s}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Card */}
                <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-card)',
                    padding: '32px',
                    boxShadow: 'var(--shadow)',
                }}>
                    {step === 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 400, marginBottom: '8px' }}>
                                Tell us about your company
                            </h2>
                            <Field label="Company name" required value={form.companyName} onChange={(v) => set('companyName', v)} placeholder="e.g. Meridian Systems" />
                            <Field label="Industry" value={form.industry} onChange={(v) => set('industry', v)} placeholder="e.g. Enterprise SaaS" />
                            <Field label="Website" value={form.website} onChange={(v) => set('website', v)} placeholder="e.g. meridian.io" />
                            <div>
                                <label style={labelStyle}>Company size</label>
                                <select value={form.companySize} onChange={(e) => set('companySize', e.target.value)} style={{ cursor: 'pointer' }}>
                                    <option value="">Select range</option>
                                    <option value="1-50">1–50 employees</option>
                                    <option value="51-200">51–200 employees</option>
                                    <option value="201-1000">201–1,000 employees</option>
                                    <option value="1001-5000">1,001–5,000 employees</option>
                                    <option value="5000+">5,000+ employees</option>
                                </select>
                            </div>
                            <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0', paddingTop: '16px' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>YOUR DETAILS</span>
                            </div>
                            <Field label="Full name" required value={form.contactName} onChange={(v) => set('contactName', v)} placeholder="e.g. Marcus Rivera" />
                            <Field label="Email" required value={form.contactEmail} onChange={(v) => set('contactEmail', v)} placeholder="e.g. marcus@meridian.io" type="email" />
                            <Field label="Role" value={form.contactRole} onChange={(v) => set('contactRole', v)} placeholder="e.g. VP Engineering" />
                        </div>
                    )}

                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 400, marginBottom: '8px' }}>
                                Connect your data sources
                            </h2>
                            <div style={{ background: 'var(--accent-tint)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-input)', padding: '12px 16px' }}>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--accent)', lineHeight: 1.5 }}>
                                    Credentials are encrypted at rest and used only for intelligence gathering. No data is stored beyond vector embeddings.
                                </p>
                            </div>
                            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>DATABASE CONNECTION</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '16px' }}>
                                <Field label="Host" required value={form.dbHost} onChange={(v) => set('dbHost', v)} placeholder="db.company.com" />
                                <Field label="Port" value={form.dbPort} onChange={(v) => set('dbPort', v)} placeholder="5432" />
                            </div>
                            <Field label="Database name" required value={form.dbName} onChange={(v) => set('dbName', v)} placeholder="production_db" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <Field label="Username" required value={form.dbUser} onChange={(v) => set('dbUser', v)} placeholder="db_reader" />
                                <Field label="Password" value={form.dbPassword} onChange={(v) => set('dbPassword', v)} placeholder="••••••••" type="password" />
                            </div>
                            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', paddingTop: '8px' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>API KEYS (OPTIONAL)</span>
                            </div>
                            <Field label="CRM API key" value={form.crmKey} onChange={(v) => set('crmKey', v)} placeholder="crm_live_..." />
                            <Field label="Analytics API key" value={form.analyticsKey} onChange={(v) => set('analyticsKey', v)} placeholder="ak_prod_..." />
                            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', paddingTop: '8px' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>INTELLIGENCE SOURCES</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {[
                                    ['github', 'GitHub'], ['g2', 'G2 Reviews'], ['linkedin', 'LinkedIn'],
                                    ['jobBoards', 'Job Boards'], ['sec', 'SEC Filings'],
                                ].map(([key, label]) => (
                                    <button key={key} onClick={() => toggleSource(key)} style={{
                                        border: '1px solid', borderRadius: 'var(--radius-input)',
                                        padding: '6px 12px', fontSize: '12px', fontFamily: 'var(--font-body)',
                                        borderColor: form.sources[key] ? 'var(--accent)' : 'var(--border)',
                                        background: form.sources[key] ? 'var(--accent-tint)' : 'transparent',
                                        color: form.sources[key] ? 'var(--accent)' : 'var(--text-muted)',
                                        transition: 'all 150ms', cursor: 'pointer',
                                    }}>
                                        {form.sources[key] ? '✓ ' : ''}{label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                        {step > 0 ? (
                            <button onClick={() => setStep(step - 1)} style={{
                                fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)',
                                padding: '10px 16px', border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-input)', transition: 'border-color 150ms',
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#C8C3BA'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                                Back
                            </button>
                        ) : <div />}
                        <button
                            onClick={step < STEPS.length - 1 ? () => setStep(step + 1) : handleSubmit}
                            disabled={!canProceed}
                            style={{
                                fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500,
                                color: 'var(--surface)', background: 'var(--accent)',
                                padding: '10px 24px', borderRadius: 'var(--radius-input)',
                                opacity: canProceed ? 1 : 0.35,
                                cursor: canProceed ? 'pointer' : 'not-allowed',
                                transition: 'opacity 150ms',
                            }}>
                            {step < STEPS.length - 1 ? 'Continue' : 'Launch Intelligence'}
                        </button>
                    </div>
                </div>

                <p style={{
                    fontFamily: 'var(--font-mono)', fontSize: '10px',
                    color: 'var(--text-muted)', textAlign: 'center', marginTop: '24px',
                    letterSpacing: '0.04em',
                }}>
                    DataVex AI · Mangaluru, Karnataka · datavex.ai
                </p>
            </div>
        </div>
    );
}

const labelStyle = {
    display: 'block', fontFamily: 'var(--font-body)',
    fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)',
    marginBottom: '4px',
};

function Field({ label, value, onChange, placeholder, type = 'text', required }) {
    return (
        <div>
            <label style={labelStyle}>
                {label}{required && <span style={{ color: 'var(--accent)', marginLeft: '2px' }}>*</span>}
            </label>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
        </div>
    );
}
