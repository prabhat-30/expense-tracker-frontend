import React, { useEffect, useState } from "react";
import API from "../api/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../CSS/layout.css";
import "../CSS/dashboard.css";

export default function SystemSettings() {
    // 🌟 REFACTORED: Track configuration text inputs in a dictionary map to isolate keypress renders
    const [settingsMap, setSettingsMap] = useState({});
    const [metaData, setMetaData] = useState([]); // Keeps original description metadata layout shapes intact

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    // Fetch active system parameters initialization values
    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await API.get("/admin/settings");
            const rawSettings = res.data || [];

            // Build key-value mapping dictionary rules safely
            const dictionary = {};
            rawSettings.forEach(item => {
                dictionary[item.key] = item.value;
            });

            setSettingsMap(dictionary);
            setMetaData(rawSettings);
        } catch (error) {
            console.error("Failed to load global platform configuration maps:", error);
            showNotification("Failed to communicate with database configuration registry.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const showNotification = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    };

    // Safely update specific value offsets inside dictionary map structure
    const handleValueChange = (key, newValue) => {
        setSettingsMap(prev => ({
            ...prev,
            [key]: newValue
        }));
    };

    // Dispatch synchronized configuration matrix blocks back to Spring Boot
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            setUpdating(true);

            // Recompile look-up state changes cleanly back into original backend database array schema contracts
            const synchronizedPayload = metaData.map(item => ({
                ...item,
                value: settingsMap[item.key]
            }));

            await API.put("/admin/settings/update", synchronizedPayload);
            showNotification("✓ Global platform configurations synchronized successfully!", "success");
            fetchSettings();
        } catch (error) {
            console.error("Configuration payload mutation aborted:", error);
            showNotification("⚠️ Unauthorized or invalid data format boundary constraints.", "error");
        } finally {
            setUpdating(false);
        }
    };

    // Premium glowing hover utility parameters matching your dashboard theme
    const applyInputFocusGlow = (e, colorShadow) => {
        e.target.style.borderColor = colorShadow;
        e.target.style.boxShadow = `0 0 10px ${colorShadow}`;
    };

    const removeInputFocusGlow = (e) => {
        e.target.style.borderColor = '#475569';
        e.target.style.boxShadow = 'none';
    };

    if (loading) return <div className="loading-container"><h2 className="loading-text">Loading Configuration Profiles...</h2></div>;

    return (
        <div className="app-layout dark-theme">
            {/* SIDEBAR NAVIGATION LINK ARCHITECTURE */}
            <Sidebar />

            {/* MAIN LAYER PLATFORM BOX */}
            <div className="main-content">
                <Navbar title="Global System Configurations" />

                <div className="table-container-focused" style={{ background: '#1e293b', border: '1px solid #334155', padding: '30px', borderRadius: '16px', maxWidth: '800px', margin: '30px auto' }}>
                    <h2 style={{ margin: '0 0 8px 0', color: '#f8fafc', fontSize: '1.6rem', fontWeight: '800' }}>Infrastructure Controls</h2>
                    <p style={{ margin: '0 0 25px 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                        Modify core production environment metrics globally. Updates alter application runtime triggers instantly.
                    </p>

                    {/* Status Alert Notification Drawer banner */}
                    {message.text && (
                        <div style={{
                            padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.88rem', fontWeight: '600',
                            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            color: message.type === 'success' ? '#34d399' : '#f87171'
                        }}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        {metaData.map((setting) => {
                            return (
                                <div key={setting.id || setting.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '20px', borderBottom: '1px dashed #334155' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                        <label style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: '700', letterSpacing: '0.02em' }}>
                                            {setting.key.replace(/_/g, ' ')}
                                        </label>
                                        <span style={{ color: '#64748b', fontSize: '0.75rem', fontFamily: 'monospace' }}>KEY: {setting.key}</span>
                                    </div>
                                    <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 4px 0', lineHeight: '1.4' }}>{setting.description}</p>

                                    {/* Adaptive Selector UI fields depending on target key properties */}
                                    {setting.key === "DEFAULT_CURRENCY" ? (
                                        <select
                                            value={settingsMap[setting.key] || ""}
                                            onChange={(e) => handleValueChange(setting.key, e.target.value)}
                                            style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '10px 14px', borderRadius: '8px', outline: 'none', cursor: 'pointer', fontSize: '0.9rem', width: '100%', transition: 'all 0.2s' }}
                                        >
                                            <option value="INR">INR (₹) - Indian Rupee localization standard</option>
                                            <option value="USD">USD ($) - United States Dollar accounting standard</option>
                                            <option value="EUR">EUR (€) - Eurozone monetary localization</option>
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={settingsMap[setting.key] || ""}
                                            onChange={(e) => handleValueChange(setting.key, e.target.value)}
                                            onFocus={(e) => applyInputFocusGlow(e, setting.key.includes('ALERT') ? '#f59e0b' : '#6366f1')}
                                            onBlur={removeInputFocusGlow}
                                            style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '10px 14px', borderRadius: '8px', outline: 'none', fontSize: '0.9rem', width: '100%', transition: 'all 0.2s', fontFamily: 'monospace' }}
                                        />
                                    )}
                                </div>
                            );
                        })}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button
                                type="submit"
                                disabled={updating || metaData.length === 0}
                                style={{
                                    background: '#4f46e5', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px',
                                    fontWeight: '700', fontSize: '0.95rem', cursor: updating ? 'not-allowed' : 'pointer', opacity: updating ? 0.6 : 1,
                                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)', transition: 'all 0.2s'
                                }}
                            >
                                {updating ? "Synchronizing Matrix..." : "Save System Configurations"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}