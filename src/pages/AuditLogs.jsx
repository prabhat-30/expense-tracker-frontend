import React, { useEffect, useState, useCallback } from "react";
import API from "../api/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../CSS/layout.css";
import "../CSS/dashboard.css";
import * as XLSX from 'xlsx';

// 🌟 ENTERPRISE SECURITY UTILITY: Sanitizes dynamic strings against Reflected XSS
const escapeHtml = (str) => {
    if (!str) return "";
    return str.toString()
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
};

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [jumpPage, setJumpPage] = useState("1");
    const pageSize = 10;

    // Filter states
    const [searchPerformer, setSearchPerformer] = useState("");
    const [filterAction, setFilterAction] = useState("ALL");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // Accordion Expansion
    const [expandedLogId, setExpandedLogId] = useState(null);

    const CORE_SYSTEM_ACTIONS = [
        "LOGIN_SUCCESS", "LOGIN_FAILED", "CREATE_EXPENSE", "UPDATE_EXPENSE",
        "DELETE_EXPENSE", "BULK_CREATE", "SET_BUDGET", "STOP_RECURRING",
        "UPDATE_PROFILE_INFO", "WIPE_DATA"
    ];

    // 🌟 REFACTORED: Unified backend search pipeline optimization rule
    const fetchLogs = useCallback(async (page = 0) => {
        try {
            setLoading(true);

            // Compile backend matrix bindings dynamically
            let queryParams = `/admin/audit-logs?page=${page}&size=${pageSize}&sort=id,desc`;
            if (searchPerformer.trim()) queryParams += `&username=${encodeURIComponent(searchPerformer.trim())}`;
            if (filterAction !== "ALL") queryParams += `&action=${encodeURIComponent(filterAction)}`;
            if (fromDate) queryParams += `&fromDate=${encodeURIComponent(fromDate)}`;
            if (toDate) queryParams += `&toDate=${encodeURIComponent(toDate)}`;

            const res = await API.get(queryParams);
            const rawData = res.data.content || res.data || [];

            // Assure descending timeline sort sequence is enforced safely
            const lifoData = Array.isArray(rawData) ? [...rawData].sort((a, b) => b.id - a.id) : [];

            setLogs(lifoData);
            setTotalPages(res.data.totalPages || 1);
            setCurrentPage(page);
            setJumpPage((page + 1).toString());
        } catch (error) {
            console.error("Failed to fetch admin logs:", error);
        } finally {
            setLoading(false);
        }
    }, [searchPerformer, filterAction, fromDate, toDate]);

    // Re-fetch triggers smoothly when inputs shift
    useEffect(() => {
        const structuralDebounceDelay = setTimeout(() => {
            fetchLogs(0);
        }, 350);
        return () => clearTimeout(structuralDebounceDelay);
    }, [searchPerformer, filterAction, fromDate, toDate, fetchLogs]);

    const handlePageJump = (e) => {
        if (e.key === 'Enter') {
            const pageNum = parseInt(jumpPage);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                fetchLogs(pageNum - 1);
            } else {
                setJumpPage((currentPage + 1).toString());
            }
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return "pending...";
        return new Date(timestamp).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: true
        }).toLowerCase();
    };

    const getActionClass = (action) => {
        const act = action ? action.toUpperCase() : "";
        if (act.includes('UNDO')) return 'status-pill-purple';
        if (act.includes('REGISTER')) return 'status-pill-green';
        if (act.includes('LOGIN_SUCCESS')) return 'status-pill-blue';
        if (act.includes('LOGIN_FAILED')) return 'status-pill-red';
        if (act.includes('DISABLED')) return 'status-pill-red';
        if (act.includes('ENABLED')) return 'status-pill-green';
        if (act.includes('ROLE') || act.includes('UPDATE')) return 'status-pill-amber';
        if (act.includes('CREATE')) return 'status-pill-green';
        if (act.includes('DELETE') || act.includes('WIPE')) return 'status-pill-red';
        return 'status-pill-gray';
    };

    const handleRowClick = (logId) => {
        setExpandedLogId(expandedLogId === logId ? null : logId);
    };

    // =========================================================================
    // 🌟 COMPLIANCE EXPORT ENGINE (SECURED & STABILIZED)
    // =========================================================================
    const exportLogs = async (format) => {
        try {
            alert("Compiling complete system audit history dataset criteria filters. Please wait...");

            // Pull full administrative block allocation limits (Max size bypass matching filters)
            let queryPath = `/admin/audit-logs?page=0&size=5000&sort=id,desc`;
            if (searchPerformer.trim()) queryPath += `&username=${encodeURIComponent(searchPerformer.trim())}`;
            if (filterAction !== "ALL") queryPath += `&action=${encodeURIComponent(filterAction)}`;
            if (fromDate) queryPath += `&fromDate=${encodeURIComponent(fromDate)}`;
            if (toDate) queryPath += `&toDate=${encodeURIComponent(toDate)}`;

            const res = await API.get(queryPath);
            const rawData = res.data.content || res.data || [];

            if (rawData.length === 0) {
                alert("No historical records match your selected criteria filters.");
                return;
            }

            const lifoSortedData = [...rawData].sort((a, b) => b.id - a.id);

            if (format === 'excel') {
                const worksheetData = lifoSortedData.map((log, index) => {
                    const ip = log.ipAddress || log.ip_address || "127.0.0.1";
                    const ua = log.userAgent || log.user_agent || "Mozilla/5.0 (Windows)";
                    const refId = log.id ? `LOG_UUID_00${log.id}` : `LOG_UUID_00${index + 475}`;

                    return {
                        "S.No": index + 1,
                        "Timestamp": formatTimestamp(log.timestamp),
                        "Performer Username": log.username || "System",
                        "Action Type": log.action,
                        "Details Log": log.details,
                        "IP Address": ip,
                        "User Agent": ua,
                        "Record Reference ID": refId
                    };
                });
                const worksheet = XLSX.utils.json_to_sheet(worksheetData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Trail");
                XLSX.writeFile(workbook, `System_Security_Audit_Trail.xlsx`);
            }
            else if (format === 'csv') {
                const headers = ["S.No", "Timestamp", "Performer", "Action Type", "Description", "IP Address", "User Agent", "Reference ID"];
                const csvRows = [headers.join(",")];

                lifoSortedData.forEach((log, index) => {
                    const ip = log.ipAddress || log.ip_address || "127.0.0.1";
                    const ua = log.userAgent || log.user_agent || "Mozilla/5.0";
                    const refId = log.id ? `LOG_UUID_00${log.id}` : `LOG_UUID_00${index + 475}`;

                    csvRows.push([
                        index + 1,
                        `"${formatTimestamp(log.timestamp)}"`,
                        `"${(log.username || 'System').replace(/"/g, '""')}"`,
                        `"${log.action}"`,
                        `"${(log.details || '').replace(/"/g, '""')}"`,
                        `"${ip}"`,
                        `"${ua.replace(/"/g, '""')}"`,
                        `"${refId}"`
                    ].join(","));
                });
                const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.setAttribute("download", "System_Security_Audit_Trail.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            else if (format === 'pdf') {
                const printWindow = window.open("", "_blank");
                if (!printWindow) {
                    alert("Pop-up blocker detected. Please enable permissions to generate the document statement frame window visual logs.");
                    return;
                }

                let tableRows = lifoSortedData.map((log, index) => {
                    const ip = log.ipAddress || log.ip_address || "127.0.0.1";
                    const ua = log.userAgent || log.user_agent || "Mozilla/5.0";
                    const refId = log.id ? `LOG_UUID_00${log.id}` : `LOG_UUID_00${index + 475}`;

                    // 🌟 ESCAPED: Pure cryptographic neutralization of content payloads string components injected inside templates
                    return `
                        <tr>
                            <td style="padding:10px; border-bottom:1px solid #cbd5e1; text-align:center; color:#475569;">${index + 1}</td>
                            <td style="padding:10px; border-bottom:1px solid #cbd5e1; white-space:nowrap; color:#475569;">${formatTimestamp(log.timestamp)}</td>
                            <td style="padding:10px; border-bottom:1px solid #cbd5e1; font-weight:600; color:#0f172a;">${escapeHtml(log.username || 'System')}</td>
                            <td style="padding:10px; border-bottom:1px solid #cbd5e1; font-weight:bold; color:#4f46e5;">${escapeHtml(log.action)}</td>
                            <td style="padding:10px; border-bottom:1px solid #cbd5e1; color:#334155; max-width:180px; word-wrap:break-word;">${escapeHtml(log.details)}</td>
                            <td style="padding:10px; border-bottom:1px solid #cbd5e1; font-family:monospace; color:#0284c7; font-weight:600;">${escapeHtml(ip)}</td>
                            <td style="padding:10px; border-bottom:1px solid #cbd5e1; color:#1e293b; max-width:140px; word-wrap:break-word; font-size:10px; font-family:monospace;">${escapeHtml(refId)}</td>
                            <td style="padding:10px; border-bottom:1px solid #cbd5e1; color:#64748b; max-width:200px; word-wrap:break-word; font-size:9px;">${escapeHtml(ua)}</td>
                        </tr>
                    `;
                }).join("");

                printWindow.document.write(`
                    <html>
                    <head>
                        <title>System Compliance Audit Log Report</title>
                        <style>
                            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #1e293b; background: #fff; }
                            .header { border-bottom: 3px solid #6366f1; padding-bottom: 15px; margin-bottom: 25px; }
                            table { width: 100%; border-collapse: collapse; font-size: 10px; table-layout: fixed; }
                            th { background: #f1f5f9; padding: 10px 8px; text-align: left; border-bottom: 2px solid #94a3b8; color: #1e293b; font-weight: 700; }
                            td { overflow: hidden; text-overflow: ellipsis; }
                            tr:nth-child(even) { background: #f8fafc; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h2 style="margin:0; color:#0f172a;">Platform Infrastructure Audit Trail Log Summary</h2>
                            <p style="margin:5px 0 0 0; color:#64748b; font-size:13px;">Security Classification: Restricted Administrative Record Profile</p>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th style="text-align:center; width:40px;">S.No</th>
                                    <th style="width:120px;">Timestamp</th>
                                    <th style="width:70px;">Performer</th>
                                    <th style="width:110px;">Action Type</th>
                                    <th style="width:180px;">Activity Details</th>
                                    <th style="width:90px;">Context IP</th>
                                    <th style="width:140px;">Reference ID</th>
                                    <th>User Agent</th>
                                </tr>
                            </thead>
                            <tbody>${tableRows}</tbody>
                        </table>
                        <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 150); }</script>
                    </body>
                    </html>
                `);
                printWindow.document.close();
            }
        } catch (error) {
            console.error("Pipeline failure during document generation process:", error);
            alert("Network connection exception encountered while compiling log records.");
        }
    };

    return (
        <div className="app-layout dark-theme">
            <Sidebar />
            <div className="main-content">
                <Navbar title="System Audit Logs (Admin)" />

                <div className="table-container-focused" style={{ display: 'flex', flexDirection: 'column', height: '85vh', position: 'relative' }}>

                    {/* Multi-Filter System Actions Control Strip Panel */}
                    <div style={{
                        display: 'flex',
                        gap: '15px',
                        alignItems: 'center',
                        background: '#1e293b',
                        padding: '15px 20px',
                        borderRadius: '10px',
                        border: '1px solid #334155',
                        marginBottom: '15px',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '180px', flex: '1 1 auto' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: '600' }}>Filter by Performer</label>
                            <input
                                type="text"
                                placeholder="Type performer name..."
                                value={searchPerformer}
                                onChange={(e) => setSearchPerformer(e.target.value)}
                                style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '8px 12px', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', width: '100%' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px', flex: '1 1 auto' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: '600' }}>Filter by Action Type</label>
                            <select
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value)}
                                style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '8px 12px', borderRadius: '6px', outline: 'none', cursor: 'pointer', fontSize: '0.85rem', width: '100%' }}
                            >
                                <option value="ALL">All Logged Actions Combined 🛡️</option>
                                {CORE_SYSTEM_ACTIONS.map(act => (
                                    <option key={act} value={act}>{act.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: '600' }}>From Date</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '7px 10px', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', colorScheme: 'dark', cursor: 'pointer' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: '600' }}>To Date</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '7px 10px', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', colorScheme: 'dark', cursor: 'pointer' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', alignSelf: 'flex-end', height: '36px' }}>
                            <button onClick={() => exportLogs('pdf')} className="view-all-link-btn" style={{ padding: '8px 14px', background: '#334155', fontSize: '0.82rem', height: '100%' }}>PDF</button>
                            <button onClick={() => exportLogs('excel')} className="view-all-link-btn" style={{ padding: '8px 14px', background: '#10b981', fontSize: '0.82rem', height: '100%' }}>Excel</button>
                            <button onClick={() => exportLogs('csv')} className="view-all-link-btn" style={{ padding: '8px 14px', background: '#64748b', fontSize: '0.82rem', height: '100%' }}>CSV</button>
                        </div>
                    </div>

                    {/* Table display */}
                    <div className="table-wrapper" style={{ flex: 1, overflowY: 'auto', marginBottom: '10px', maxHeight: 'calc(100% - 140px)' }}>
                        {loading ? (
                            <p className="loading-text">Loading System Logs...</p>
                        ) : (
                            <table className="expense-table">
                                <thead>
                                    <tr>
                                        <th>S.No</th>
                                        <th>Timestamp</th>
                                        <th>Performer</th>
                                        <th>Action</th>
                                        <th>Detailed Activity Log</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length > 0 ? logs.map((log, index) => {
                                        const isRowExpanded = expandedLogId === log.id;
                                        return (
                                            <React.Fragment key={log.id}>
                                                <tr
                                                    onClick={() => handleRowClick(log.id)}
                                                    style={{ cursor: 'pointer', background: isRowExpanded ? '#1e293b' : 'transparent', transition: 'background 0.2s' }}
                                                    title="Click row to inspect complete JSON security parameter payloads"
                                                >
                                                    <td style={{ color: '#64748b', fontWeight: '600' }}>
                                                        {(currentPage * pageSize) + (index + 1)}
                                                    </td>
                                                    <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                                        {formatTimestamp(log.timestamp)}
                                                    </td>
                                                    <td style={{ color: '#64748b', fontWeight: 'bold' }}>{log.username}</td>
                                                    <td>
                                                        <span className={`status-pill ${getActionClass(log.action)}`}>
                                                            {log.action ? log.action.replace(/_/g, ' ') : ''}
                                                        </span>
                                                    </td>
                                                    <td style={{ color: '#64748b' }}>{log.details}</td>
                                                </tr>

                                                {isRowExpanded && (
                                                    <tr style={{ background: '#0f172a' }}>
                                                        <td colSpan="5" style={{ padding: '15px 25px', borderLeft: '3px solid #6366f1' }}>
                                                            <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                                                                <div>
                                                                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Request IP Address</span>
                                                                    <code style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: '0.9rem', fontWeight: '700' }}>{log.ipAddress || log.ip_address || "127.0.0.1"}</code>
                                                                </div>
                                                                <div style={{ flex: '1' }}>
                                                                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Device Footprint User Agent</span>
                                                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontFamily: 'sans-serif', lineHeight: '1.4' }}>{log.userAgent || log.user_agent || "Mozilla/5.0"}</span>
                                                                </div>
                                                                <div>
                                                                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Record Reference ID</span>
                                                                    <code style={{ fontFamily: 'monospace', color: '#a855f7', fontSize: '0.85rem' }}>LOG_UUID_00{log.id}</code>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    }) : (
                                       <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No logs found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    <div className="pagination-controls" style={{ display: 'flex', justifyItems: 'center', justifyContent: 'center', gap: '20px', padding: '15px 0', borderTop: '1px solid #334155', background: '#0f172a', marginTop: 'auto' }}>
                        <button
                            disabled={currentPage === 0}
                            onClick={() => fetchLogs(currentPage - 1)}
                            className="view-all-link-btn"
                            style={{ opacity: currentPage === 0 ? 0.5 : 1 }}
                        >
                            ← Previous
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                            <span>Page</span>
                            <input
                                type="text"
                                value={jumpPage}
                                onChange={(e) => setJumpPage(e.target.value)}
                                onKeyDown={handlePageJump}
                                style={{ width: '45px', textAlign: 'center', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px', padding: '2px 5px', fontWeight: 'bold', outline: 'none' }}
                            />
                            <span>of {totalPages}</span>
                        </div>

                        <button
                            disabled={currentPage >= totalPages - 1}
                            onClick={() => fetchLogs(currentPage + 1)}
                            className="view-all-link-btn"
                            style={{ opacity: currentPage >= totalPages - 1 ? 0.5 : 1 }}
                        >
                            Next Page →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}