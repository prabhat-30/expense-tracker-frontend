import React, { useEffect, useState } from "react";
import API from "../api/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../CSS/layout.css";
import "../CSS/dashboard.css";

export default function SystemHealth() {
    const [health, setHealth] = useState(null);
    const [sysConfig, setSysConfig] = useState(null); // Added state for the custom SystemConfigController
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const fetchSystemHealthMetrics = async () => {
            try {
                setLoading(true);

                // Fetch BOTH the standard Actuator and our custom dynamic System config concurrently
                const [healthResponse, configResponse] = await Promise.all([
                    API.get("/actuator/health").catch(error => {
                        return error.response || { data: {} }; // Safe fallback for actuator
                    }),
                    API.get("/api/system/status").catch(() => {
                        return { data: null }; // Safe fallback if config controller is missing
                    })
                ]);

                setHealth(healthResponse.data.components || healthResponse.data);
                setSysConfig(configResponse.data);

            } catch (error) {
                console.error("Failed to read system status outlays:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSystemHealthMetrics();
    }, [refreshTrigger]);

    // Helper utilities to format byte counts into readable storage strings (GB/MB)
    const formatStorageSize = (bytes) => {
        if (!bytes) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const applyCardGlowHover = (e, activeColor) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 12px 24px rgba(0, 0, 0, 0.4), 0 0 20px ${activeColor}`;
    };

    const removeCardGlowHover = (e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
    };

    if (loading && !health) {
        return (
            <div className="app-layout dark-theme">
                <Sidebar />
                <div className="main-content">
                    <Navbar title="System Health & Infrastructure" />
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100vh - 120px)", color: "#94a3b8" }}>
                        <div style={{ width: "40px", height: "40px", border: "4px solid #1e293b", borderTop: "4px solid #a855f7", borderRadius: "50%", animation: "dashboardSpin 1s linear infinite", marginBottom: "15px" }} />
                        <p style={{ fontWeight: "500", fontSize: "0.95rem" }}>Querying platform infrastructure matrices...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Isolate component attributes natively with safe fallbacks
    const dbStatus = health?.db?.status || "UNKNOWN";
    const diskStatus = health?.diskSpace?.status || "UNKNOWN";
    const cronPingStatus = health?.ping?.status || "UNKNOWN";

    // Dynamic Status: If using HTTP Resend, force it to UP based on our config. Else fallback to standard SMTP actuator.
    const mailStatus = sysConfig?.emailBadge === "ONLINE" ? "UP" : (health?.mail?.status || "UNKNOWN");

    // Dynamic Database Display Labels
    const dbNameDisplay = sysConfig?.dbName || "MySQL Database";
    const dbQueryDisplay = sysConfig?.dbType === "POSTGRESQL" ? "SELECT 1" : (health?.db?.details?.validationQuery || "isValid()");

    // Dynamic Email Server Display Labels
    const mailChannelDisplay = sysConfig?.emailType === "HTTP" ? "Notification HTTP Channel" : "Notification SMTP Channel";
    const mailNameDisplay = sysConfig?.emailName || "Gmail SMTP Server";
    const mailPrefixDisplay = sysConfig?.emailType === "HTTP" ? "Target Node: " : "Target Relay Port Node: ";
    const mailTargetDisplay = sysConfig?.emailType === "HTTP" ? "api.resend.com:443" : (health?.mail?.details?.location || "smtp.gmail.com:587");

    return (
        <div className="app-layout dark-theme">
            <Sidebar />
            <div className="main-content">
                <Navbar title="System Health & Infrastructure" />

                <div className="bulk-container" style={{ padding: "5px 30px" }}>

                    {/* Header Controls Strip Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", background: "#1e293b", padding: "15px 20px", borderRadius: "12px", border: "1px solid #334155" }}>
                        <div>
                            <h2 style={{ fontSize: "1.25rem", color: "#fff", margin: "0 0 4px 0" }}>Core Infrastructure Monitor</h2>
                            <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: 0 }}>Real-time core dependency performance indicators tracking panel.</p>
                        </div>
                        <button
                            type="button"
                            className="view-all-link-btn"
                            disabled={loading} // 🌟 Prevent double-clicks while network requests fly
                            onClick={() => setRefreshTrigger(prev => prev + 1)}
                            style={{
                                background: loading ? "#334155" : "#4f46e5",
                                fontWeight: "600",
                                padding: "10px 20px",
                                cursor: loading ? "not-allowed" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                transition: "all 0.2s"
                            }}
                        >
                            {/* 🌟 DYNAMIC LOADING STATES GRAPHICS */}
                            {loading ? (
                                <>
                                    <div style={{
                                        width: "14px",
                                        height: "14px",
                                        border: "2px solid transparent",
                                        borderTop: "2px solid #fff",
                                        borderRadius: "50%",
                                        animation: "dashboardSpin 0.8s linear infinite"
                                    }} />
                                    <span>Pinging...</span>
                                </>
                            ) : (
                                <span>🔄 Ping Heartbeats Live</span>
                            )}
                        </button>
                    </div>

                    {/* INTERACTIVE COMPONENT GRID LAYERS */}
                    <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "25px", marginBottom: "35px" }}>

                        {/* 1. Dynamic Database Node Card */}
                        <div
                            className="card"
                            style={{ background: "#1e293b", borderTop: `4px solid ${dbStatus === "UP" ? "#10b981" : "#ef4444"}`, borderLeft: "1px solid #334155", borderRight: "1px solid #334155", borderBottom: "1px solid #334155", borderRadius: "12px", padding: "22px", display: "flex", flexDirection: "column", gap: "12px", transition: "all 0.3s ease" }}
                            onMouseOver={(e) => applyCardGlowHover(e, dbStatus === "UP" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)")}
                            onMouseOut={removeCardGlowHover}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h3 style={{ color: "#94a3b8", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700", margin: 0 }}>Relational Store Matrix</h3>
                                <span style={{ background: dbStatus === "UP" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)", padding: "4px 10px", borderRadius: "6px", color: dbStatus === "UP" ? "#10b981" : "#ef4444", fontSize: "0.78rem", fontWeight: "700" }}>{dbStatus === "UP" ? "ONLINE" : "OFFLINE"}</span>
                            </div>
                            <p style={{ color: "#fff", fontSize: "1.45rem", fontWeight: "600", margin: 0 }}>{dbNameDisplay}</p>
                            <div style={{ color: "#64748b", fontSize: "0.8rem", fontFamily: "monospace", marginTop: "5px" }}>
                                Connection verification query loop: <span style={{ color: "#38bdf8" }}>{dbQueryDisplay}</span>
                            </div>
                        </div>

                        {/* 2. Dynamic Mail Server Node Card */}
                        <div
                            className="card"
                            style={{ background: '#1e293b', borderTop: `4px solid ${mailStatus === "UP" ? "#06b6d4" : "#ef4444"}`, borderLeft: "1px solid #334155", borderRight: "1px solid #334155", borderBottom: "1px solid #334155", borderRadius: "12px", padding: "22px", display: "flex", flexDirection: "column", gap: "12px", transition: "all 0.3s ease" }}
                            onMouseOver={(e) => applyCardGlowHover(e, mailStatus === "UP" ? "rgba(6, 182, 212, 0.2)" : "rgba(239, 68, 68, 0.2)")}
                            onMouseOut={removeCardGlowHover}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h3 style={{ color: "#94a3b8", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700", margin: 0 }}>{mailChannelDisplay}</h3>
                                <span style={{ background: mailStatus === "UP" ? "rgba(6, 182, 212, 0.15)" : "rgba(239, 68, 68, 0.15)", padding: "4px 10px", borderRadius: "6px", color: mailStatus === "UP" ? "#06b6d4" : "#ef4444", fontSize: "0.78rem", fontWeight: "700" }}>{mailStatus === "UP" ? "CONNECTED" : "FAILED"}</span>
                            </div>
                            <p style={{ color: "#fff", fontSize: "1.45rem", fontWeight: "600", margin: 0 }}>{mailNameDisplay}</p>
                            <div style={{ color: "#64748b", fontSize: "0.8rem", fontFamily: "monospace", marginTop: "5px" }}>
                                {mailPrefixDisplay} <span style={{ color: "#38bdf8" }}>{mailTargetDisplay}</span>
                            </div>
                        </div>

                        {/* 3. Cron Engine Tracker Card */}
                        <div
                            className="card"
                            style={{ background: '#1e293b', borderTop: `4px solid ${cronPingStatus === "UP" ? "#a855f7" : "#ef4444"}`, borderLeft: "1px solid #334155", borderRight: "1px solid #334155", borderBottom: "1px solid #334155", borderRadius: "12px", padding: "22px", display: "flex", flexDirection: "column", gap: "12px", transition: "all 0.3s ease" }}
                            onMouseOver={(e) => applyCardGlowHover(e, cronPingStatus === "UP" ? "rgba(168, 85, 247, 0.2)" : "rgba(239, 68, 68, 0.2)")}
                            onMouseOut={removeCardGlowHover}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h3 style={{ color: "#94a3b8", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700", margin: 0 }}>Scheduled Job Scheduler</h3>
                                <span style={{ background: cronPingStatus === "UP" ? "rgba(168, 85, 247, 0.15)" : "rgba(239, 68, 68, 0.15)", padding: "4px 10px", borderRadius: "6px", color: cronPingStatus === "UP" ? "#a855f7" : "#ef4444", fontSize: "0.78rem", fontWeight: "700" }}>{cronPingStatus === "UP" ? "ACTIVE" : "IDLE"}</span>
                            </div>
                            <p style={{ color: "#fff", fontSize: "1.45rem", fontWeight: "600", margin: 0 }}>Automation Engine</p>
                            <div style={{ color: "#64748b", fontSize: "0.8rem", fontFamily: "monospace", marginTop: "5px" }}>
                                Background task threads: <span style={{ color: "#22c55e" }}>0 0 0 * * * (Midnight Cron Loop)</span>
                            </div>
                        </div>

                    </div>

                    {/* STORAGE MATRIX CARD SUBSECTION */}
                    <div className="card" style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "25px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div>
                                <h3 style={{ fontSize: "1.15rem", color: "#fff", margin: "0 0 4px 0" }}>Host Hardware Storage Footprint</h3>
                                <p style={{ color: "#94a3b8", fontSize: "0.8rem", margin: 0 }}>Evaluating drive array availability boundaries on the hosting filesystem partition.</p>
                            </div>
                            <span style={{ fontSize: "0.8rem", background: "rgba(245, 158, 11, 0.12)", color: "#fbbf24", padding: "4px 10px", borderRadius: "6px", fontWeight: "700" }}>
                                PATH: {health?.diskSpace?.details?.path || "D:\\"}
                            </span>
                        </div>

                        {health?.diskSpace?.details && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#e2e8f0" }}>
                                    <span>Allocated Available Free Space: <strong>{formatStorageSize(health.diskSpace.details.free)}</strong></span>
                                    <span style={{ color: "#64748b" }}>Total Block Space Size: {formatStorageSize(health.diskSpace.details.total)}</span>
                                </div>

                                {/* Dynamic Progress Tracking Bar */}
                                <div style={{ width: "100%", height: "10px", background: "#0f172a", borderRadius: "999px", overflow: "hidden" }}>
                                    <div style={{
                                        width: `${((health.diskSpace.details.total - health.diskSpace.details.free) / health.diskSpace.details.total) * 100}%`,
                                        height: "100%",
                                        background: "linear-gradient(90deg, #6366f1, #a855f7)",
                                        borderRadius: "999px"
                                    }}></div>
                                </div>
                                <span style={{ color: "#64748b", fontSize: "0.78rem" }}>Safety threshold boundary cut-off allocation requirement limit: {formatStorageSize(health.diskSpace.details.threshold)}</span>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}