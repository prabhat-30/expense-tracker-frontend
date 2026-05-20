import React, { useEffect, useState, useCallback } from "react";
import API from "../api/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../CSS/layout.css";
import "../CSS/dashboard.css";

export default function SecurityLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [jumpPage, setJumpPage] = useState("1");
    const pageSize = 10;

    // Filter control state anchors
    const [filterAction, setFilterAction] = useState("ALL");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // Dynamic list to populate distinct actions found in logs
    const [availableActions, setAvailableActions] = useState([]);

    // Synchronize page jump input field indicator when page context boundaries shift
    useEffect(() => {
        setJumpPage((currentPage + 1).toString());
    }, [currentPage]);

    // 🌟 ONE-TIME BOOTSTRAP: Securely aggregates all available filter actions directly from full dataset
    useEffect(() => {
        const structuralActionsBootstrap = async () => {
            try {
                // Request a higher capacity block view slice to extract historical action type lists accurately
                const res = await API.get(`/api/user/security-logs?page=0&size=5000&sort=timestamp,desc`);
                const contentData = res.data.content || [];
                const uniqueActions = [...new Set(contentData.map(log => log.action))].filter(Boolean);
                setAvailableActions(uniqueActions);
            } catch (error) {
                console.error("Failed to map distinct log action headers:", error);
            }
        };
        structuralActionsBootstrap();
    }, []);

    // 🌟 REFACTORED: Secured Dynamic Server-Side Pagination & Parameter-Bound Filtering
    const fetchLogs = useCallback(async (page = 0) => {
        try {
            setLoading(true);
            let queryParams = `/api/user/security-logs?page=${page}&size=${pageSize}&sort=timestamp,desc`;

            if (filterAction !== "ALL") queryParams += `&action=${encodeURIComponent(filterAction)}`;
            if (fromDate) queryParams += `&fromDate=${encodeURIComponent(fromDate)}`;
            if (toDate) queryParams += `&toDate=${encodeURIComponent(toDate)}`;

            const res = await API.get(queryParams);

            setLogs(res.data.content || []);
            setTotalPages(res.data.totalPages || 1);
            setCurrentPage(page);
        } catch (error) {
            console.error("Failed to load user security tracking logs:", error);
        } finally {
            setLoading(false);
        }
    }, [filterAction, fromDate, toDate]);

    // Track filtering criteria inputs changes with an enterprise layout debounce window
    useEffect(() => {
        const structuralDebounceDelay = setTimeout(() => {
            fetchLogs(0);
        }, 300);
        return () => clearTimeout(structuralDebounceDelay);
    }, [filterAction, fromDate, toDate, fetchLogs]);

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return "pending...";
        return new Date(timestamp).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: true
        }).toLowerCase();
    };

    const getActionClass = (action) => {
        if (!action) return 'status-pill-gray';
        const act = action.toUpperCase();
        if (act.includes('UNDO')) return 'status-pill-purple';
        if (act.includes('LOGIN')) return 'status-pill-blue';
        if (act.includes('CREATE')) return 'status-pill-green';
        if (act.includes('UPDATE')) return 'status-pill-amber';
        if (act.includes('DELETE') || act.includes('WIPE')) return 'status-pill-red';
        return 'status-pill-gray';
    };

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

    return (
        <div className="app-layout dark-theme">
            <Sidebar />
            <div className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                <Navbar title="Security Audit Logs" />

                <div className="table-container-focused" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                    {/* Filter Control Bar: Built with Action, From Date, and To Date inputs */}
                    <div style={{
                        display: 'flex',
                        gap: '15px',
                        alignItems: 'center',
                        background: '#1e293b',
                        padding: '12px 20px',
                        borderRadius: '10px',
                        border: '1px solid #334155',
                        marginBottom: '15px',
                        flexWrap: 'wrap'
                    }}>
                        {/* Action Type Dropdown */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '600' }}>Filter by Action</label>
                            <select
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value)}
                                style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '8px 12px', borderRadius: '6px', outline: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                                <option value="ALL">All Actions Combined 🛡️</option>
                                {availableActions.map(act => (
                                    <option key={act} value={act}>{act.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>

                        {/* From Date Picker Input */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '165px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '600' }}>From Date</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '7px 10px', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', colorScheme: 'dark', cursor: 'pointer' }}
                            />
                        </div>

                        {/* To Date Picker Input */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '165px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '600' }}>To Date</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '7px 10px', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', colorScheme: 'dark', cursor: 'pointer' }}
                            />
                        </div>

                        {/* Logs Counter Box Indicator */}
                        <div style={{ marginLeft: 'auto', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '8px 14px', borderRadius: '6px', color: '#d8b4fe', fontWeight: '700', fontSize: '0.82rem' }}>
                            Logs On Page: {logs.length}
                        </div>
                    </div>

                    <div className="table-header-section">
                        <p style={{ color: '#94a3b8', marginBottom: '10px', fontSize: '0.9rem' }}>
                            Account activity and security event history.
                        </p>
                    </div>

                    {/* Main Table Grid View Data Stream */}
                    <div className="table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
                        {loading ? (
                            <p className="loading-text">Loading Logs...</p>
                        ) : (
                            <table className="expense-table logs-table">
                                <thead>
                                    <tr>
                                        <th>S.No</th>
                                        <th>Timestamp</th>
                                        <th>Action</th>
                                        <th>Target / Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length > 0 ? logs.map((log, index) => {
                                        const serialNumber = (currentPage * pageSize) + (index + 1);

                                        return (
                                            <tr key={log.id || index}>
                                                <td style={{ color: '#64748b', fontWeight: '600' }}>
                                                    {serialNumber}
                                                </td>
                                                <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                                    {formatTimestamp(log.timestamp)}
                                                </td>
                                                <td>
                                                    <span className={`status-pill ${getActionClass(log.action)}`}>
                                                        {log.action ? log.action.replace(/_/g, ' ') : ''}
                                                    </span>
                                                </td>
                                                <td style={{ color: '#64748b' }}>
                                                    {log.action && log.action.toUpperCase().includes("LOGIN") ? "Self" : log.details}
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No logs match your search filters.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Standardized Pagination Controls */}
                <div className="pagination-controls" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '20px',
                    padding: '20px 0',
                    background: '#0f172a',
                    width: '100%'
                }}>
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
                           style={{
                               width: '45px',
                               textAlign: 'center',
                               background: '#1e293b',
                               border: '1px solid #334155',
                               color: 'white',
                               borderRadius: '4px',
                               padding: '2px 5px',
                               fontWeight: 'bold',
                               outline: 'none'
                           }}
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
    );
}