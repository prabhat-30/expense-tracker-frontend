import React, { useEffect, useState } from "react";
import API from "../api/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title
} from 'chart.js';
import "../CSS/analytics.css";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title);

const MONTH_NAMES = {
    1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
    7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
};

const FULL_MONTH_NAMES = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" }
];

export default function Analytics() {
    const currentMonthNum = new Date().getMonth() + 1;

    const [activeTab, setActiveTab] = useState("overview");
    const [summaryData, setSummaryData] = useState({
        totalSpent: 0,
        totalIncome: 0,
        categoryData: {}
    });

    const [monthlyTrends, setMonthlyTrends] = useState([]);
    const [yearlyTrends, setYearlyTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false); // 🌟 TRACKS EXPORT LOADER TIMELINES
    const [selectedAnalyticsYear, setSelectedAnalyticsYear] = useState("ALL");
    const [selectedAnalyticsMonth, setSelectedAnalyticsMonth] = useState(currentMonthNum);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            let queryParams = `?year=${selectedAnalyticsYear}`;
            if (selectedAnalyticsYear !== "ALL") {
                queryParams += `&month=${selectedAnalyticsMonth}`;
            }

            const summaryRes = await API.get(`/api/expenses/analytics/summary${queryParams}`);
            setSummaryData(summaryRes.data);

            const monthlyRes = await API.get(`/api/expenses/analytics/monthly${queryParams}`);
            setMonthlyTrends(monthlyRes.data || []);

            const yearlyRes = await API.get("/api/expenses/analytics/yearly");
            setYearlyTrends(yearlyRes.data || []);

        } catch (error) {
            console.error("Error loading complete analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalyticsData();
    }, [selectedAnalyticsYear, selectedAnalyticsMonth]);

    // 🌟 UPGRADED: MASTER MULTI-PAGE EXPORT ENGINE ROUTINE
    const handleExportPDF = async () => {
        try {
            setIsExporting(true);

            // Allow React exactly 300ms to paint our hidden data block cleanly into background container layers
            await new Promise((resolve) => setTimeout(resolve, 300));

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Target references array to capture sequential snapshots loop elements
            const targets = [
                { id: "#print-page-1", title: "Overview Analysis" },
                { id: "#print-page-2", title: "Monthly History Outflows" },
                { id: "#print-page-3", title: "Year-Over-Year Capital footprint" }
            ];

            for (let i = 0; i < targets.length; i++) {
                const element = document.querySelector(targets[i].id);
                if (element) {
                    const canvas = await html2canvas(element, {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: "#0f172a",
                        logging: false
                    });

                    const imgData = canvas.toDataURL('image/png');
                    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

                    // If we are past page 1, create a clean page split break natively
                    if (i > 0) {
                        pdf.addPage();
                    }

                    // Align component canvas snapshot perfectly onto the current page container matrix bounds
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(imgHeight, pageHeight));
                }
            }

            const monthLabel = selectedAnalyticsYear === "ALL" ? "All" : MONTH_NAMES[selectedAnalyticsMonth];
            pdf.save(`Comprehensive_Financial_Report_${selectedAnalyticsYear}_${monthLabel}.pdf`);
        } catch (error) {
            console.error("Multi-Page PDF compile layout assignment failure:", error);
            alert("Could not pull down comprehensive data arrays sheet layout.");
        } finally {
            setIsExporting(false);
        }
    };

    const chartOptions = {
        maintainAspectRatio: false,
        layout: { padding: { top: 10, right: 10, left: 10, bottom: 10 } },
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                maxWidth: 240,
                labels: {
                    color: '#e2e8f0',
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 15,
                    boxWidth: 6,
                    font: { size: 11, weight: '600' }
                }
            },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#f8fafc',
                bodyColor: '#e2e8f0',
                padding: 12,
                borderColor: '#334155',
                borderWidth: 1,
                callbacks: {
                    label: (context) => {
                        let label = context.dataset.label ? context.dataset.label + ': ' : '';
                        const value = context.parsed.y || context.parsed;
                        return `${label}${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                ticks: {
                    color: '#94a3b8',
                    callback: (value) => {
                        if (value >= 100000) return (value / 100000).toFixed(1) + 'L';
                        if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
                        return value;
                    }
                },
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            x: {
                ticks: { color: '#94a3b8' },
                grid: { display: false }
            }
        }
    };

    // ================= CHART CONFIGURATION PARAMETERS DATA BINDINGS =================
    const sortedCategories = Object.entries(summaryData.categoryData || {}).sort(([, a], [, b]) => b - a);
    const top5 = sortedCategories.slice(0, 5);
    const remaining = sortedCategories.slice(5);
    const otherTotal = remaining.reduce((sum, [, val]) => sum + val, 0);

    const finalLabels = top5.map(([name]) => name);
    const finalValues = top5.map(([, val]) => val);
    if (otherTotal > 0) {
        finalLabels.push("Others");
        finalValues.push(otherTotal);
    }

    const pieData = {
        labels: finalLabels,
        datasets: [{
            data: finalValues,
            backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#94a3b8'],
            hoverOffset: 25,
            borderWidth: 2,
            borderColor: '#1e293b'
        }]
    };

    const currentMonthLabel = MONTH_NAMES[selectedAnalyticsMonth];
    const displayBarLabel = selectedAnalyticsYear === "ALL" ? 'Cash Flow (All Years Combined)' : `Cash Flow (${currentMonthLabel} ${selectedAnalyticsYear})`;

    const overviewBarData = {
        labels: [displayBarLabel],
        datasets: [
            { label: 'Income', data: [summaryData.totalIncome], backgroundColor: '#10b981', borderRadius: 6 },
            { label: 'Expense', data: [summaryData.totalSpent], backgroundColor: '#ef4444', borderRadius: 6 }
        ]
    };

    const monthlyLineData = {
        labels: monthlyTrends.map(item => MONTH_NAMES[item.month] || `Month ${item.month}`),
        datasets: [{
            label: selectedAnalyticsYear === "ALL" ? 'Spending Trend (All Years Combined)' : `Spending Trend (${selectedAnalyticsYear})`,
            data: monthlyTrends.map(item => Number(item.total || 0)),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 3,
            pointRadius: 4
        }]
    };

    const yearlyBarData = {
        labels: yearlyTrends.map(item => String(item.year || 'Year')),
        datasets: [{
            label: 'Annual Cost Baseline',
            data: yearlyTrends.map(item => Number(item.total || 0)),
            backgroundColor: '#06b6d4',
            borderRadius: 6
        }]
    };

    if (loading) return <div className="loading">Refining your data...</div>;

    return (
        <div className="app-layout dark-theme">
            <Sidebar />
            <div className="main-content">
                <Navbar title="Financial Analytics" />

                {/* Sub Tab Selection Strip Group */}
                <div style={{ display: 'flex', background: '#111827', padding: '6px', borderRadius: '10px', margin: '0 30px 20px 30px', border: '1px solid #334155', width: 'fit-content', gap: '5px' }}>
                    <button type="button" onClick={() => setActiveTab("overview")} className="view-all-link-btn" style={{ background: activeTab === "overview" ? "#6366f1" : "transparent", boxShadow: 'none', padding: '8px 18px', fontSize: '0.9rem' }}>Overview</button>
                    <button type="button" onClick={() => setActiveTab("monthly")} className="view-all-link-btn" style={{ background: activeTab === "monthly" ? "#6366f1" : "transparent", boxShadow: 'none', padding: '8px 18px', fontSize: '0.9rem' }}>Monthly Trends</button>
                    <button type="button" onClick={() => setActiveTab("yearly")} className="view-all-link-btn" style={{ background: activeTab === "yearly" ? "#6366f1" : "transparent", boxShadow: 'none', padding: '8px 18px', fontSize: '0.9rem' }}>Yearly History</button>
                </div>

                <div className="analytics-container">
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginBottom: '24px', width: '100%', flexWrap: 'wrap' }}>

                        {/* Month Selector Dropdown */}
                        <div style={{ position: 'relative', width: '160px' }}>
                            <select
                                value={selectedAnalyticsMonth}
                                disabled={selectedAnalyticsYear === "ALL"}
                                onChange={(e) => setSelectedAnalyticsMonth(Number(e.target.value))}
                                style={{
                                    background: selectedAnalyticsYear === "ALL" ? '#0f172a' : '#1e293b',
                                    color: selectedAnalyticsYear === "ALL" ? '#475569' : '#fff',
                                    border: '1px solid #475569',
                                    padding: '10px 35px 10px 15px',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    outline: 'none',
                                    cursor: selectedAnalyticsYear === "ALL" ? 'not-allowed' : 'pointer',
                                    height: '42px',
                                    width: '100%',
                                    appearance: 'none',
                                    opacity: selectedAnalyticsYear === "ALL" ? 0.5 : 1
                                }}
                            >
                                {FULL_MONTH_NAMES.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                            <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', fontSize: '10px' }}>▼</div>
                        </div>

                        {/* Year Selector Dropdown */}
                        <div style={{ position: 'relative', width: '200px' }}>
                            <select
                                value={selectedAnalyticsYear}
                                onChange={(e) => setSelectedAnalyticsYear(e.target.value)}
                                style={{ background: '#1e293b', color: '#fff', border: '1px solid #475569', padding: '10px 35px 10px 15px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', outline: 'none', cursor: 'pointer', height: '42px', width: '100%', appearance: 'none' }}
                            >
                                <option value="ALL">All Years Combined 📊</option>
                                <option value="2024">Year 2024</option>
                                <option value="2025">Year 2025</option>
                                <option value="2026">Year 2026</option>
                            </select>
                            <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', fontSize: '10px' }}>▼</div>
                        </div>

                        {/* Export Action Trigger Button */}
                        <button type="button" className="export-btn" disabled={isExporting} onClick={handleExportPDF} style={{
                            padding: '10px 20px', borderRadius: '8px', border: 'none', background: isExporting ? '#334155' : '#4f46e5', color: 'white', cursor: isExporting ? 'not-allowed' : 'pointer', fontWeight: '600', transition: 'transform 0.2s', height: '42px', margin: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        onMouseOver={(e) => !isExporting && (e.currentTarget.style.transform = 'scale(1.02)')}
                        onMouseOut={(e) => !isExporting && (e.currentTarget.style.transform = 'scale(1)')}
                        >
                             {isExporting ? "Compiling Multi-Page PDF..." : "Download PDF Report"}
                        </button>
                    </div>

                    {/* ====== INTERACTIVE SCREEN GRID SUMMARY INTERFACES ====== */}
                    <div className="analytics-grid">
                        {activeTab === "overview" && (
                            <>
                                <div className="chart-card">
                                    <div className="card-header">
                                        <h3>Expense Distribution</h3>
                                        <p>Spending weights by category ({selectedAnalyticsYear === "ALL" ? "All Years" : `${MONTH_NAMES[selectedAnalyticsMonth]} ${selectedAnalyticsYear}`})</p>
                                    </div>
                                    <div className="chart-wrapper" style={{ height: '380px', position: 'relative' }}>
                                        <Pie key={`pie-${selectedAnalyticsYear}-${selectedAnalyticsMonth}`} data={pieData} options={{ ...chartOptions, scales: { x: { display: false }, y: { display: false } } }} />
                                    </div>
                                </div>

                                <div className="chart-card">
                                    <div className="card-header">
                                        <h3>Flow Overview</h3>
                                        <p>Income vs Total Expenses Baseline</p>
                                    </div>
                                    <div className="chart-wrapper">
                                        <Bar key={`bar-overview-${selectedAnalyticsYear}-${selectedAnalyticsMonth}`} data={overviewBarData} options={chartOptions} />
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === "monthly" && (
                            <div className="chart-card" style={{ gridColumn: 'span 2' }}>
                                <div className="card-header">
                                    <h3>Macro Monthly Burn-Rate</h3>
                                    <p>Consecutive timeline monitoring metrics for {selectedAnalyticsYear === "ALL" ? "All Years Combined" : selectedAnalyticsYear}</p>
                                </div>
                                <div className="chart-wrapper" style={{ height: '400px' }}>
                                    <Line key={`line-monthly-${selectedAnalyticsYear}`} data={monthlyLineData} options={chartOptions} />
                                </div>
                            </div>
                        )}

                        {activeTab === "yearly" && (
                            <div className="chart-card" style={{ gridColumn: 'span 2' }}>
                                <div className="card-header">
                                    <h3>Year-Over-Year Capital Footprint</h3>
                                    <p>Long-term baseline trends</p>
                                </div>
                                <div className="chart-wrapper" style={{ height: '400px' }}>
                                    <Bar data={yearlyBarData} options={chartOptions} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* =========================================================================
                    🌟 HIDDEN COMPILATION CONSOLE NODES: PRE-BUILT FOR HTML2CANVAS MULTI-PAGE EXPORTS
                    ========================================================================= */}
                <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '1200px', display: 'flex', flexDirection: 'column', gap: '50px' }}>

                    {/* PAGE 1 NODE: EXPENSE DISTRIBUTION OVERVIEW PRINT BOUNDS */}
                    <div id="print-page-1" style={{ background: '#0f172a', padding: '50px', borderRadius: '12px', width: '1100px' }}>
                        <h1 style={{ color: '#fff', fontSize: '2.2rem', marginBottom: '5px', fontWeight: '800' }}>Financial Analysis Report</h1>
                        <p style={{ color: '#6366f1', fontSize: '1rem', fontWeight: '700', marginBottom: '40px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Section 01: Category Allocation & Flow Breakdowns</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '25px', borderRadius: '12px' }}>
                                <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px' }}>Expense Distribution Weights</h3>
                                <div style={{ height: '350px', position: 'relative' }}><Pie data={pieData} options={{ ...chartOptions, animation: false, responsive: true, scales: { x: { display: false }, y: { display: false } } }} /></div>
                            </div>
                            <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '25px', borderRadius: '12px' }}>
                                <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px' }}>Inflow vs Outflow Cash Baseline</h3>
                                <div style={{ height: '350px', position: 'relative' }}><Bar data={overviewBarData} options={{ ...chartOptions, animation: false, responsive: true }} /></div>
                            </div>
                        </div>
                    </div>

                    {/* PAGE 2 NODE: MACRO MONTHLY TIME-SERIES LINE PLOT */}
                    <div id="print-page-2" style={{ background: '#0f172a', padding: '50px', borderRadius: '12px', width: '1100px' }}>
                        <h1 style={{ color: '#fff', fontSize: '2.2rem', marginBottom: '5px', fontWeight: '800' }}>Financial Analysis Report</h1>
                        <p style={{ color: '#6366f1', fontSize: '1rem', fontWeight: '700', marginBottom: '40px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Section 02: Macro Monthly Burn-Rate Timeline Analytics</p>

                        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '25px', borderRadius: '12px' }}>
                            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px' }}>Consecutive Burn-Rate Variance Curve</h3>
                            <div style={{ height: '420px', position: 'relative' }}><Line data={monthlyLineData} options={{ ...chartOptions, animation: false, responsive: true }} /></div>
                        </div>
                    </div>

                    {/* PAGE 3 NODE: YEAR-OVER-YEAR HISTORY HISTOGRAM BLOCK */}
                    <div id="print-page-3" style={{ background: '#0f172a', padding: '50px', borderRadius: '12px', width: '1100px' }}>
                        <h1 style={{ color: '#fff', fontSize: '2.2rem', marginBottom: '5px', fontWeight: '800' }}>Financial Analysis Report</h1>
                        <p style={{ color: '#6366f1', fontSize: '1rem', fontWeight: '700', marginBottom: '40px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Section 03: Year-Over-Year Long-Term Capital Footprints</p>

                        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '25px', borderRadius: '12px' }}>
                            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px' }}>Annual Budget Cost Aggregates Histogram</h3>
                            <div style={{ height: '420px', position: 'relative' }}><Bar data={yearlyBarData} options={{ ...chartOptions, animation: false, responsive: true }} /></div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}