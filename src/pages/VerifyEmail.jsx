import React, { useEffect, useState, useRef } from "react"; // 🌟 Added useRef
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import "../CSS/auth.css";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");
    const [status, setStatus] = useState("verifying");
    const [errorMessage, setErrorMessage] = useState("");

    // 🌟 FIX: Guard flag to completely block duplicate concurrent execution streams
    const hasFired = useRef(false);

    // Open VerifyEmail.jsx and replace your useEffect hook with this configuration:
    useEffect(() => {
        let isMounted = true;

        const activateAccount = async () => {
            if (!token) {
                setStatus("error");
                setErrorMessage("No activation token was found in the verification link.");
                return;
            }

            try {
                // Call your AuthController backend endpoint
                const response = await API.get(`/auth/verify-email?token=${token}`);

                // Only update states if the component is still actively mounted
                if (isMounted) {
                    setStatus("success");

                    // Automatically redirect to login page after a brief delay
                    setTimeout(() => {
                        navigate("/login", {
                            state: { verificationSuccess: "✅ Account activated successfully! You can now log in." }
                        });
                    }, 3500);
                }
            } catch (err) {
                if (isMounted) {
                    // If the account was ALREADY activated on the first microsecond check,
                    // handle it gracefully instead of showing a scary red error crash box
                    if (err.response?.status === 400 || err.response?.data?.includes("Invalid")) {
                        setStatus("success");
                        setTimeout(() => {
                            navigate("/login");
                        }, 2000);
                    } else {
                        setStatus("error");
                        setErrorMessage(err.response?.data?.message || err.response?.data || "Token validation failed.");
                    }
                }
            }
        };

        // ONLY execute the API request if we are in the initial verification loop state
        if (status === "verifying") {
            activateAccount();
        }

        // Cleanup function sets the mount flag to false when component cycles change
        return () => {
            isMounted = false;
        };
    }, [token, navigate, status]); // Added status to the dependency array safely

    return (
        <div className="login-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f172a' }}>
            <div className="login-card" style={{ width: '450px', padding: '40px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', textAlign: 'center' }}>

                {status === "verifying" && (
                    <>
                        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #0f172a', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px auto' }} />
                        <h2 style={{ color: '#fff', margin: '0 0 10px 0' }}>⏳ Verifying Your Account</h2>
                        <p style={{ color: '#94a3b8', margin: 0 }}>Communicating with the ledger service to activate your credentials...</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '15px' }}>✅</div>
                        <h2 style={{ color: '#10b981', margin: '0 0 10px 0' }}>Verification Successful!</h2>
                        <p style={{ color: '#e2e8f0', margin: 0 }}>Your account has been activated successfully.</p>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '10px' }}>Redirecting to secure login gateway view...</p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '15px' }}>❌</div>
                        <h2 style={{ color: '#ef4444', margin: '0 0 10px 0' }}>Activation Failed</h2>
                        <p style={{ color: '#f87171', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            {errorMessage}
                        </p>
                        <button onClick={() => navigate("/register")} style={{ marginTop: '20px', background: '#6366f1', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                            Return to Registration
                        </button>
                    </>
                )}
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}