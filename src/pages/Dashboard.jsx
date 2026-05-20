import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import ExpenseTable from "../components/ExpenseTable";
import AddExpenseModal from "../components/AddExpenseModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import EditExpenseModal from "../components/EditExpenseModal";
import UpcomingBillingsPanel from '../components/UpcomingBillingsPanel';
import UndoToast from '../components/UndoToast';
import { useSystemConfigs } from "../auth/useSystemConfigs"; // 🌟 FIXED: Added missing import connection here!
import "../CSS/layout.css";
import "../CSS/dashboard.css";

export default function Dashboard() {
    const navigate = useNavigate();

    // 🌟 NEW: Pull configurations live from our master remote tracker
    const { configs, currencySymbol, loadingConfigs } = useSystemConfigs();

    const [stats, setStats] = useState({
        total: 0,
        count: 0,
        income: 0,
        balance: 0,
        highest: null,
        recent: [],
        budgets: {},
        categoryData: {}
    });

    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);

    const [undoData, setUndoData] = useState(null);
    const [showUndo, setShowUndo] = useState(false);
    const [undoMessage, setUndoMessage] = useState("");

    // 🌟 FIXED: Dynamically matches localization formatting rules
    const formatValueWithSetting = (amount) => {
        return `${currencySymbol}${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            const lifetimeRes = await API.get("/api/expenses/analytics/summary");
            const lifetimeData = lifetimeRes.data;

            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;
            const currentMonthRes = await API.get(`/api/expenses/analytics/summary?year=${currentYear}&month=${currentMonth}`);
            const currentMonthData = currentMonthRes.data;

            const rawList = lifetimeData.recentTransactions || [];
            const sorted = [...rawList].sort((a, b) => Number(b.id) - Number(a.id));
            const latest5 = sorted.slice(0, 5);

            setStats({
                total: lifetimeData.totalSpent || 0,
                income: lifetimeData.totalIncome || 0,
                balance: lifetimeData.totalBalance || 0,
                count: lifetimeData.transactionCount || 0,
                highest: lifetimeData.highestExpense,
                recent: latest5,
                budgets: currentMonthData.budgets || {},
                categoryData: currentMonthData.categoryData || {}
            });
        } catch (error) {
            console.error("Dashboard refresh error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleDelete = async () => {
        try {
            const expenseToDelete = stats.recent.find(e => e.id === deleteId);
            if (expenseToDelete) {
                setUndoData({ type: 'DELETE', data: expenseToDelete });
                setUndoMessage(`Deleted "${expenseToDelete.title}"`);
            }
            await API.delete(`/api/expenses/${deleteId}`);
            setDeleteId(null);
            setShowUndo(true);
            fetchDashboardData();
            setTimeout(() => setShowUndo(false), 5000);
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const handleStopRecurring = async (expenseId) => {
        try {
            const expenseToStop = stats.recent.find(e => e.id === expenseId);

            if(expenseToStop){
                setUndoData({ type: 'STOP', data: expenseToStop });
                setUndoMessage(`Stopped automation for "${expenseToStop.title}"`);
            }

            await API.put(`/api/expenses/${expenseId}/stop-recurring`);
            setShowUndo(true);

            setStats((prevStats) => ({
                ...prevStats,
                recent: prevStats.recent.map((exp) =>
                    exp.id === expenseId
                        ? { ...exp, recurring: false, isRecurring: false, frequency: null, nextDate: null, includeSat: false, includeSun: false }
                        : exp
                )
            }));
            fetchDashboardData();
            setTimeout(() => setShowUndo(false), 7000);
        } catch (error) {
            console.error("Failed to stop tracking:", error);
            alert("Something went wrong stopping the automation.");
        }
    };

    const triggerUndo = async () => {
        if (!undoData) return;

        try {
            if (undoData.type === 'STOP') {
                await API.put(`/api/expenses/${undoData.data.id}`, {
                    ...undoData.data,
                    recurring: true,
                    isRecurring: true,
                    isUndo: true,
                    frequency: undoData.data.frequency,
                    nextDate: undoData.data.nextDate,
                    includeSat: undoData.data.includeSat,
                    includeSun: undoData.data.includeSun
                });
            } else if (undoData.type === 'DELETE') {
                await API.post("/api/expenses", {
                    ...undoData.data,
                    isUndo: true
                });
            }

            setShowUndo(false);
            fetchDashboardData();
        } catch (error) {
            console.error("Undo failed:", error);
            alert("Could not restore status.");
        }
    };

    const applyGlowHover = (e, colorShadow) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 12px 24px rgba(0, 0, 0, 0.4), 0 0 20px ${colorShadow}`;
    };

    const removeGlowHover = (e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
    };

    if (loading || loadingConfigs) {
        return (
            <div className="app-layout dark-theme">
                <Sidebar />
                <div className="main-content">
                    <Navbar title="User Dashboard" />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 120px)', color: '#94a3b8' }}>
                        <div style={{ width: '40px', height: '40px', border: '4px solid #1e293b', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'dashboardSpin 1s linear infinite', marginBottom: '15px' }} />
                        <p style={{ fontWeight: '500', fontSize: '0.95rem', letterSpacing: '0.5px' }}>Syncing financial metrics baseline...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-layout dark-theme">
            <Sidebar />
            <div className="main-content">
                <Navbar title="User Dashboard" />

                <div className="dashboard-header">
                    <div className="dashboard-actions">
                        <div>
                            <h2 className="section-title">Expense Overview</h2>
                            <p className="section-subtitle">Real-time entry tracking </p>
                        </div>
                        <button className="add-expense-btn" onClick={() => setIsAddModalOpen(true)}>
                            + Add Single Expense
                        </button>
                    </div>
                </div>

                <UpcomingBillingsPanel refreshTrigger={stats} />

                {/* 🌟 FIXED: SYSTEM ALERTS DRIVEN LIVE BY ADMIN ALERT THRESHOLDS */}
                {stats.budgets && Object.keys(stats.budgets).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '20px 0 25px 0', width: '100%' }}>
                        {Object.entries(stats.budgets).map(([category, limit]) => {
                            const spent = stats.categoryData?.[category] || 0;
                            const limitAmount = parseFloat(limit);

                            if (limitAmount <= 0) return null;

                            const consumptionPercent = (spent / limitAmount) * 100;
                            const configuredWarningLimit = parseFloat(configs.budgetThreshold || "85");

                            // Dynamic trigger evaluate context
                            if (consumptionPercent >= configuredWarningLimit) {
                                const isOverBudget = spent > limitAmount;

                                return (
                                    <div
                                        key={category}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
                                            background: isOverBudget ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                            borderLeft: `5px solid ${isOverBudget ? '#ef4444' : '#f59e0b'}`,
                                            padding: '16px 22px', borderRadius: '8px', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <span style={{ fontSize: '1.4rem' }}>{isOverBudget ? "🚨" : "⚠️"}</span>
                                            <div>
                                                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '700', color: isOverBudget ? '#f87171' : '#fbbf24' }}>
                                                    {isOverBudget ? "Critical: Budget Exceeded" : "Warning: Approaching Monthly Budget Limit"}
                                                </h4>
                                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.4' }}>
                                                    Your monthly expenditure for <strong style={{ color: '#f8fafc' }}>{category}</strong> is at <strong style={{ color: isOverBudget ? '#f87171' : '#fbbf24' }}>{consumptionPercent.toFixed(1)}%</strong> of your target limit constraint rule.
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'right', fontSize: '0.95rem', fontWeight: '700', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 'auto'}}>
                                            <span style={{ color: '#e2e8f0' }}>{formatValueWithSetting(spent)}</span>
                                            <span style={{ color: '#64748b', margin: '0 6px', fontWeight: 'normal' }}>/</span>
                                            <span style={{ color: '#6366f1' }}>{formatValueWithSetting(limitAmount)}</span>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                )}

                <UndoToast visible={showUndo} message={undoMessage} onUndo={triggerUndo} />

                {/* FINANCIAL KPI WIDGETS PANEL: Displays Settings Symbols */}
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px', padding: '0 5px' }}>

                    {/* 1. Net Balance Card */}
                    <div
                        className="card"
                        style={{ background: '#1e293b', borderTop: `4px solid ${stats.balance >= 0 ? '#10b981' : '#ef4444'}`, borderLeft: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s ease' }}
                        onMouseOver={(e) => applyGlowHover(e, stats.balance >= 0 ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)')}
                        onMouseOut={removeGlowHover}
                    >
                        <div>
                            <h3 style={{ color: stats.balance >= 0 ? '#10b981' : '#ef4444', fontSize: '0.85rem', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Net Balance</h3>
                            <p className="stat-value" style={{ color: stats.balance >= 0 ? '#10b981' : '#ef4444', fontSize: '1.8rem', fontWeight: '600', margin: 0 }}>
                                {formatValueWithSetting(stats.balance)}
                            </p>
                        </div>
                        <div style={{ background: stats.balance >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: '10px', fontSize: '1.5rem' }}>⚖️</div>
                    </div>

                    {/* 2. Total Income Card */}
                    <div
                        className="card"
                        style={{ background: '#1e293b', borderTop: '4px solid #22d3ee', borderLeft: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s ease' }}
                        onMouseOver={(e) => applyGlowHover(e, 'rgba(34, 211, 238, 0.35)')}
                        onMouseOut={removeGlowHover}
                    >
                        <div>
                            <h3 style={{ color: '#22d3ee', fontSize: '0.85rem', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Total Income</h3>
                            <p className="stat-value" style={{ color: '#22d3ee', fontSize: '1.8rem', fontWeight: '600', margin: 0 }}>
                                {formatValueWithSetting(stats.income)}
                            </p>
                        </div>
                        <div style={{ background: 'rgba(34, 211, 238, 0.15)', padding: '12px', borderRadius: '10px', fontSize: '1.5rem' }}>🪙</div>
                    </div>

                    {/* 3. Total Spent Card */}
                    <div
                        className="card"
                        style={{ background: '#1e293b', borderTop: '4px solid #fb7185', borderLeft: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s ease' }}
                        onMouseOver={(e) => applyGlowHover(e, 'rgba(251, 113, 133, 0.35)')}
                        onMouseOut={removeGlowHover}
                    >
                        <div>
                            <h3 style={{ color: '#fb7185', fontSize: '0.85rem', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Total Spent</h3>
                            <p className="stat-value" style={{ color: '#ef4444', fontSize: '1.8rem', fontWeight: '600', margin: 0 }}>
                                {formatValueWithSetting(stats.total)}
                            </p>
                        </div>
                        <div style={{ background: 'rgba(251, 113, 133, 0.15)', padding: '12px', borderRadius: '10px', fontSize: '1.5rem' }}>💸</div>
                    </div>

                    {/* 4. Transaction Count Card */}
                    <div
                        className="card"
                        style={{ background: '#1e293b', borderTop: '4px solid #6366f1', borderLeft: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s ease' }}
                        onMouseOver={(e) => applyGlowHover(e, 'rgba(99, 102, 241, 0.35)')}
                        onMouseOut={removeGlowHover}
                    >
                        <div>
                            <h3 style={{ color: '#6366f1', fontSize: '0.85rem', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Transaction Count</h3>
                            <p className="stat-value" style={{ color: '#6366f1', fontSize: '1.8rem', fontWeight: '600', margin: 0 }}>
                                {stats.count}
                            </p>
                        </div>
                        <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '12px', borderRadius: '10px', fontSize: '1.5rem' }}>📊</div>
                    </div>

                    {/* 5. Highest Expense Card */}
                    <div
                        className="card"
                        style={{ background: '#1e293b', borderTop: '4px solid #f59e0b', borderLeft: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s ease' }}
                        onMouseOver={(e) => applyGlowHover(e, 'rgba(245, 158, 11, 0.35)')}
                        onMouseOut={removeGlowHover}
                    >
                        <div>
                            <h3 style={{ color: '#f59e0b', fontSize: '0.85rem', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Highest Expense</h3>
                            <p className="stat-value" style={{ color: '#f59e0b', fontSize: '1.8rem', fontWeight: '600', margin: 0 }}>
                                {stats.highest ? formatValueWithSetting(stats.highest.amount) : formatValueWithSetting(0)}
                            </p>
                        </div>
                        <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: '10px', fontSize: '1.5rem' }}>🎯</div>
                    </div>

                    {/* 6. Average Per Expense Card */}
                    <div
                        className="card"
                        style={{ background: '#1e293b', borderTop: '4px solid #a855f7', borderLeft: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s ease' }}
                        onMouseOver={(e) => applyGlowHover(e, 'rgba(168, 85, 247, 0.35)')}
                        onMouseOut={removeGlowHover}
                    >
                        <div>
                            <h3 style={{ color: '#a855f7', fontSize: '0.85rem', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Average/Exp</h3>
                            <p className="stat-value" style={{ color: '#a855f7', fontSize: '1.8rem', fontWeight: '600', margin: 0 }}>
                                {stats.count > 0 ? formatValueWithSetting(stats.total / stats.count) : formatValueWithSetting(0)}
                            </p>
                        </div>
                        <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '12px', borderRadius: '10px', fontSize: '1.5rem' }}>⚡</div>
                    </div>
                </div>

                <div className="expense-section">
                    <div className="expense-section-header">
                        <h2>Recent Transactions (Latest 5 Entries)</h2>
                        <button className="view-all-link-btn" onClick={() => navigate("/expenses")}>
                            View All History →
                        </button>
                    </div>

                    <ExpenseTable
                        expenses={stats.recent}
                        onEdit={(e) => { setSelectedExpense(e); setIsEditOpen(true); }}
                        onDelete={setDeleteId}
                        onStopRecurring={handleStopRecurring}
                    />
                </div>
            </div>

            <AddExpenseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onExpenseAdded={fetchDashboardData} />
            <ConfirmDeleteModal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={handleDelete} />

            <EditExpenseModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                expense={selectedExpense}
                onSave={async (data) => {
                    const synchronizedData = {
                        ...data,
                        recurring: data.recurring,
                        isRecurring: data.recurring
                    };
                    await API.put(`/api/expenses/${selectedExpense.id}`, synchronizedData);
                    setIsEditOpen(false);
                    fetchDashboardData();
                }}
            />
        </div>
    );
}