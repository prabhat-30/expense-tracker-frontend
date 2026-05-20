import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/api";

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        let passwordTimer;
        if (showPassword) {
            passwordTimer = setTimeout(() => {
                setShowPassword(false);
            }, 3000);
        }
        return () => clearTimeout(passwordTimer);
    }, [showPassword]);

    useEffect(() => {
        let confirmPasswordTimer;
        if (showConfirmPassword) {
            confirmPasswordTimer = setTimeout(() => {
                setShowConfirmPassword(false);
            }, 3000);
        }
        return () => clearTimeout(confirmPasswordTimer);
    }, [showConfirmPassword]);

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("❌ Operational mismatch: Passwords fields must align.");
            return;
        }

        try {
            await API.post("/auth/reset-password/save", { token, newPassword, confirmPassword });
            setSuccess(true);
            setTimeout(() => navigate("/login"), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Link evaluation validation constraints failed.");
        }
    };

    if (success) {
        return (
            <div className="login-page" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                <div className="login-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#0f172a', zIndex: 1 }}></div>
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(8, 13, 24, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '40px', borderRadius: '16px', textAlign: 'center', color: '#fff', width: '440px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <div style={{ width: '60px', height: '60px', margin: '0 auto 20px auto', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <span style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold' }}>✓</span>
                        </div>
                        <h2 style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: '700', margin: '0 0 10px 0' }}>Credentials Updated!</h2>
                        <p style={{ marginTop: '10px', color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>Session configuration updated successfully. Routing back to access framework panel...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <div className="login-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#0f172a', zIndex: 1 }}></div>

            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(8, 13, 24, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                <div className="modal-container premium-modal" style={{ position: 'relative', width: '440px', padding: '40px', background: 'linear-gradient(145deg, #1e293b, #0f172a)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px 0 rgba(99, 102, 241, 0.05)', color: '#fff' }}>

                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
                    >
                        &times;
                    </button>

                    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                        <div style={{ width: '60px', height: '60px', margin: '0 auto 20px auto', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <svg viewBox="0 0 24 24" style={{ width: '26px', height: '26px', fill: '#818cf8' }}>
                                <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6-5c1.66 0 3 1.34 3 3v2H9V6c0-1.66 1.34-3 3-3z"/>
                            </svg>
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', margin: '0 0 8px 0', letterSpacing: '-0.025em' }}>Configure Credentials</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>Please update your security authentication metrics parameters below.</p>
                    </div>

                    {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>⚠️ {error}</div>}

                    <form onSubmit={handleResetSubmit}>

                        <div className="input-group" style={{ marginBottom: '20px' }}>
                            <label style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>New Secure Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="premium-credential-field"
                                />
                                <button
                                    type="button"
                                    className="password-toggle-eye"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex="-1"
                                >
                                    {showPassword ? (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="input-group" style={{ marginBottom: '28px' }}>
                            <label style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Confirm New Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="premium-credential-field"
                                />
                                <button
                                    type="button"
                                    className="password-toggle-eye"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    tabIndex="-1"
                                >
                                    {showConfirmPassword ? (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button type="submit" style={{ width: '100%', padding: '13px', background: '#6366f1', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)', transition: 'all 0.2s' }}>
                            Update Authentication Keys →
                        </button>
                    </form>
                </div>
            </div>

            {/* 🌟 FIXED INJECTIONS: Force background to remain dark on focus/active/autofill */}
            <style>{`
                .password-input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    width: 100%;
                }
                .premium-credential-field {
                    width: 100%;
                    padding: 12px 42px 12px 14px !important;
                    background: #0f172a !important;
                    border: 1px solid #334155 !important;
                    border-radius: 8px !important;
                    color: #f8fafc !important;
                    font-size: 0.925rem !important;
                    outline: none !important;
                    transition: all 0.2s ease-in-out !important;
                }
                /* Prevents white background pop-out when typing in input area */
                .premium-credential-field:focus,
                .premium-credential-field:active {
                    background: #0b0f19 !important;
                    border-color: #6366f1 !important;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15) !important;
                    color: #ffffff !important;
                }
                /* Forces system autofills to maintain your dark layout constraints */
                .premium-credential-field:-webkit-autofill,
                .premium-credential-field:-webkit-autofill:hover,
                .premium-credential-field:-webkit-autofill:focus {
                    -webkit-text-fill-color: #ffffff !important;
                    -webkit-box-shadow: 0 0 0px 1000px #0f172a inset !important;
                    transition: background-color 5000s ease-in-out 0s !important;
                }
                .password-toggle-eye {
                    position: absolute;
                    right: 12px;
                    background: transparent;
                    border: none;
                    padding: 0;
                    margin: 0;
                    width: 18px;
                    height: 18px;
                    color: #64748b;
                    cursor: pointer;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    transition: color 0.2s, transform 0.1s;
                }
                .password-toggle-eye:hover {
                    color: #818cf8;
                }
                .password-toggle-eye:active {
                    transform: scale(0.9);
                }
                .password-toggle-eye svg {
                    width: 100%;
                    height: 100%;
                }
            `}</style>
        </div>
    );
}