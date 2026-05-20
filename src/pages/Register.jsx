import { useState, useEffect } from "react"; // 🌟 FIXED: Added useEffect to the React import statement
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";
import "../CSS/auth.css";

export default function Register() {
    const navigate = useNavigate();

    // Complete Target Registration Form States
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNo, setPhoneNo] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Password Visibility Toggle States
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Automatically forces visibility back down to hidden after exactly 3000ms
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

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Validation Error: Passwords fields do not match.");
            setLoading(false);
            return;
        }

        try {
            const res = await API.post("/auth/register", {
                name,
                username,
                email,
                phoneNo,
                password,
                confirmPassword
            });

            setSuccess(res.data || "Registration Successful! Verification link sent.");

            // Clean inputs
            setName(""); setUsername(""); setEmail(""); setPhoneNo(""); setPassword(""); setConfirmPassword("");

            setTimeout(() => {
                navigate("/login");
            }, 4000);
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || error.response?.data || "Registration Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-overlay"></div>
            <div className="login-container" style={{ margin: '20px auto' }}>
                {/* LEFT SECTION (Preserved layout alignment framework structures) */}
                <div className="login-left">
                    <div>
                        <h1>Expense<span>Tracker</span></h1>
                        <p>Secure expense management platform with analytics, authentication and dashboards.</p>
                    </div>
                    <div className="feature-list">
                        <div className="feature-card">
                            <h3>Smart Reports</h3>
                            <p>Track all expenses with analytics.</p>
                        </div>
                        <div className="feature-card">
                            <h3>Secure System</h3>
                            <p>JWT authentication with role access.</p>
                        </div>
                        <div className="feature-card">
                            <h3>Modern Dashboard</h3>
                            <p>Enterprise-level UI experience.</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT SECTION */}
                <div className="login-right">
                    <form className="login-card" onSubmit={handleRegister} style={{ padding: '25px 30px' }}>
                        <div className="login-header" style={{ marginBottom: '15px' }}>
                            <h2>Create Account</h2>
                            <p>Register identity metrics parameter rows</p>
                        </div>

                        {error && <div className="error-box">{error}</div>}
                        {success && <div className="success-box">{success}</div>}

                        <div className="input-group" style={{ marginBottom: '12px' }}>
                            <label>Full Name</label>
                            <input type="text" placeholder="Enter full name" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>

                        <div className="input-group" style={{ marginBottom: '12px' }}>
                            <label>Username</label>
                            <input type="text" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </div>

                        <div className="input-group" style={{ marginBottom: '12px' }}>
                            <label>Email ID</label>
                            <input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>

                        <div className="input-group" style={{ marginBottom: '12px' }}>
                            <label>Phone Number</label>
                            <input type="tel" placeholder="Enter mobile contact number" value={phoneNo} onChange={(e) => setPhoneNo(e.target.value)} required />
                        </div>

                        {/* 🌟 FIXED: PASSWORD FIELD WITH INLINE EYE ICON TOGGLE */}
                        <div className="input-group" style={{ marginBottom: '12px' }}>
                            <label>Password</label>
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

                        {/* 🌟 FIXED: CONFIRM PASSWORD FIELD WITH INLINE EYE ICON TOGGLE */}
                        <div className="input-group" style={{ marginBottom: '18px' }}>
                            <label>Confirm Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Re-enter password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle-eye"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    tabIndex="-1"
                                >
                                    {showConfirmPassword ? (
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

                        <button type="submit" className="login-btn" disabled={loading} style={{ marginBottom: '15px' }}>
                            {loading ? "Creating Account..." : "Register"}
                        </button>

                        <div className="register-link">
                            Already have an account? <Link to="/login">Login</Link>
                        </div>
                    </form>
                </div>
            </div>

            {/* INLINE LAYOUT CSS RULES */}
            <style>{`
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
            `}</style>
        </div>
    );
}