import React, { useState, useEffect } from "react";
import API from "../api/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import EditExpenseModal from "../components/EditExpenseModal";
import { useSystemConfigs } from "../auth/useSystemConfigs"; // 🌟 Context Integration
import "../CSS/dashboard.css";

export default function AllExpenses() {
    // Stream remote configs, active categories, and active currency layout
    const { activeCategories, currencySymbol } = useSystemConfigs();

    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [jumpPage, setJumpPage] = useState("1");

    const [category, setCategory] = useState("");
    const [keyword, setKeyword] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [recurringFilter, setRecurringFilter] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);
    const [lastDeletedExpense, setLastDeletedExpense] = useState(null);
    const [showUndoBanner, setShowUndoBanner] = useState(false);

    // 🌟 NEW: Track which specific row is toggled for an inline automation stop prompt
    const [activeStopPromptId, setActiveStopPromptId] = useState(null);

    const fetchExpenses = async () => {
        try {
            setLoading(true);

            // 1. Unified Route Layout Dispatcher
            let url = `/api/expenses?page=${page}&size=10`;

            if (startDate && endDate) {
                url = `/api/expenses/date-between?start=${startDate}&end=${endDate}&page=${page}&size=10`;
            } else if (category || keyword || typeFilter) {
                url = `/api/expenses/search/advanced?page=${page}&size=10`;
                if (category) url += `&category=${encodeURIComponent(category)}`;
                if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
                if (typeFilter) url += `&type=${typeFilter}`;
            }

            const res = await API.get(url);
            let dataList = [];

            if (res.data) {
                if (res.data.content && Array.isArray(res.data.content)) {
                    dataList = res.data.content;
                    setTotalPages(res.data.totalPages || 1);
                } else if (Array.isArray(res.data)) {
                    dataList = res.data;
                    setTotalPages(1);
                }
            }

            // 2. Automation Schedule Filter Verification Mapping
            let filteredResults = dataList;

            if (recurringFilter) {
                const checkRecurring = recurringFilter === "RECURRING";
                filteredResults = filteredResults.filter(item => {
                    const freqString = item.frequency ? item.frequency.toString().trim().toUpperCase() : "";
                    const isItemRecurring = item.recurring === true || item.isRecurring === true || (freqString !== "" && freqString !== "NONE");
                    return isItemRecurring === checkRecurring;
                });
            }

            setExpenses(filteredResults);
            setError("");
        } catch (err) {
            console.error("Failed to fetch records:", err);
            setError("Could not retrieve transactions dataset parameters safely.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
        setJumpPage((page + 1).toString());
        setActiveStopPromptId(null); // Clear prompt trackers if parameters shift
    }, [page, category, keyword, typeFilter, recurringFilter, startDate, endDate]);

    const handlePageJumpSubmit = () => {
        const parsedPage = parseInt(jumpPage, 10);
        if (!isNaN(parsedPage) && parsedPage >= 1 && parsedPage <= totalPages) {
            setPage(parsedPage - 1);
        } else {
            setJumpPage((page + 1).toString());
        }
    };

    const requestDelete = (expenseItem) => {
        setExpenseToDelete(expenseItem);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!expenseToDelete) return;
        try {
            await API.delete(`/api/expenses/${expenseToDelete.id}`);
            setLastDeletedExpense(expenseToDelete);
            setShowUndoBanner(true);
            setIsDeleteModalOpen(false);
            setExpenseToDelete(null);
            setTimeout(() => setShowUndoBanner(false), 8000);
            fetchExpenses();
        } catch (err) {
            console.error("Delete operation failure:", err);
            alert("Failed to delete the selected transaction.");
        }
    };

    const handleUndoDelete = async () => {
        if (!lastDeletedExpense) return;
        try {
            const restorePayload = { ...lastDeletedExpense, undo: true };
            await API.post("/api/expenses", restorePayload);
            setShowUndoBanner(false);
            setLastDeletedExpense(null);
            fetchExpenses();
        } catch (err) {
            console.error("Undo operation crash:", err);
            alert("Could not restore deleted record parameters safely.");
        }
    };

    const openEditModal = (expenseItem) => {
        setSelectedExpense(expenseItem);
        setIsEditOpen(true);
    };

    const handleSaveChanges = async (updatedFormData) => {
        try {
            await API.put(`/api/expenses/${selectedExpense.id}`, updatedFormData);
            setIsEditOpen(false);
            fetchExpenses();
        } catch (err) {
            console.error("Update failure:", err);
            alert("Could not update transaction metrics parameters.");
        }
    };

    const handleStopRepeat = async (id) => {
        try {
            await API.put(`/api/expenses/${id}/stop-recurring`);
            setActiveStopPromptId(null);
            fetchExpenses();
        } catch (err) {
            console.error("Stop automation failure:", err);
            alert("Failed to stop automation rules sequence.");
        }
    };

    return (
        <div className="app-layout dark-theme">
            <Sidebar />
            <div className="main-content">
                <Navbar title="Expense & Income History" />
                <div className="bulk-container">

                    {showUndoBanner && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#06b6d4', color: '#fff', padding: '12px 20px', borderRadius: '8px', marginBottom: '20px', fontWeight: '600' }}>
                            <span>🗑️ Transaction "{lastDeletedExpense?.title}" was deleted.</span>
                            <button onClick={handleUndoDelete} style={{ background: '#fff', color: '#06b6d4', border: 'none', padding: '6px 14px', borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}>UNDO</button>
                        </div>
                    )}

                    {/* Filter Bar Controls Header Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px', background: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1', minWidth: '200px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>Search Title</label>
                                <input type="text" placeholder="Search keyword..." value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(0); }} style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #475569', borderRadius: '6px', color: '#fff', outline: 'none' }} />
                            </div>

                            <div style={{ width: '180px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>Category</label>
                                <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(0); }} style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #475569', borderRadius: '6px', color: '#fff', outline: 'none' }}>
                                    <option value="">All Categories</option>
                                    {activeCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>)}
                                </select>
                            </div>

                            <div style={{ width: '160px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>Transaction Type</label>
                                <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #475569', borderRadius: '6px', color: '#fff', outline: 'none' }}>
                                    <option value="">All Types</option>
                                    <option value="EXPENSE">Expense 💸</option>
                                    <option value="INCOME">Income 💰</option>
                                </select>
                            </div>

                            <div style={{ width: '180px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>Automation Schedule</label>
                                <select value={recurringFilter} onChange={(e) => { setRecurringFilter(e.target.value); setPage(0); }} style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #475569', borderRadius: '6px', color: '#fff', outline: 'none' }}>
                                    <option value="">All Transactions</option>
                                    <option value="RECURRING">🔄 Recurring Only</option>
                                    <option value="SINGLE">📍 Single Entries</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>From Date</label>
                                <input type="date" className="white-calendar-icon" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(0); }} style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #475569', borderRadius: '6px', color: '#fff', outline: 'none', cursor: 'pointer' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>To Date</label>
                                <input type="date" className="white-calendar-icon" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(0); }} style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #475569', borderRadius: '6px', color: '#fff', outline: 'none', cursor: 'pointer' }} />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ color: '#94a3b8', padding: '20px', textAlign: 'center' }}>Loading ledger database metrics...</div>
                    ) : expenses.length === 0 ? (
                        <div style={{ color: '#64748b', padding: '40px', textAlign: 'center', background: '#1e293b', borderRadius: '8px' }}>No transaction matches found.</div>
                    ) : (
                        <>
                            {/* NEW: Wrapper container for horizontal scrolling on mobile */}
                            <div style={{ overflowX: 'auto', width: '100%', paddingBottom: '10px' }}>
                                <div style={{ minWidth: '1000px' }}>

                                    <div className="bulk-header-grid" style={{ gridTemplateColumns: '50px 2fr 1fr 1fr 1.5fr 1.5fr 3.2fr' }}>
                                        <span>#</span><span>Title</span><span>Amount</span><span>Type</span><span>Category</span><span>Date</span><span style={{ textAlign: 'center' }}>Actions</span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                                        {expenses.map((row, index) => {
                                            const isRowRecurring = row.recurring || row.isRecurring || false;

                                            const matchedCategoryObj = activeCategories.find(
                                                (cat) => cat.name?.trim().toUpperCase() === row.category?.trim().toUpperCase()
                                            );
                                            const displayIcon = matchedCategoryObj ? matchedCategoryObj.icon : "🏷️";

                                            return (
                                                <div key={row.id || index} className="bulk-row-grid" style={{ gridTemplateColumns: '50px 2fr 1fr 1fr 1.5fr 1.5fr 3.2fr', alignItems: 'center', background: '#1e293b', padding: '12px 10px', borderRadius: '6px' }}>
                                                    <span className="row-number">{page * 10 + index + 1}</span>
                                                    <span style={{ color: '#fff', fontWeight: '500' }}>{row.title}</span>

                                                    {/* 🌟 FIXED: Implemented en-IN formatting with maximum/minimum bounds */}
                                                    <span style={{ color: row.type?.toUpperCase() === "INCOME" ? "#34d399" : "#f87171", fontWeight: '700', whiteSpace: 'nowrap' }}>
                                                        {currencySymbol} {Number(row.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>

                                                    <span style={{ fontSize: '0.8rem', fontWeight: '600', padding: '2px 6px', borderRadius: '4px', background: row.type?.toUpperCase() === "INCOME" ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', color: row.type?.toUpperCase() === "INCOME" ? '#34d399' : '#f87171', width: 'fit-content' }}>{row.type}</span>

                                                    <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span>{displayIcon}</span>
                                                        <span>{row.category}</span>
                                                    </span>

                                                    <span style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>{new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>

                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                                        {/* 🌟 ENTERPRISE UPGRADE: Dynamic design-compliant inline prompt safely avoiding thread blocking window dialogue controls */}
                                                        {activeStopPromptId === row.id ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245,158,11,0.1)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.3)' }}>
                                                                <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '600' }}>Stop Repeat?</span>
                                                                <button type="button" style={{ background: '#34d399', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }} onClick={() => handleStopRepeat(row.id)}>Yes</button>
                                                                <button type="button" style={{ background: '#475569', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }} onClick={() => setActiveStopPromptId(null)}>No</button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {isRowRecurring && (
                                                                    <button type="button" className="action-btn" style={{ background: '#0284c7', color: '#fff', fontSize: '12px', padding: '8px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }} onClick={() => setActiveStopPromptId(row.id)}>
                                                                        Stop Repeat
                                                                    </button>
                                                                )}
                                                                <button type="button" className="action-btn" style={{ background: '#4f46e5', color: '#fff', fontSize: '12px', padding: '8px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }} onClick={() => openEditModal(row)}>Edit</button>
                                                                <button type="button" className="action-btn" style={{ background: '#dc2626', color: '#fff', fontSize: '12px', padding: '8px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }} onClick={() => requestDelete(row)}>Delete</button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                </div>
                            </div>

                            {totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '25px' }}>
                                    <button disabled={page === 0} className="btn-cancel" style={{ margin: 0, padding: '6px 12px', background: '#475569', color: 'white', opacity: page === 0 ? 0.5 : 1 }} onClick={() => setPage(prev => Math.max(prev - 1, 0))}>Previous</button>
                                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>Page</span>
                                        <input type="text" value={jumpPage} onChange={(e) => setJumpPage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePageJumpSubmit()} onBlur={handlePageJumpSubmit} style={{ width: '45px', textAlign: 'center', padding: '4px 2px', background: '#0f172a', border: '1px solid #475569', borderRadius: '4px', color: '#ffff', fontWeight: '600', outline: 'none' }} />
                                        <span>of {totalPages}</span>
                                    </div>
                                    <button disabled={page >= totalPages - 1} className="btn-cancel" style={{ margin: 0, padding: '6px 12px', background: '#475569', color: 'white', opacity: page >= totalPages - 1 ? 0.5 : 1 }} onClick={() => setPage(prev => Math.min(prev + 1, totalPages - 1))}>Next</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {isDeleteModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-container" style={{ width: '380px', padding: '25px', background: '#1e293b', border: '1px solid #334155' }}>
                        <h3 style={{ color: '#fff', margin: '0 0 10px 0' }}>Confirm Deletion</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 20px 0', lineHeight: '1.5' }}>Are you sure you want to permanently delete <strong>"{expenseToDelete?.title}"</strong>?</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button className="btn-cancel" style={{ background: '#334155', color: '#fff', padding: '8px 16px', margin: 0 }} onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                            <button style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }} onClick={handleConfirmDelete}>Confirm Delete</button>
                        </div>
                    </div>
                </div>
            )}
            <EditExpenseModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} expense={selectedExpense} onSave={handleSaveChanges} />
        </div>
    );
}
