import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const res = await API.post("/auth/forgot-password", { email });
            setMessage(res.data.message || "✅ Reset link dispatched successfully to your email!");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to trigger recovery link email pipeline.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <div className="login-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#0f172a', zIndex: 1 }}></div>

            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(8, 13, 24, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                <div className="modal-container premium-modal" style={{ position: 'relative', width: '440px', padding: '40px', background: 'linear-gradient(145deg, #1e293b, #0f172a)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px 0 rgba(99, 102, 241, 0.05)', color: '#fff' }}>

                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
                        title="Return to profile"
                    >
                        &times;
                    </button>

                    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                        <div style={{ width: '60px', height: '60px', margin: '0 auto 20px auto', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <svg viewBox="0 0 24 24" style={{ width: '26px', height: '26px', fill: '#818cf8' }}>
                                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm3 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                            </svg>
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', margin: '0 0 8px 0', letterSpacing: '-0.025em' }}>Recover Credentials</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: '1.5', margin: 0, padding: '0 10px' }}>Enter your registered email node below to safely broadcast verification tokens.</p>
                    </div>

                    {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>⚠️ {error}</div>}
                    {message && <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>✓ {message}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group" style={{ marginBottom: '24px' }}>
                            <label style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Account Gmail Node Registration</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <span style={{ position: 'absolute', left: '14px', color: '#475569', fontWeight: '600', fontSize: '0.95rem', pointerEvents: 'none' }}>@</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="name@example.com"
                                    className="premium-credential-field"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{ width: '100%', padding: '13px', background: '#6366f1', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)', transition: 'all 0.2s' }}
                            >
                                {loading ? (
                                    <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'modalSpin 0.8s linear infinite' }}></div>
                                ) : (
                                    <>
                                        <span>Dispatch Reset Instructions</span>
                                        <span style={{ transition: 'transform 0.2s', fontWeight: 'bold' }}>→</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid #334155', color: '#94a3b8', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                                Cancel & Return to Login
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                @keyframes modalSpin {
                    to { transform: rotate(360deg); }
                }
                .premium-modal button:hover span:last-child {
                    transform: translateX(3px);
                }
                .premium-credential-field {
                    width: 100%;
                    padding: 12px 16px 12px 38px !important;
                    background: #0f172a !important;
                    border: 1px solid #334155 !important;
                    border-radius: 8px !important;
                    color: #f8fafc !important;
                    font-size: 0.925rem !important;
                    outline: none !important;
                    transition: all 0.2s ease-in-out !important;
                }
                .premium-credential-field:focus,
                .premium-credential-field:active {
                    background: #0b0f19 !important;
                    border-color: #6366f1 !important;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15) !important;
                    color: #ffffff !important;
                }
                .premium-credential-field:-webkit-autofill,
                .premium-credential-field:-webkit-autofill:hover,
                .premium-credential-field:-webkit-autofill:focus {
                    -webkit-text-fill-color: #ffffff !important;
                    -webkit-box-shadow: 0 0 0px 1000px #0f172a inset !important;
                    transition: background-color 5000s ease-in-out 0s !important;
                }
            `}</style>
        </div>
    );
}