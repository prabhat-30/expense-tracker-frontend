import React, { useState, useEffect } from "react";
import API from "../api/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useSystemConfigs } from "../auth/useSystemConfigs"; // 🌟 NEW Context Integration

export default function BudgetsDashboard() {
    // 🌟 NEW: Track active currency symbols and warnings thresholds from the master transmitter
    const { configs, activeCategories, currencySymbol, loadingConfigs } = useSystemConfigs();

    const [budgetData, setBudgetData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());

    const [isSetBudgetOpen, setIsSetBudgetOpen] = useState(false);
    const [targetCategory, setTargetCategory] = useState("");
    const [limitAmount, setLimitAmount] = useState("");



    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchBudgetProgressMetrics = async () => {
        try {
            setLoading(true);
            const res = await API.get(`/api/expenses/analytics/summary?year=${selectedYear}&month=${selectedMonth}`);
            setBudgetData(res.data);
        } catch (err) {
            console.error("Failed to load budget progress tracking vectors:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!loadingConfigs) {
            fetchBudgetProgressMetrics();
        }
    }, [selectedYear, selectedMonth, loadingConfigs]);

    useEffect(() => {
        if (activeCategories && activeCategories.length > 0 && !targetCategory) {
            setTargetCategory(activeCategories[0].name); // Automatically seeds to "Food & Dining"
        }
    }, [activeCategories, targetCategory]);

    const handleSaveBudgetRule = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        setError("");
        setSuccess("");

        const cleanInputString = String(limitAmount).trim();
        const parsedLimit = parseFloat(cleanInputString);

        if (!cleanInputString || isNaN(parsedLimit) || parsedLimit <= 0) {
            setError(`The monthly cap limit must be a positive number greater than ${currencySymbol}0.00.`);
            return;
        }

        try {
            await API.post("/api/budgets", { category: targetCategory, limitAmount: parsedLimit });
            setSuccess("🎯 Budget limitation rule applied successfully!");
            setLimitAmount("");

            setTimeout(() => {
                setIsSetBudgetOpen(false);
                setSuccess("");
                fetchBudgetProgressMetrics();
            }, 1500);
        } catch (err) {
            console.error("Budget allocation error details:", err);
            setError(err.response?.data?.message || "Could not update budget configuration safely.");
        }
    };

    if (loading || loadingConfigs) return <div className="loading">Evaluating financial progress bars...</div>;

    return (
        <div className="app-layout dark-theme">
            <Sidebar />
            <div className="main-content">
                <Navbar title="Budget Target Planning" />
                <div className="profile-container" style={{ padding: '30px' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', background: '#1e293b', padding: '15px 20px', borderRadius: '12px', border: '1px solid #334155', flexWrap: 'wrap', gap: '15px' }}>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '8px 12px', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}>
                                {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                            </select>
                            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '8px 12px', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}>
                                {["2024", "2025", "2026"].map(yr => <option key={yr} value={yr}>{yr}</option>)}
                            </select>
                        </div>

                        <button type="button" onClick={() => { setError(""); setSuccess(""); setIsSetBudgetOpen(true); }} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            🎯 Configure Budget Cap
                        </button>
                    </div>

                    <div className="card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '25px' }}>
                        <h2 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '5px' }}>Active Allocations Cap Progress</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '25px' }}>Comparing active ledger outflows against assigned structural limitations thresholds.</p>

                        {!budgetData?.budgets || Object.keys(budgetData.budgets).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No budget limits declared for this specific monthly timeline block.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {Object.entries(budgetData.budgets).map(([category, limit]) => {
                                    const spent = budgetData.categoryData?.[category] || 0;
                                    const limitAmount = parseFloat(limit);

                                    const rawPercentage = limitAmount > 0 ? (spent / limitAmount) * 100 : 0;
                                    const barWidthPercentage = Math.min(rawPercentage, 100);
                                    const isOverBudget = spent > limitAmount;

                                    // 🌟 FIXED: Reading the exact threshold trigger set from your live global configuration dashboard!
                                    const warningThreshold = parseFloat(configs.budgetThreshold || "85");

                                    let progressBarColor = "linear-gradient(90deg, #6366f1, #10b981)";
                                    if (rawPercentage >= 100) {
                                        progressBarColor = "#ef4444"; // 🔴 Red for over limit
                                    } else if (rawPercentage >= warningThreshold) {
                                        progressBarColor = "#f59e0b"; // 🟡 Yellow for crossing warning trigger threshold limits
                                    }

                                    return (
                                        <div key={category} style={{ background: '#0f172a', padding: '15px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                                <span style={{ color: '#f8fafc', fontWeight: '600', fontSize: '0.95rem' }}>{category}</span>
                                                <span style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                                    {currencySymbol}{spent.toFixed(2)} / <span style={{ color: isOverBudget ? '#ef4444' : rawPercentage >= warningThreshold ? '#f59e0b' : '#818cf8' }}>{currencySymbol}{limitAmount.toFixed(2)}</span>
                                                </span>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '999px', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${barWidthPercentage}%`,
                                                    height: '100%',
                                                    background: progressBarColor,
                                                    borderRadius: '999px',
                                                    transition: 'width 0.4s ease, background-color 0.4s ease'
                                                }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isSetBudgetOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(15,23,42,0.8)', backdropFilter:'blur(4px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000 }}>
                    <div className="modal-container" style={{ width: '400px', background: '#1e293b', border: '1px solid #334155', padding: '30px', borderRadius: '12px', color: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, fontWeight: '700' }}>Configure Budget Rule</h3>
                            <button type="button" onClick={() => setIsSetBudgetOpen(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>

                        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '15px' }}>⚠️ {error}</div>}
                        {success && <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '15px' }}>{success}</div>}

                        <form onSubmit={handleSaveBudgetRule} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px', fontWeight: '600' }}>Target Expense Category</label>
                                <select value={targetCategory} onChange={(e) => setTargetCategory(e.target.value)} style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #475569', borderRadius: '6px', color: '#fff', outline: 'none', cursor: 'pointer' }}>
                                    {/* 🌟 FIXED DYNAMIC MAP: Pull options live from our database table records context hook */}
                                    {activeCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px', fontWeight: '600' }}>Max Monthly Cap Allocation Amount ({currencySymbol})</label>
                                <input type="number" required placeholder="e.g. 15000" min="1" step="any" value={limitAmount} onChange={(e) => setLimitAmount(e.target.value)} style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #475569', borderRadius: '6px', color: '#fff', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                <button type="button" style={{ background: '#334155', color: '#fff', margin: 0, padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }} onClick={() => setIsSetBudgetOpen(false)}>Cancel</button>
                                <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Apply Limit Rule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}