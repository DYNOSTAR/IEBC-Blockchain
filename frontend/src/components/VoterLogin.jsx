import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/auth.css';

/* ── Inline SVG icons ───────────────────────────────────────── */
const Ico = ({ d, size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true">
        <path d={d} />
    </svg>
);
const EYE     = 'M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5zm7-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z';
const EYE_OFF = 'M2 2l12 12M6.7 6.7A3 3 0 0 0 10.9 10.9M4 4.1A8 8 0 0 0 1 8s3 5 7 5a7 7 0 0 0 3.5-1M9.5 3.5A7 7 0 0 1 15 8s-.7 1.4-2 2.6';
const SHIELD  = 'M8 1L3 4v4c0 3.5 2.5 6 5 7 2.5-1 5-3.5 5-7V4L8 1z';
const LOCK    = 'M5 8V6a3 3 0 0 1 6 0v2M3 8h10v7H3V8zm5 2v3';
const ALERT   = 'M8 3l5.9 10.5H2.1L8 3zm0 4v3m0 2h.01';
const LOGIN   = 'M10 3h3v10h-3M7 11l3-3-3-3M1 8h9';

const API = 'http://localhost:5000/api';

const VoterLogin = () => {
    const navigate = useNavigate();
    const [showPw,  setShowPw]  = useState(false);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');
    const [form,    setForm]    = useState({ nationalId: '', password: '' });

    const set = (k) => (e) => { setForm(p => ({ ...p, [k]: e.target.value })); setError(''); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nationalId.trim() || !form.password) { setError('Please fill in all fields.'); return; }
        setLoading(true); setError('');
        try {
            const r = await axios.post(`${API}/auth/voter/login`, {
                nationalId: form.nationalId.trim(),
                password:   form.password,
            });
            if (r.data.success && r.data.token) {
                localStorage.setItem('token', r.data.token);
                localStorage.setItem('user',  JSON.stringify(r.data.user || {}));
                localStorage.setItem('role',  'voter');
                navigate('/portal');
            } else {
                setError('Invalid credentials. Please try again.');
            }
        } catch {
            setError('Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-screen">
            <div className="auth-card">
                {/* Head */}
                <div className="auth-card-head">
                    <div className="auth-emblem">
                        <Ico d={SHIELD} size={24} />
                    </div>
                    <div className="auth-flag-stripe" />
                    <h1 className="auth-title">Voter portal</h1>
                    <p className="auth-subtitle">IEBC Kenya · Kenya General Election</p>
                </div>

                {/* Body */}
                <div className="auth-card-body">
                    {error && (
                        <div className="auth-error-banner" role="alert">
                            <Ico d={ALERT} size={14} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="auth-field">
                            <label className="auth-label" htmlFor="vl-id">National ID number</label>
                            <input
                                id="vl-id"
                                className={`auth-input${error ? ' error-field' : ''}`}
                                type="text" inputMode="numeric"
                                placeholder="Enter your national ID"
                                value={form.nationalId}
                                onChange={set('nationalId')}
                                autoComplete="username"
                                autoFocus
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label className="auth-label" htmlFor="vl-pw">Password</label>
                            <div className="auth-input-wrap">
                                <input
                                    id="vl-pw"
                                    className={`auth-input has-toggle${error ? ' error-field' : ''}`}
                                    type={showPw ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={form.password}
                                    onChange={set('password')}
                                    autoComplete="current-password"
                                    required
                                />
                                <button type="button" className="auth-pw-toggle"
                                    onClick={() => setShowPw(s => !s)}
                                    aria-label={showPw ? 'Hide password' : 'Show password'}>
                                    <Ico d={showPw ? EYE_OFF : EYE} size={15} />
                                </button>
                            </div>
                        </div>

                        <button className="auth-btn" type="submit" disabled={loading}>
                            {loading
                                ? <><span className="auth-spinner" /> Signing in…</>
                                : <><Ico d={LOGIN} size={15} /> Access portal</>}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="auth-footer">
                    <span className="auth-footer-text">
                        <Ico d={LOCK} size={12} /> Don't have an account?
                    </span>
                    <button className="auth-link" onClick={() => navigate('/register')}>Register to vote</button>
                </div>
            </div>
        </div>
    );
};

export default VoterLogin;
