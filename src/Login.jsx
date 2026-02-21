import { useState } from 'react';

export default function LoginScreen({ onComplete }) {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [error, setError] = useState('');

    const handleLogin = () => {
        if (user === 'admin' && pass === 'admin') {
            localStorage.setItem('datavex_auth', 'true');
            onComplete();
        } else {
            setError('Invalid credentials. Try admin / admin.');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleLogin();
    };

    return (
        <div style={{
            minHeight: '100vh', background: 'var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '40px 24px',
        }}>
            <div style={{ width: '100%', maxWidth: '380px', animation: 'contentFade 200ms ease-out' }}>
                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)' }} />
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--text-primary)' }}>
                            DataVex AI
                        </span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Sales Intelligence Platform
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-card)', padding: '40px 32px',
                    boxShadow: 'var(--shadow)',
                }}>
                    <h2 style={{
                        fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 400,
                        marginBottom: '32px', textAlign: 'center',
                    }}>
                        Sign in
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{
                                display: 'block', fontFamily: 'var(--font-body)', fontSize: '12px',
                                fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px',
                            }}>
                                Username
                            </label>
                            <input
                                type="text" value={user}
                                onChange={(e) => { setUser(e.target.value); setError(''); }}
                                onKeyDown={handleKeyDown}
                                placeholder="admin"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label style={{
                                display: 'block', fontFamily: 'var(--font-body)', fontSize: '12px',
                                fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px',
                            }}>
                                Password
                            </label>
                            <input
                                type="password" value={pass}
                                onChange={(e) => { setPass(e.target.value); setError(''); }}
                                onKeyDown={handleKeyDown}
                                placeholder="••••••"
                            />
                        </div>

                        {error && (
                            <p style={{
                                fontFamily: 'var(--font-body)', fontSize: '12px',
                                color: 'var(--warning)', textAlign: 'center',
                            }}>
                                {error}
                            </p>
                        )}

                        <button
                            onClick={handleLogin}
                            style={{
                                fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500,
                                color: 'var(--surface)', background: 'var(--accent)',
                                padding: '12px 24px', borderRadius: 'var(--radius-input)',
                                cursor: 'pointer', transition: 'opacity 150ms', marginTop: '8px',
                                width: '100%',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                            Sign in
                        </button>
                    </div>
                </div>

                <p style={{
                    fontFamily: 'var(--font-mono)', fontSize: '10px',
                    color: 'var(--text-muted)', textAlign: 'center', marginTop: '32px',
                    letterSpacing: '0.04em',
                }}>
                    DataVex AI · v2.4.1 · Synth Layer Active
                </p>
            </div>
        </div>
    );
}
