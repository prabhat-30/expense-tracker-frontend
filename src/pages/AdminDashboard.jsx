import { useEffect, useState } from "react";
import API from "../api/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useSystemConfigs } from "../auth/useSystemConfigs";
import "../CSS/layout.css";
import "../CSS/dashboard.css";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
    LineChart,
    Line
} from "recharts";

export default function AdminDashboard() {
    const { currencySymbol } = useSystemConfigs();
    // ================= STATE =================
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // 🌟 NEW (Step 1.2): Timeframe Selection Constraints States
    const [selectedYear, setSelectedYear] = useState("ALL");
    const [selectedMonth, setSelectedMonth] = useState("ALL");

    const MONTHS = [
        { value: "1", label: "January" }, { value: "2", label: "February" },
        { value: "3", label: "March" }, { value: "4", label: "April" },
        { value: "5", label: "May" }, { value: "6", label: "June" },
        { value: "7", label: "July" }, { value: "8", label: "August" },
        { value: "9", label: "September" }, { value: "10", label: "October" },
        { value: "11", label: "November" }, { value: "12", label: "December" }
    ];

    const YEARS = ["2024", "2025", "2026"];

    // ================= FETCH ANALYTICS =================
    // 🌟 NEW (Step 1.2): Refactored hook dependency array to auto-fire queries on filter mutations
    useEffect(() => {
        fetchAnalytics();
    }, [selectedYear, selectedMonth]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            // 🌟 NEW (Step 1.2): Build dynamic URL string mapping parameters transparently
            let urlString = "/admin/analytics";
            const queries = [];
            if (selectedYear !== "ALL") queries.push(`year=${selectedYear}`);
            if (selectedMonth !== "ALL") queries.push(`month=${selectedMonth}`);
            if (queries.length > 0) urlString += `?${queries.join("&")}`;

            const response = await API.get(urlString);
            console.log(response.data);
            setData(response.data);
        } catch (error) {
            console.error("Failed to load platform-wide analytics matrices:", error);
        } finally {
            setLoading(false);
        }
    };

    // ================= LOADING =================
    if (loading) {
        return (
            <div className="loading-container">
                <h1 className="loading-text">Loading Analytics...</h1>
            </div>
        );
    }

    // ================= NO DATA =================
    if (!data) {
        return (
            <div className="loading-container">
                <h1 className="error-text">No Analytics Data Found</h1>
            </div>
        );
    }

    // ================= PIE CHART DATA =================
    const pieData = [
        { name: "Active Users", value: data.activeUsers },
        { name: "Blocked Users", value: data.blockedUsers }
    ];

    // ================= BAR CHART DATA =================
    const barData = [
        { name: "Current Year", amount: data.currentYearExpense },
        { name: "Previous Year", amount: data.previousYearExpense }
    ];

    // ================= LINE CHART DATA =================
    const growthData = [
        { name: "Growth", growth: data.expenseGrowth }
    ];

    // ================= COLORS =================
    const COLORS = ["#6366f1", "#ef4444"];

    // ================= PREMIUM GLOW & TRANSITION STYLES =================
    const chartGlowStyle = {
        background: '#1e293b',
        border: '1px solid rgba(168, 85, 247, 0.2)',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3), 0 0 15px rgba(168, 85, 247, 0.05)',
        transition: 'all 0.3s ease'
    };

    // Dynamic mouse interactions handlers
    const applyCardGlowHover = (e, activeColor) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 12px 24px rgba(0, 0, 0, 0.4), 0 0 20px ${activeColor}`;
    };

    const removeCardGlowHover = (e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
    };

    const applyChartGlowHover = (e, colorShadow) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 12px 24px rgba(0, 0, 0, 0.4), 0 0 20px ${colorShadow}`;
        e.currentTarget.style.borderColor = colorShadow;
    };

    const removeChartGlowHover = (e, defaultBorder, defaultShadow) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = defaultShadow;
        e.currentTarget.style.borderColor = defaultBorder;
    };

    return (
        <div className="app-layout dark-theme">
            {/* SIDEBAR */}
            <Sidebar />

            {/* MAIN CONTENT */}
            <div className="main-content">
                {/* TOPBAR */}
                <Navbar title="Admin Dashboard" />

                {/* =========================================================================
                    🌟 NEW (Step 1.2): TIME BOUND CONFIGURATION CONTROL CONSOLE STRIP
                    ========================================================================= */}
                <div style={{
                    display: 'flex',
                    gap: '15px',
                    alignItems: 'center',
                    background: '#1e293b',
                    padding: '15px 20px',
                    margin: '0 0 25px 0',
                    borderRadius: '10px',
                    border: '1px solid #334155',
                    flexWrap: 'wrap'
                }}>
                    {/* Fiscal Year Option Selector */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '180px' }}>
                        <label style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600' }}>Select Fiscal Year</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => {
                                setSelectedYear(e.target.value);
                                if (e.target.value === "ALL") setSelectedMonth("ALL"); // Reset calendar bounds logic sync safely
                            }}
                            style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '8px 12px', borderRadius: '6px', outline: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            <option value="ALL">All Years Combined 📊</option>
                            {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
                        </select>
                    </div>

                    {/* Operational Month Option Selector */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '180px' }}>
                        <label style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600' }}>Select Target Month</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            disabled={selectedYear === "ALL"} // Block sub-scopes unless a year foundation is defined
                            style={{
                                background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '8px 12px', borderRadius: '6px', outline: 'none',
                                cursor: selectedYear === "ALL" ? 'not-allowed' : 'pointer', fontSize: '0.9rem', opacity: selectedYear === "ALL" ? 0.5 : 1
                            }}
                        >
                            <option value="ALL">All Months Combined 🔄</option>
                            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>

                    {/* Meta Status Update Badge */}
                    <div style={{ marginLeft: 'auto', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '8px 14px', borderRadius: '6px', color: '#34d399', fontWeight: '700', fontSize: '0.82rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Scope: {selectedYear === "ALL" ? "Lifetime Metrics Summary" : `${MONTHS.find(m => m.value === selectedMonth)?.label || "Full Year"} ${selectedYear}`}
                    </div>
                </div>

                {/* STATS SECTION */}
                <div className="stats-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '20px',
                    marginBottom: '30px',
                    padding: '0 5px'
                }}>

                    {/* 1. Total Registered Users */}
                    <div
                        className="card"
                        style={{ background: '#1e293b', borderTop: '4px solid #6366f1', borderLeft: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s ease' }}
                        onMouseOver={(e) => applyCardGlowHover(e, 'rgba(99, 102, 241, 0.35)')}
                        onMouseOut={removeCardGlowHover}
                    >
                        <div>
                            <h3 style={{ color: '#6366f1', fontSize: '0.85rem', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Total Users</h3>
                            <p style={{ color: '#6366f1', fontSize: '1.8rem', fontWeight: '600', margin: 0 }}>{data.totalUsers}</p>
                        </div>
                        <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '12px', borderRadius: '10px', fontSize: '1.5rem' }}>👥</div>
                    </div>

                    {/* 2. Total Transactions */}
                    <div
                        className="card"
                        style={{ background: '#1e293b', borderTop: '4px solid #f59e0b', borderLeft: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s ease' }}
                        onMouseOver={(e) => applyCardGlowHover(e, 'rgba(245, 158, 11, 0.35)')}
                        onMouseOut={removeCardGlowHover}
                    >
                        <div>
                            <h3 style={{ color: '#f59e0b', fontSize: '0.85rem', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>TOTAL TRANSACTIONS</h3>
                            <p style={{ color: '#f59e0b', fontSize: '1.8rem', fontWeight: '600', margin: 0 }}>{data.totalTransactions}</p>
                        </div>
                        <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: '10px', fontSize: '1.5rem' }}>💸</div>
                    </div>

                    {/* 3. Global Net Balance KPI Card */}
                    <div
                        className="card"
                        style={{ background: '#1e293b', borderTop: `4px solid ${data.totalNetBalance >= 0 ? '#10b981' : '#ef4444'}`, borderLeft: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s ease' }}
                        onMouseOver={(e) => applyCardGlowHover(e, data.totalNetBalance >= 0 ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)')}
                        onMouseOut={removeCardGlowHover}
                    >
                        <div>
                            <h3 style={{ color: data.totalNetBalance >= 0 ? '#10b981' : '#ef4444', fontSize: '0.85rem', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Net Balance</h3>
                            <p style={{ color: data.totalNetBalance >= 0 ? '#10b981' : '#ef4444', fontSize: '1.8rem', fontWeight: '600', margin: 0 }}> {currencySymbol}{(data.totalNetBalance || 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div style={{ background: data.totalNetBalance >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: '10px', fontSize: '1.5rem' }}>⚖️</div>
                    </div>

                    {/* 4. Global Total Income KPI Card */}
                    <div
                        className="card"
                        style={{ background: '#1e293b', borderTop: '4px solid #22d3ee', borderLeft: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s ease' }}
                        onMouseOver={(e) => applyCardGlowHover(e, 'rgba(34, 211, 238, 0.35)')}
                        onMouseOut={removeCardGlowHover}
                    >
                        <div>
                            <h3 style={{ color: '#22d3ee', fontSize: '0.85rem', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Total Income</h3>
                            <p style={{ color: '#22d3ee', fontSize: '1.8rem', fontWeight: '600', margin: 0 }}> {currencySymbol} {(data.totalIncomeAmount || 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div style={{ background: 'rgba(34, 211, 238, 0.15)', padding: '12px', borderRadius: '10px', fontSize: '1.5rem' }}>🪙</div>
                    </div>

                    {/* 5. Global Total Spent KPI Card */}
                    <div
                        className="card"
                        style={{ background: '#1e293b', borderTop: '4px solid #fb7185', borderLeft: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s ease' }}
                        onMouseOver={(e) => applyCardGlowHover(e, 'rgba(251, 113, 133, 0.35)')}
                        onMouseOut={removeCardGlowHover}
                    >
                        <div>
                            <h3 style={{ color: '#fb7185', fontSize: '0.85rem', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Total Spent</h3>
                            <p style={{ color: '#ef4444', fontSize: '1.8rem', fontWeight: '600', margin: 0 }}> {currencySymbol} {(data.totalExpenseAmount || 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div style={{ background: 'rgba(251, 113, 133, 0.15)', padding: '12px', borderRadius: '10px', fontSize: '1.5rem' }}>💸</div>
                    </div>

                    {/* 6. Macro Growth Outlays */}
                    <div
                        className="card"
                        style={{
                            background: '#1e293b',
                            borderTop: `4px solid ${data.expenseGrowth >= 0 ? '#10b981' : '#ef4444'}`,
                            borderLeft: '1px solid #334155',
                            borderRight: '1px solid #334155',
                            borderBottom: '1px solid #334155',
                            borderRadius: '12px',
                            padding: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => applyCardGlowHover(e, data.expenseGrowth >= 0 ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)')}
                        onMouseOut={removeCardGlowHover}
                    >
                        <div>
                            <h3 style={{ color: data.expenseGrowth >= 0 ? '#10b981' : '#ef4444', fontSize: '0.85rem', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Growth Ratio</h3>
                            <p style={{
                                fontSize: '1.8rem',
                                fontWeight: '600',
                                margin: 0,
                                color: data.expenseGrowth >= 0 ? "#10b981" : "#ef4444"
                            }}>
                                {data.expenseGrowth >= 0 ? "+" : ""}{data.expenseGrowth.toFixed(2)}%
                            </p>
                        </div>
                        <div style={{ background: data.expenseGrowth >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: '10px', fontSize: '1.5rem' }}>
                            {data.expenseGrowth >= 0 ? "📈" : "📉"}
                        </div>
                    </div>

                    {/* 7. Most Used System Category */}
                    <div
                        className="card"
                        style={{ background: '#1e293b', borderTop: '4px solid #a855f7', borderLeft: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s ease' }}
                        onMouseOver={(e) => applyCardGlowHover(e, 'rgba(168, 85, 247, 0.35)')}
                        onMouseOut={removeCardGlowHover}
                    >
                        <div>
                            <h3 style={{ color: '#a855f7', fontSize: '0.85rem', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Top Category</h3>
                            <p style={{ color: '#a855f7', fontSize: '1.8rem', fontWeight: '600', margin: 0 }}>{data.mostUsedCategory}</p>
                        </div>
                        <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '12px', borderRadius: '10px', fontSize: '1.5rem' }}>🎯</div>
                    </div>

                    {/* 8. Active Platform Users */}
                    <div
                        className="card"
                        style={{ background: '#1e293b', borderTop: '4px solid #06b6d4', borderLeft: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s ease' }}
                        onMouseOver={(e) => applyCardGlowHover(e, 'rgba(6, 182, 212, 0.35)')}
                        onMouseOut={removeCardGlowHover}
                    >
                        <div>
                            <h3 style={{ color: '#06b6d4', fontSize: '0.85rem', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Active Users</h3>
                            <p style={{ color: '#06b6d4', fontSize: '1.8rem', fontWeight: '600', margin: 0 }}>{data.activeUsers}</p>
                        </div>
                        <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '12px', borderRadius: '10px', fontSize: '1.5rem' }}>⚡</div>
                    </div>

                </div>

                {/* CHARTS CONTAINER GRID */}
                <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', padding: '5px' }}>

                    {/* PIE CHART SECTION */}
                    <div
                        className="chart-card"
                        style={chartGlowStyle}
                        onMouseOver={(e) => applyChartGlowHover(e, 'rgba(168, 85, 247, 0.35)')}
                        onMouseOut={(e) => removeChartGlowHover(e, 'rgba(168, 85, 247, 0.2)', '0 8px 20px rgba(0, 0, 0, 0.3), 0 0 15px rgba(168, 85, 247, 0.05)')}
                    >
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '20px' }}>User Distribution</h2>
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={100}
                                    label
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell
                                            key={index}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* BAR CHART SECTION */}
                    <div
                        className="chart-card"
                        style={chartGlowStyle}
                        onMouseOver={(e) => applyChartGlowHover(e, 'rgba(99, 102, 241, 0.35)')}
                        onMouseOut={(e) => removeChartGlowHover(e, 'rgba(168, 85, 247, 0.2)', '0 8px 20px rgba(0, 0, 0, 0.3), 0 0 15px rgba(168, 85, 247, 0.05)')}
                    >
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '20px' }}>Yearly Expense Comparison</h2>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis
                                    width={75}
                                    stroke="#94a3b8"
                                    tickFormatter={(value) => {
                                        if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
                                        return `${(value / 100000).toFixed(1)}L`;
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                                    formatter={(value) => {
                                        if (value >= 10000000) return [`${(value / 10000000).toFixed(2)} Crores`];
                                        return [`${(value / 100000).toFixed(2)} Lakhs`];
                                    }}
                                />
                                <Legend />
                                <Bar
                                    dataKey="amount"
                                    fill="#6366f1"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* LINE CHART SECTION */}
                    <div
                        className="chart-card"
                        style={chartGlowStyle}
                        onMouseOver={(e) => applyChartGlowHover(e, 'rgba(34, 197, 94, 0.35)')}
                        onMouseOut={(e) => removeChartGlowHover(e, 'rgba(168, 85, 247, 0.2)', '0 8px 20px rgba(0, 0, 0, 0.3), 0 0 15px rgba(168, 85, 247, 0.05)')}
                    >
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '20px' }}>Expense Growth Trend</h2>
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={growthData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="growth"
                                    stroke="#22c55e"
                                    strokeWidth={4}
                                    dot={{ fill: '#22c55e', r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}