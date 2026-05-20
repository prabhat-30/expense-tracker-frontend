import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import API from "../api/api";
import { useAuth } from "../auth/AuthContext";
import "../CSS/auth.css";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    // Core Form States
    const [loginMethod, setLoginMethod] = useState("PASSWORD"); // PASSWORD or OTP
    const [identity, setIdentity] = useState(""); // Username/Email or Email/Phone
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");

    // 🌟 NEW: Password Visibility Toggle State
    const [showPassword, setShowPassword] = useState(false);

    // Forgot Password Modal States
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState("");
    const [modalSuccess, setModalSuccess] = useState("");

    // Feedback States
    const [cooldown, setCooldown] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = queryParams.get("token");
        const roleFromUrl = queryParams.get("role");

        if (tokenFromUrl) {
            localStorage.setItem("token", tokenFromUrl);
            localStorage.setItem("role", roleFromUrl || "USER");
            login({ token: tokenFromUrl, role: roleFromUrl || "USER" });
            window.history.replaceState({}, document.title, "/login");
            navigate("/user");
            return;
        }

        if (location.state?.verificationSuccess) {
            setMessage(location.state.verificationSuccess);
            window.history.replaceState({}, document.title);
        }
    }, [location, navigate, login]);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    // 🌟 NEW: Automatically forces password visibility back down to hidden after exactly 3000ms
    useEffect(() => {
        let passwordTimer;
        if (showPassword) {
            passwordTimer = setTimeout(() => {
                setShowPassword(false);
            }, 3000);
        }
        return () => clearTimeout(passwordTimer);
    }, [showPassword]);

    const handleRequestOtp = async () => {
        if (!identity) {
            setError("Please enter your Email ID or Phone Number first.");
            return;
        }
        try {
            setError("");
            setMessage("Sending verification code...");
            const res = await API.post("/auth/otp/request", { identity });
            setMessage(res.data.message || "OTP sent successfully.");
            setCooldown(60);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to dispatch OTP code.");
            setMessage("");
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const endpoint = loginMethod === "PASSWORD" ? "/auth/login" : "/auth/otp/verify";
            const payload = loginMethod === "PASSWORD" ? { identity, password } : { identity, otp };

            const response = await API.post(endpoint, payload);
            login(response.data);

            if (response.data.role === "ADMIN") {
                navigate("/admin");
            } else {
                navigate("/user");
            }
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || "Invalid credentials configuration provided.");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setModalError("");
        setModalSuccess("");

        try {
            const res = await API.post("/auth/forgot-password", { email: forgotEmail });
            setModalSuccess(res.data?.message || res.data || "✅ Reset link dispatched successfully to your email!");
            setForgotEmail("");
        } catch (err) {
            setModalError(err.response?.data?.message || err.response?.data || "Failed to dispatch reset token instructions.");
        } finally {
            setModalLoading(false);
        }
    };

    const handleSocialLogin = (provider) => {
        if (provider === "Apple") {
            alert("🍏 Sign in with Apple requires a premium Apple Developer Account. For testing this app, please use the live 'Google' login option right next to this button!");
            return;
        }
        window.location.href = `http://localhost:8080/oauth2/authorization/${provider.toLowerCase()}`;
    };

    return (
        <>
            <div className="login-page">
                <div className="login-container">
                    {/* LEFT SECTION */}
                    <div className="login-left">
                        <div>
                            <h1>Expense<span>Tracker</span></h1>
                            <p>Enterprise-grade expense management platform with analytics, JWT security and role-based dashboards.</p>
                        </div>
                        <div className="feature-list">
                            <div className="feature-card">
                                <h3>Analytics Dashboard</h3>
                                <p>Visualize expenses with modern charts and real-time insights.</p>
                            </div>
                            <div className="feature-card">
                                <h3>Secure Authentication</h3>
                                <p>JWT-based authentication with protected routes and role management.</p>
                            </div>
                            <div className="feature-card">
                                <h3>Production UI</h3>
                                <p>Responsive enterprise-level modern design.</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SECTION */}
                    <div className="login-right">
                        <form className="login-card" onSubmit={handleLogin}>
                            <div className="login-header">
                                <h2>Welcome Back</h2>
                                <p>Select login method</p>
                            </div>

                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', marginBottom: '20px' }}>
                                <button type="button" onClick={() => { setLoginMethod("PASSWORD"); setError(""); setMessage(""); }} style={{ flex: 1, padding: '10px', background: loginMethod === "PASSWORD" ? '#6366f1' : 'transparent', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }}>Password</button>
                                <button type="button" onClick={() => { setLoginMethod("OTP"); setError(""); setMessage(""); }} style={{ flex: 1, padding: '10px', background: loginMethod === "OTP" ? '#6366f1' : 'transparent', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }}>One-Time OTP</button>
                            </div>

                            {error && <div className="error-box">{error}</div>}
                            {message && <div className="success-box" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '15px' }}>{message}</div>}

                            <div className="input-group">
                                <label>{loginMethod === "PASSWORD" ? "Username or Email ID" : "Email ID or Phone Number"}</label>
                                <input type="text" placeholder={loginMethod === "PASSWORD" ? "Enter username or email" : "Enter email or phone no"} value={identity} onChange={(e) => setIdentity(e.target.value)} required />
                            </div>

                            {loginMethod === "PASSWORD" ? (
                                <div className="input-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        <label>Password</label>
                                        <button
                                            type="button"
                                            onClick={() => { setShowForgotModal(true); setModalError(""); setModalSuccess(""); }}
                                            style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>

                                    {/* 🌟 FIXED: WRAPPED PASSWORD FIELD AND INTEGRATED INLINE EYE TOGGLE BUTTON */}
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-eye"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex="-1"
                                        >
                                            {showPassword ? (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                    <line x1="1" y1="1" x2="23" y2="23" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="input-group">
                                    <label>Verification Code</label>
                                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                        <input type="text" maxLength="6" placeholder="6-Digit Code" value={otp} onChange={(e) => setOtp(e.target.value)} required style={{ flex: 1 }} />
                                        <button type="button" disabled={cooldown > 0} onClick={handleRequestOtp} style={{ padding: '0 15px', background: cooldown > 0 ? '#475569' : '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: cooldown > 0 ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.85rem', minWidth: '115px' }}>
                                            {cooldown > 0 ? `${cooldown}s` : "Get OTP"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="login-btn" disabled={loading}>
                                {loading ? "Verifying..." : "Login"}
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#64748b' }}>
                                <span style={{ flex: 1, borderBottom: '1px solid #334155' }}></span>
                                <span style={{ padding: '0 10px', fontSize: '0.75rem', fontWeight: '600' }}>OR CONNECT WITH</span>
                                <span style={{ flex: 1, borderBottom: '1px solid #334155' }}></span>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={() => handleSocialLogin("Google")} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '11px', background: '#fff', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                                    <svg style={{ width: '18px', height: '18px', display: 'block' }} viewBox="0 0 24 24">
                                        <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.253-3.133C18.42 2.11 15.6 1 12.24 1 6.033 1 1 5.925 1 12s5.033 11 11.24 11c6.478 0 10.793-4.415 10.793-10.704 0-.727-.08-1.274-.175-1.711H12.24z"/>
                                    </svg>
                                    Google
                                </button>
                                <button type="button" onClick={() => handleSocialLogin("Apple")} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '11px', background: '#000', color: '#fff', border: '1px solid #334155', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                                    <svg style={{ width: '16px', height: '16px', fill: '#fff', display: 'block' }} viewBox="0 0 24 24">
                                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.58 2.95-1.39z"/>
                                    </svg>
                                    Apple
                                </button>
                            </div>

                            <div className="register-link">
                                Don’t have an account? <Link to="/register">Register</Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* ================= PREMIUM MODERN OVERLAY MODAL FOR CREDENTIAL RECOVERY ================= */}
            {showForgotModal && (
                <div className="modal-backdrop">
                    <div className="modal-card premium-modal">
                        <button
                            type="button"
                            className="modal-close-x"
                            onClick={() => setShowForgotModal(false)}
                            aria-label="Close modal"
                        >
                            &times;
                        </button>

                        <div className="modal-header">
                            <div className="modal-icon-wrapper">
                                <svg viewBox="0 0 24 24" className="lock-icon">
                                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm3 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                                </svg>
                            </div>
                            <h2>Recover Credentials</h2>
                            <p>Enter your email below to receive a secure password verification link.</p>
                        </div>

                        <form onSubmit={handleForgotPasswordSubmit}>
                            {modalError && <div className="error-box premium-error">{modalError}</div>}
                            {modalSuccess && (
                                <div className="success-box premium-success">
                                    <span className="success-icon">✓</span>
                                    <div>{modalSuccess}</div>
                                </div>
                            )}

                            <div className="input-group premium-group">
                                <label>Gmail associated with the account!</label>
                                <div className="input-with-icon">
                                    <span className="field-icon">@</span>
                                    <input
                                        type="email"
                                        placeholder="name@example.com"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="modal-actions-grid">
                                <button type="submit" className="action-btn-primary" disabled={modalLoading}>
                                    {modalLoading ? (
                                        <span className="btn-spinner"></span>
                                    ) : (
                                        <>
                                            <span>Dispatch Reset Instructions</span>
                                            <span className="btn-arrow">→</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    className="action-btn-secondary"
                                    onClick={() => setShowForgotModal(false)}
                                >
                                    Cancel & Return
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* INTEGRATED MODERN LOOK STYLING RULES */}
            <style>{`
                /* Inline styling parameters for password element wrapping tracking */
                .password-input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    width: 100%;
                }
                .password-input-wrapper input {
                    width: 100%;
                    padding-right: 42px !important;
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

                /* Modal Specific Framework Rules */
                .modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(8, 13, 24, 0.85);
                    backdrop-filter: blur(8px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .premium-modal {
                    position: relative;
                    width: 440px;
                    padding: 40px;
                    background: linear-gradient(145deg, #1e293b, #0f172a);
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    border-radius: 16px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5),
                                0 0 30px 0 rgba(99, 102, 241, 0.05);
                    animation: scaleUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .modal-close-x {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: transparent;
                    border: none;
                    color: #64748b;
                    font-size: 1.5rem;
                    cursor: pointer;
                    transition: color 0.2s, transform 0.2s;
                    line-height: 1;
                }
                .modal-close-x:hover {
                    color: #f87171;
                    transform: scale(1.1);
                }
                .modal-icon-wrapper {
                    width: 60px;
                    height: 60px;
                    margin: 0 auto 20px auto;
                    background: rgba(99, 102, 241, 0.1);
                    border: 1px solid rgba(99, 102, 241, 0.25);
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    transition: transform 0.3s ease;
                }
                .premium-modal:hover .modal-icon-wrapper {
                    transform: translateY(-2px);
                    background: rgba(99, 102, 241, 0.15);
                    border-color: rgba(99, 102, 241, 0.4);
                }
                .lock-icon {
                    width: 26px;
                    height: 26px;
                    fill: #818cf8;
                }
                .premium-modal .modal-header {
                    text-align: center;
                    margin-bottom: 28px;
                }
                .premium-modal .modal-header h2 {
                    color: #ffffff;
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 0 0 8px 0;
                    letter-spacing: -0.025em;
                }
                .premium-modal .modal-header p {
                    color: #94a3b8;
                    font-size: 0.875rem;
                    line-height: 1.5;
                    margin: 0;
                    padding: 0 10px;
                }
                .premium-group label {
                    color: #cbd5e1;
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 8px;
                    display: block;
                }
                .input-with-icon {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .field-icon {
                    position: absolute;
                    left: 14px;
                    color: #475569;
                    font-weight: 600;
                    font-size: 0.95rem;
                    pointer-events: none;
                    transition: color 0.2s;
                }
                .premium-group input {
                    width: 100%;
                    padding: 12px 16px 12px 38px;
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 8px;
                    color: #f8fafc;
                    font-size: 0.925rem;
                    outline: none;
                    transition: all 0.25s ease;
                }
                .premium-group input:focus {
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
                    background: #0b0f19;
                }
                .premium-group input:focus + .field-icon {
                    color: #818cf8;
                }
                .premium-error {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.25);
                    color: #f87171;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    margin-bottom: 20px;
                }
                .premium-success {
                    display: flex;
                    gap: 10px;
                    align-items: flex-start;
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.25);
                    color: #34d399;
                    padding: 14px;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    margin-bottom: 20px;
                    text-align: left;
                }
                .success-icon {
                    background: #10b981;
                    color: #0f172a;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 0.75rem;
                    font-weight: bold;
                    flex-shrink: 0;
                    margin-top: 1px;
                }
                .modal-actions-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-top: 28px;
                }
                .action-btn-primary {
                    width: 100%;
                    padding: 13px;
                    background: #6366f1;
                    color: #ffffff;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
                }
                .action-btn-primary:hover:not(:disabled) {
                    background: #4f46e5;
                    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
                }
                .action-btn-primary:hover .btn-arrow {
                    transform: translateX(3px);
                }
                .btn-arrow {
                    transition: transform 0.2s;
                    font-weight: bold;
                }
                .action-btn-primary:disabled {
                    background: #334155;
                    color: #64748b;
                    cursor: not-allowed;
                    box-shadow: none;
                }
                .action-btn-secondary {
                    width: 100%;
                    padding: 12px;
                    background: transparent;
                    border: 1px solid #334155;
                    color: #94a3b8;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .action-btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.03);
                    border-color: #475569;
                    color: #f1f5f9;
                }
                .btn-spinner {
                    width: 18px;
                    height: 18px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: #ffffff;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleUp {
                    from { transform: scale(0.96); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
}