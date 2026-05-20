import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useAuth } from "../auth/AuthContext";
import API from "../api/api";
import * as XLSX from 'xlsx';

export default function Profile() {
    const { role, logout } = useAuth();
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // Isolate role checker flag cleanly
    const isAdmin = role === "ADMIN";

    // ================= STATE CONFIGURATIONS =================
    const [selectedYear, setSelectedYear] = useState("2026");
    const [selectedMonth, setSelectedMonth] = useState("5");

    // Expand state keys to safely accept both Admin and User structures
    const [savingsData, setSavingsData] = useState({ income: 0, expenses: 0, savings: 0 });
    const [adminUserCounts, setAdminUserCounts] = useState({ total: 0, active: 0, blocked: 0 });

    const [savingsLoading, setSavingsLoading] = useState(true);
    const [avatarImage, setAvatarImage] = useState(null);
    const [recentLogs, setRecentLogs] = useState([]);

    // Profile Identity Tracking States
    const [userData, setUserData] = useState({ name: "User Account", username: "", email: "", phoneNo: "Not Linked" });
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", username: "", email: "", phoneNo: "", password: "" });
    const [editError, setEditError] = useState("");
    const [editSuccess, setEditSuccess] = useState("");

    const MONTHS = [
        { value: "1", label: "January" }, { value: "2", label: "February" },
        { value: "3", label: "March" }, { value: "4", label: "April" },
        { value: "5", label: "May" }, { value: "6", label: "June" },
        { value: "7", label: "July" }, { value: "8", label: "August" },
        { value: "9", label: "September" }, { value: "10", label: "October" },
        { value: "11", label: "November" }, { value: "12", label: "December" }
    ];

    const YEARS = ["2024", "2025", "2026"];
    const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

    const formatLabelDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // ================= FETCH CORE PERSISTENT METRICS =================
    const fetchProfileMetadata = async () => {
        try {
            setSavingsLoading(true);

            // Automatically routes analytics calls based on User Role authority profiles
            if (isAdmin) {
                // Admin platform-wide overview payload channel mapping
                const res = await API.get("/admin/analytics");
                if (res.data) {
                    setSavingsData({
                        income: res.data.totalIncomeAmount || 0,
                        expenses: res.data.totalExpenseAmount || 0,
                        savings: res.data.totalNetBalance || 0
                    });
                    setAdminUserCounts({
                        total: res.data.totalUsers || 0,
                        active: res.data.activeUsers || 0,
                        blocked: res.data.blockedUsers || 0
                    });
                }
            } else {
                // Standard personal User layout overview summary logic path mapping
                const res = await API.get("/api/expenses/analytics/summary");
                if (res.data) {
                    setSavingsData({
                        income: res.data.totalIncome || 0,
                        expenses: res.data.totalSpent || 0,
                        savings: res.data.totalBalance || 0
                    });
                    const rawTransactions = res.data.recentTransactions || [];
                    setRecentLogs(rawTransactions.slice(0, 3));
                }
            }

            // Fetch avatar cloud image
            const avatarRes = await API.get("/api/users/profile/avatar");
            if (avatarRes.data && avatarRes.data.avatar) {
                setAvatarImage(avatarRes.data.avatar);
            }

            // Fetch full profile data context directly from user database columns
            const profileDetailsRes = await API.get("/api/users/profile/details");
            if (profileDetailsRes.data) {
                setUserData({
                    name: profileDetailsRes.data.name,
                    username: profileDetailsRes.data.username,
                    email: profileDetailsRes.data.email,
                    phoneNo: profileDetailsRes.data.phoneNo || "Not Linked"
                });
            }

        } catch (error) {
            console.error("Failed to load profile metadata panel securely:", error);
        } finally {
            setSavingsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileMetadata();
    }, [role]); // Listens cleanly to dynamic authentication transitions

    const openEditIdentityModal = () => {
        setEditForm({
            name: userData.name || "",
            username: userData.username || "",
            email: userData.email || "",
            phoneNo: userData.phoneNo === "Not Linked" ? "" : (userData.phoneNo || ""),
            password: ""
        });
        setEditError("");
        setEditSuccess("");
        setIsEditProfileOpen(true);
    };

    const handleUpdateIdentitySubmit = async (e) => {
        e.preventDefault();
        setEditError("");
        setEditSuccess("");

        try {
            const response = await API.put("/api/users/profile/update-identity", editForm);
            setEditSuccess("✓ Profile updated successfully!");

            setUserData({
                name: response.data.name,
                username: response.data.username,
                email: response.data.email,
                phoneNo: response.data.phoneNo || "Not Linked"
            });

            setTimeout(() => {
                setIsEditProfileOpen(false);
            }, 1500);

        } catch (err) {
            setEditError(err.response?.data?.message || "Verification Failed: Unable to modify attributes safely.");
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                alert("❌ Profile image is too large! Please choose an image smaller than 1 MB.");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result;
                try {
                    setAvatarImage(base64String);
                    await API.put("/api/users/profile/avatar", { avatar: base64String });
                } catch (err) {
                    console.error("Failed to upload avatar to database:", err);
                    alert("Could not sync profile image to your cloud account registry.");
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAccountWipe = async () => {
        const confirmation = window.confirm("CRITICAL WARNING: Are you sure you want to permanently delete all financial history items? This process cannot be undone.");
        if (confirmation) {
            try {
                await API.delete("/api/expenses");
                alert("Account financial history wiped clean successfully.");
                fetchProfileMetadata();
            } catch (error) {
                console.error("Wipe command exception:", error);
                alert("Failed to safely execute database wipe command.");
            }
        }
    };

    const handlePasswordReset = () => {
        navigate("/forgot-password");
    };

    // ================= GLOW EFFECT UTILITY HOVERS =================
    const applyGlowHover = (e, colorShadow) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 12px 24px rgba(0, 0, 0, 0.4), 0 0 20px ${colorShadow}`;
    };

    const removeGlowHover = (e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
    };

    // ================= CLIENT-SIDE STATEMENT COMPILERS =================
    const processDownload = (rawJsonContainer, format, baseFileName) => {
        const rawJsonData = Array.isArray(rawJsonContainer) ? rawJsonContainer : (rawJsonContainer.content || []);
        if (!rawJsonData || rawJsonData.length === 0) {
            alert("No transaction records found for the selected timeline boundary.");
            return;
        }

        const lifoSortedData = [...rawJsonData].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateB - dateA !== 0) return dateB - dateA;
            return Number(b.id || 0) - Number(a.id || 0);
        });

        if (format === 'excel') {
            const worksheetData = lifoSortedData.map((item, idx) => ({
                "S.No": idx + 1,
                "Date": item.date,
                "Title Description": item.title,
                "Category Group": item.category,
                "Transaction Type": item.type,
                "Amount (INR)": Number(item.amount)
            }));
            const worksheet = XLSX.utils.json_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger Summary");
            XLSX.writeFile(workbook, `${baseFileName}.xlsx`);
        }
        else if (format === 'csv') {
            const headers = ["S.No", "Date", "Title", "Category", "Type", "Amount"];
            const csvRows = [headers.join(",")];
            lifoSortedData.forEach((item, idx) => {
                csvRows.push([idx + 1, `"${item.date}"`, `"${item.title.replace(/"/g, '""')}"`, `"${item.category}"`, `"${item.type}"`, item.amount].join(","));
            });
            const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `${baseFileName}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        else if (format === 'pdf') {
            const printWindow = window.open("", "_blank");
            if(printWindow) printWindow.opener = null;

            let tableRows = lifoSortedData.map((item, idx) => `
                <tr>
                    <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; text-align:center;">${idx + 1}</td>
                    <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; color:#475569;">${formatLabelDate(item.date)}</td>
                    <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; font-weight:600; color:#1e293b;">${item.title}</td>
                    <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; color:#475569;">${item.category}</td>
                    <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; font-weight:700; text-align:center; color:${item.type === 'INCOME' ? '#10b981' : '#ef4444'};">${item.type}</td>
                    <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; font-weight:700; text-align:right; color:#0f172a;">₹${Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
            `).join("");

            printWindow.document.write(`
                <html>
                <head>
                    <title>${baseFileName}</title>
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
                        .header { margin-bottom: 30px; border-bottom: 2px solid #6366f1; padding-bottom: 20px; }
                        h2 { margin: 0; color: #0f172a; font-size: 24px; }
                        p { margin: 5px 0 0 0; color: #64748b; font-size: 14px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
                        th { background: #f8fafc; color: #334155; font-weight: 700; padding: 12px 10px; text-align: left; border-bottom: 2px solid #cbd5e1; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>Financial Ledger Report Summary</h2>
                        <p>Statement Profile: ${baseFileName.replace(/_/g, ' ')}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th style="text-align:center; width:50px;">S.No</th>
                                <th style="width:110px;">Date</th>
                                <th>Title Description</th>
                                <th style="width:130px;">Category</th>
                                <th style="text-align:center; width:90px;">Type</th>
                                <th style="text-align:right; width:120px;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                    <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 100); }</script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const handleFetchAndConvert = async (urlPath, params = {}, format, baseFileName) => {
        try {
            const response = await API.get(urlPath, { params });
            processDownload(response.data, format, baseFileName);
        } catch (error) {
            console.error("Fetch operation failure via Axios instance:", error);
            alert("Network connection error while communicating with the server.");
        }
    };

    const handleLifetimeDownload = (format) => handleFetchAndConvert("/api/expenses", { page: 0, size: 5000 }, format, "Lifetime_Financial_Ledger");
    const handleYearlyDownload = (format) => handleFetchAndConvert("/api/expenses/date-between", { start: `${selectedYear}-01-01`, end: `${selectedYear}-12-31`, page: 0, size: 5000 }, format, `Annual_Report_${selectedYear}`);
    const handleMonthlyDownload = (format) => {
        const paddedMonth = selectedMonth.padStart(2, '0');
        handleFetchAndConvert("/api/expenses/date-between", { start: `${selectedYear}-${paddedMonth}-01`, end: `${selectedYear}-${paddedMonth}-31`, page: 0, size: 5000 }, format, `Monthly_Report_${selectedYear}_Month_${selectedMonth}`);
    };

    return (
        <div className="app-layout dark-theme">
            <Sidebar />
            <div className="main-content">
                <Navbar title="My Profile" />

                <div className="profile-container" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '30px' }}>

                    {/* ====== BANNER: PREMIUM USER METRICS VIEW PANEL ====== */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111827', padding: '30px', borderRadius: '16px', border: '1px solid #334155', flexWrap: 'wrap', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#1e293b', border: '3px solid #6366f1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {avatarImage ? (
                                        <img src={avatarImage} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '3rem', color: '#6366f1' }}>👤</span>
                                    )}
                                </div>
                                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                                <button type="button" onClick={() => fileInputRef.current.click()} style={{ position: 'absolute', bottom: '0', right: '0', background: '#6366f1', color: 'white', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }} title="Change Profile Picture">
                                    ✏️
                                </button>
                            </div>
                            <div>
                                <h2 style={{ margin: '0 0 8px 0', color: '#f8fafc', fontSize: '2.4rem', fontWeight: '800', letterSpacing: '-0.02em' }}>{userData.name}</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: '#cbd5e1' }}>

                                    {/* 🌟 FIXED: Displays real profile handle always, with separate administrative toggle flags */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        <span style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#cbd5e1', padding: '4px 12px', borderRadius: '6px', fontSize: '0.95rem', fontWeight: '600', border: '1px solid #334155' }}>
                                            @{userData.username || "username"}
                                        </span>

                                        {isAdmin && (
                                            <span style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '700', border: '1px solid rgba(168, 85, 247, 0.4)', letterSpacing: '0.05em' }}>
                                                🛡️ ADMIN CONTROL PANEL
                                            </span>
                                        )}
                                    </div>

                                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.15rem', color: '#e2e8f0' }}>
                                        <img
                                            src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
                                            alt="Gmail"
                                            style={{ width: '22px', height: '18px', objectFit: 'contain', display: 'inline-block', verticalAlign: 'middle' }}
                                        />
                                        {userData.email || "email@example.com"}
                                    </span>

                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', color: '#e2e8f0' }}>📱 {userData.phoneNo}</span>
                                </div>
                            </div>
                        </div>

                        <button type="button" onClick={openEditIdentityModal} style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)', transition: 'all 0.2s' }}>
                            ⚙️ Edit Personal Info
                        </button>
                    </div>

                    {/* ====== METRICS GRID MATRIX ELEMENTS ====== */}
                    <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>

                        {/* CARD 1: ACCOUNT DETAIL LABELS & CONTROLS */}
                        <div
                            className="card"
                            style={{ background: '#1e293b', borderTop: `4px solid #f59e0b`, borderLeft: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155', borderRadius: '12px', padding: '20px', margin: '0', transition: 'all 0.3s ease' }}
                            onMouseOver={(e) => applyGlowHover(e, 'rgba(245, 158, 11, 0.35)')}
                            onMouseOut={removeGlowHover}
                        >
                            <h2>Account Details</h2>
                            <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Account Type:</span>
                                    <span style={{ color: '#f59e0b', fontWeight: '700' }}>{role}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Session Status:</span>
                                    <span style={{ color: '#10b981', fontWeight: '600' }}>Secure / Verified</span>
                                </div>
                                <hr style={{ borderColor: '#334155', margin: '8px 0' }} />
                                <h4 style={{ margin: '5px 0', color: '#e2e8f0' }}>Security Center Controls</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px' }}>
                                    <button type="button" onClick={handlePasswordReset} className="view-all-link-btn" style={{ width: '100%', padding: '10px', background: '#334155' }}>
                                        🔐 Change Account Password
                                    </button>

                                    {!isAdmin && (
                                        <button type="button" onClick={handleAccountWipe} className="view-all-link-btn" style={{ width: '100%', padding: '10px', background: '#ef4444' }}>
                                            ⚠️ Wipe Financial History Data
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* CARD 2: REAL-TIME FINANCIAL KPIS */}
                        <div
                            className="card"
                            style={{ background: '#1e293b', borderTop: `4px solid #10b981`, borderLeft: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155', borderRadius: '12px', padding: '20px', margin: '0', transition: 'all 0.3s ease' }}
                            onMouseOver={(e) => applyGlowHover(e, savingsData.savings >= 0 ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)')}
                            onMouseOut={removeGlowHover}
                        >
                            <h2>{isAdmin ? "Global Financial Overview" : "Financial Overview"}</h2>
                            {savingsLoading ? (
                                <p style={{ color: '#94a3b8', marginTop: '15px' }}>Computing evaluation parameters...</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#94a3b8' }}>{isAdmin ? "Platform Total Income:" : "Total Lifetime Income:"}</span>
                                        <span style={{ color: '#34d399', fontWeight: '700' }}>{currencyFormatter.format(savingsData.income)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#94a3b8' }}>{isAdmin ? "Platform Total Outflow:" : "Total Lifetime Outflow:"}</span>
                                        <span style={{ color: '#ef4444', fontWeight: '700' }}>{currencyFormatter.format(savingsData.expenses)}</span>
                                    </div>
                                    <hr style={{ borderColor: '#334155', margin: '4px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                                        <span style={{ fontWeight: '600', color: '#f8fafc' }}>{isAdmin ? "System Global Net Balance:" : "Total Savings Retained:"}</span>
                                        <span style={{ color: '#6366f1', fontWeight: '800' }}>{currencyFormatter.format(savingsData.savings)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CARD 3: RECENT ACTIVITY / ADAPTIVE SYSTEM METRICS FOR ADMIN */}
                        <div
                            className="card"
                            style={{ background: '#1e293b', borderTop: `4px solid #a855f7`, borderLeft: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155', borderRadius: '12px', padding: '20px', margin: '0', transition: 'all 0.3s ease' }}
                            onMouseOver={(e) => applyGlowHover(e, 'rgba(168, 85, 247, 0.35)')}
                            onMouseOut={removeGlowHover}
                        >
                            <h2>{isAdmin ? "User Management Baseline" : "Recent Activities"}</h2>
                            <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {isAdmin ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#94a3b8' }}>Total Users Count:</span>
                                            <span style={{ color: '#fff', fontWeight: '700' }}>{adminUserCounts.total} Profiles</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#94a3b8' }}>Active (Enabled) Users:</span>
                                            <span style={{ color: '#10b981', fontWeight: '700' }}>{adminUserCounts.active} Active</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#94a3b8' }}>Blocked (Suspended) Users:</span>
                                            <span style={{ color: '#ef4444', fontWeight: '700' }}>{adminUserCounts.blocked} Accounts</span>
                                        </div>
                                    </div>
                                ) : (
                                    recentLogs.length > 0 ? (
                                        recentLogs.map((log) => (
                                            <div key={log.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                <div style={{
                                                    background: log.type === 'INCOME' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                                    color: log.type === 'INCOME' ? '#10b981' : '#ef4444',
                                                    borderRadius: '8px', padding: '6px 10px', fontSize: '0.85rem', fontWeight: '700'
                                                }}>
                                                    {log.type === 'INCOME' ? '▲' : '▼'}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', flex: '1' }}>
                                                    <span style={{ color: '#f8fafc', fontWeight: '600', fontSize: '0.95rem' }}>
                                                        {log.type === 'INCOME' ? 'Received' : 'Spent'} {currencyFormatter.format(log.amount)}
                                                    </span>
                                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                                                        Ref: "{log.title}" inside {log.category} • {formatLabelDate(log.date)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No recent ledger data entries recorded.</p>
                                    )
                                )}
                            </div>
                        </div>

                        {/* CARD 4: REPORT GENERATOR PANEL */}
                        {!isAdmin && (
                            <div
                                className="card"
                                style={{ background: '#1e293b', borderTop: `4px solid #22d3ee`, borderLeft: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155', borderRadius: '12px', padding: '20px', gridColumn: 'span 3', margin: '0', transition: 'all 0.3s ease' }}
                                onMouseOver={(e) => applyGlowHover(e, 'rgba(34, 211, 238, 0.35)')}
                                onMouseOut={removeGlowHover}
                            >
                                <h2>Interactive Statement Report Generator</h2>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
                                    Configure target scope boundaries to pull custom documents or spreadsheets seamlessly.
                                </p>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                                        <h4 style={{ margin: '0 0 5px 0', color: '#22d3ee' }}>1. Target Scope Parameters</h4>
                                        <div className="form-group">
                                            <label style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>Target Fiscal Year</label>
                                            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ background: '#1e293b', color: 'white', border: '1px solid #475569', padding: '10px', borderRadius: '8px', width: '100%', outline: 'none' }}>
                                                {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>Target Statement Month</label>
                                            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ background: '#1e293b', color: 'white', border: '1px solid #475569', padding: '10px', borderRadius: '8px', width: '100%', outline: 'none' }}>
                                                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
                                        <div>
                                            <h5 style={{ margin: '0 0 8px 0', color: '#e2e8f0', fontSize: '0.9rem' }}>Extract Monthly Balance Statement ({MONTHS.find(m => m.value === selectedMonth)?.label})</h5>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button className="view-all-link-btn" onClick={() => handleMonthlyDownload('pdf')} style={{ flex: 1, padding: '10px' }}>PDF</button>
                                                <button className="view-all-link-btn" onClick={() => handleMonthlyDownload('excel')} style={{ flex: 1, padding: '10px', background: '#10b981' }}>Excel</button>
                                                <button className="view-all-link-btn" onClick={() => handleMonthlyDownload('csv')} style={{ flex: 1, padding: '10px', background: '#64748b' }}>CSV</button>
                                            </div>
                                        </div>
                                        <div>
                                            <h5 style={{ margin: '0 0 8px 0', color: '#e2e8f0', fontSize: '0.9rem' }}>Extract Complete Annual Summary ({selectedYear})</h5>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button className="view-all-link-btn" onClick={() => handleYearlyDownload('pdf')} style={{ flex: 1, padding: '10px' }}>PDF</button>
                                                <button className="view-all-link-btn" onClick={() => handleYearlyDownload('excel')} style={{ flex: 1, padding: '10px', background: '#10b981' }}>Excel</button>
                                                <button className="view-all-link-btn" onClick={() => handleYearlyDownload('csv')} style={{ flex: 1, padding: '10px', background: '#64748b' }}>CSV</button>
                                            </div>
                                        </div>
                                        <div style={{ paddingTop: '15px', borderTop: '1px dashed #334155' }}>
                                            <h5 style={{ margin: '0 0 8px 0', color: '#a855f7', fontSize: '0.9rem', fontWeight: '700' }}>Extract All-Time Comprehensive History Ledger</h5>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button className="view-all-link-btn" onClick={() => handleLifetimeDownload('pdf')} style={{ flex: 1, padding: '10px', background: '#8b5cf6' }}>PDF</button>
                                                <button className="view-all-link-btn" onClick={() => handleLifetimeDownload('excel')} style={{ flex: 1, padding: '10px', background: '#10b981' }}>Excel</button>
                                                <button className="view-all-link-btn" onClick={() => handleLifetimeDownload('csv')} style={{ flex: 1, padding: '10px', background: '#64748b' }}>CSV</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* ====== SECURE PROFILE EDIT MODAL ====== */}
            {isEditProfileOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
                    <div className="modal-container" style={{ width: '440px', background: 'linear-gradient(145deg, #1e293b, #0f172a)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '35px', borderRadius: '16px', color: '#fff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700' }}>Update Account Details</h3>
                            <button type="button" onClick={() => setIsEditProfileOpen(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>

                        {editError && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '15px' }}>⚠️ {editError}</div>}
                        {editSuccess && <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '15px' }}>✓ {editSuccess}</div>}

                        <form onSubmit={handleUpdateIdentitySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px', fontWeight: '600' }}>Full Name</label>
                                <input type="text" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px', fontWeight: '600' }}>Username</label>
                                <input type="text" required value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px', fontWeight: '600' }}>Email Address</label>
                                <input type="email" required value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px', fontWeight: '600' }}>Phone Number</label>
                                <input type="text" value={editForm.phoneNo} placeholder="Enter mobile sequence" onChange={(e) => setEditForm({ ...editForm, phoneNo: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                            </div>

                            <div style={{ marginTop: '5px', borderTop: '1px dashed #334155', paddingTop: '15px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: '#f59e0b', marginBottom: '5px', fontWeight: '700' }}>🛡️ Security Verification Required</label>
                                <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '0 0 10px 0', lineHeight: '1.4' }}>Confirm your identity using your login password to authorize these changes.</p>
                                <input type="password" required placeholder="Enter account password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} style={{ width: '100%', padding: '11px 14px', background: '#0f172a', border: '1px solid #f59e0b', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                <button type="button" onClick={() => setIsEditProfileOpen(false)} style={{ background: '#334155', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}>Verify & Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}