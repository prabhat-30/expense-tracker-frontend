import React, { useEffect, useState } from "react";
import API from "../api/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../CSS/layout.css";
import "../CSS/dashboard.css";

export default function CategoryManager() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // New category creation form states
    const [newName, setNewName] = useState("");
    const [newIcon, setNewIcon] = useState("🏷️");
    const [message, setMessage] = useState({ text: "", type: "" });

    const EMOJI_OPTIONS = ["🍔", "🚗", "🏠", "🔌", "🛒", "🏥", "💻", "🍿", "👔", "✈️", "🏋️", "📚", "🎁", "💵", "🎯"];

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await API.get("/api/categories/admin/all");
            setCategories(res.data || []);
        } catch (error) {
            console.error("Failed to read system tracking categories:", error);
            showNotification("Failed to fetch categories from the database.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const showNotification = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newName.trim()) {
            showNotification("Category name cannot be blank.", "error");
            return;
        }
        if (!newIcon.trim()) {
            showNotification("Please assign or type an icon symbol.", "error");
            return;
        }

        try {
            setSubmitting(true);
            const payload = { name: newName.trim(), icon: newIcon.trim(), active: true };
            await API.post("/api/categories/admin/create", payload);
            showNotification("✓ New expense category initialized successfully!", "success");
            setNewName("");
            setNewIcon("🏷️"); // Reset to default placeholder
            fetchCategories();
        } catch (error) {
            console.error("Failed to append custom category profile:", error);
            showNotification(error.response?.data?.message || "A category with this name already exists.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await API.put(`/api/categories/admin/toggle/${id}`);
            setCategories(prev => prev.map(cat =>
                cat.id === id ? { ...cat, active: !cat.active } : cat
            ));
        } catch (error) {
            console.error("Failed to mutate visibility state profile:", error);
            showNotification("Authorization exception: State update rejected.", "error");
        }
    };

    if (loading) return <div className="loading-container"><h2 className="loading-text">Loading Category Configurations...</h2></div>;

    return (
        <div className="app-layout dark-theme">
            <Sidebar />
            <div className="main-content">
                <Navbar title="Expense Category Manager" />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', padding: '5px', marginTop: '20px' }}>

                    {/* CONSOLE PANEL 1: CREATION FORM WITH CUSTOM ICON INJECTOR */}
                    <div className="table-container-focused" style={{ background: '#1e293b', border: '1px solid #334155', padding: '25px', borderRadius: '16px', height: 'fit-content' }}>
                        <h3 style={{ margin: '0 0 5px 0', color: '#f8fafc', fontSize: '1.25rem', fontWeight: '700' }}>Create Custom Tag</h3>
                        <p style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: '0.82rem' }}>Append dynamic transaction tracking categories platform-wide.</p>

                        {message.text && (
                            <div style={{
                                padding: '10px 14px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.82rem', fontWeight: '600',
                                background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                                color: message.type === 'success' ? '#34d399' : '#f87171'
                            }}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: '600' }}>Category Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Business Travel, Subscriptions..."
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '10px 14px', borderRadius: '8px', outline: 'none', fontSize: '0.9rem' }}
                                />
                            </div>

                            {/* 🌟 NEW: SELECTION GRID AND CUSTOM ICON EXTRACTION FIELD */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: '600' }}>Assign Icon Accent</label>
                                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Selected: <span style={{ background: '#0f172a', padding: '4px 8px', borderRadius: '4px', border: '1px solid #334155', marginLeft: '4px', fontSize: '1rem' }}>{newIcon}</span></span>
                                </div>

                                {/* Quick Presets Grid Selection Box */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                                    {EMOJI_OPTIONS.map(emoji => (
                                        <button
                                            type="button"
                                            key={emoji}
                                            onClick={() => setNewIcon(emoji)}
                                            style={{
                                                fontSize: '1.3rem', padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                                background: newIcon === emoji ? '#4f46e5' : 'transparent',
                                                boxShadow: newIcon === emoji ? '0 0 10px rgba(79, 70, 229, 0.5)' : 'none'
                                            }}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>

                                {/* 🌟 NEW CUSTOM ICON MANUAL ENTRY NODE */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '600' }}>Or Paste custom emoji below (Win + . / Cmd + Ctrl + Space)</span>
                                    <input
                                        type="text"
                                        maxLength="4"
                                        placeholder="Type or paste custom emoji icon symbol here..."
                                        value={newIcon}
                                        onChange={(e) => setNewIcon(e.target.value)}
                                        style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '8px 12px', borderRadius: '8px', outline: 'none', fontSize: '0.88rem', width: '100%', fontFamily: 'Segoe UI Emoji, Apple Color Emoji' }}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '11px', borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem', cursor: submitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s', marginTop: '5px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}
                            >
                                {submitting ? "Compiling Record..." : "Deploy Active Category"}
                            </button>
                        </form>
                    </div>

                    {/* CONSOLE PANEL 2: ACTIVE REGISTRY TRACKING GRID LAYER */}
                    <div className="table-container-focused" style={{ background: '#1e293b', border: '1px solid #334155', padding: '25px', borderRadius: '16px' }}>
                        <h3 style={{ margin: '0 0 5px 0', color: '#f8fafc', fontSize: '1.25rem', fontWeight: '700' }}>Active Registry Matrices</h3>
                        <p style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: '0.82rem' }}>Enable or pause structural dropdown selections live.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
                            {categories.map((cat) => (
                                <div
                                    key={cat.id}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between',
                                        background: '#0f172a', padding: '12px 16px', borderRadius: '10px', border: '1px solid #334155',
                                        opacity: cat.active ? 1 : 0.55, transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <span style={{ fontSize: '1.5rem', background: '#1e293b', padding: '6px 10px', borderRadius: '8px', border: '1px solid #334155', width: '45px', display: 'inline-block', textAlign: 'center' }}>{cat.icon}</span>
                                        <div>
                                            <h4 style={{ margin: 0, color: '#f1f5f9', fontSize: '0.92rem', fontWeight: '700' }}>{cat.name}</h4>
                                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: cat.active ? '#10b981' : '#ef4444' }}>
                                                {cat.active ? "● Visible to Users" : "○ Paused / Hidden"}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleToggleStatus(cat.id)}
                                        style={{
                                            border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s',
                                            background: cat.active ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                            color: cat.active ? '#f87171' : '#34d399',
                                            border: `1px solid ${cat.active ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`
                                        }}
                                    >
                                        {cat.active ? "Deactivate" : "Activate"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}