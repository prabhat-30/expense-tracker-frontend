import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Papa from "papaparse";
import { useSystemConfigs } from "../auth/useSystemConfigs";
import "../CSS/dashboard.css";

export default function BulkAddExpenses() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState("");

    // Connect system configurations to catch active category vectors
    const { activeCategories } = useSystemConfigs();

    const [rows, setRows] = useState([
        { title: "", amount: "", category: "", type: "EXPENSE", date: "" },
        { title: "", amount: "", category: "", type: "EXPENSE", date: "" },
        { title: "", amount: "", category: "", type: "EXPENSE", date: "" }
    ]);

    // ✨ HELPER: Strips currency symbols, commas, and spaces out of amounts so standard numeric cells accept them
    const normalizeAmount = (amountStr) => {
        if (!amountStr) return "";
        // Removes anything that isn't a digit, decimal point, or negative sign
        return amountStr.toString().replace(/[^0-9.-]/g, "").trim();
    };

    // ✨ HELPER: Converts complex human-written dates into strict HTML 'YYYY-MM-DD' layout
    const normalizeDate = (dateStr) => {
        if (!dateStr) return "";
        const cleanStr = dateStr.toString().trim();

        // 1. Matches standard YYYY-MM-DD (keeps it as-is)
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
            return cleanStr;
        }

        // 2. Matches DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY (e.g., 12-05-2026)
        const numericMatch = cleanStr.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/);
        if (numericMatch) {
            const [_, day, month, year] = numericMatch;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        // 3. Matches DD Month YYYY variants case-insensitively (e.g., "12 May 2026", "20-MAY-2026")
        const textMonthMatch = cleanStr.match(/^(\d{1,2})[-./\s]+([A-Za-z]{3,9})[-./\s]+(\d{4})$/);
        if (textMonthMatch) {
            const [_, day, monthText, year] = textMonthMatch;
            const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
            const monthIndex = months.findIndex(m => monthText.toLowerCase().startsWith(m));
            if (monthIndex !== -1) {
                const monthNum = (monthIndex + 1).toString().padStart(2, '0');
                return `${year}-${monthNum}-${day.padStart(2, '0')}`;
            }
        }

        // 4. Fallback to native engine parsing for alternative word structures (e.g., "May 20, 2026")
        try {
            const parsed = new Date(cleanStr);
            if (!isNaN(parsed.getTime())) {
                const year = parsed.getFullYear();
                const month = (parsed.getMonth() + 1).toString().padStart(2, '0');
                const day = parsed.getDate().toString().padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        } catch (e) {}

        return "";
    };

    const handleCsvUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim().toLowerCase(),
            complete: (results) => {
                const imported = results.data.map(item => {
                    let rawType = item.type || "EXPENSE";
                    rawType = rawType.trim().toUpperCase();
                    if (rawType !== "INCOME" && rawType !== "EXPENSE") {
                        rawType = "EXPENSE";
                    }

                    return {
                        title: item.title || item.description || "",
                        amount: normalizeAmount(item.amount), // Clean formatting tokens dynamically
                        category: item.category || "",
                        type: rawType,
                        date: normalizeDate(item.date) // Transpile layout safely to value state
                    };
                });

                setRows(imported);
                setFormError("");
            }
        });
        e.target.value = null;
    };

    const handleInputChange = (index, field, value) => {
        setRows(prevRows => prevRows.map((row, i) =>
            i === index ? { ...row, [field]: value } : row
        ));
    };

    const handleAddRow = () => {
        setRows([...rows, { title: "", amount: "", category: "", type: "EXPENSE", date: "" }]);
    };

    const handleRemoveRow = (index) => {
        setRows(prevRows => {
            if (prevRows.length === 1) {
                return [{ title: "", amount: "", category: "", type: "EXPENSE", date: "" }];
            }
            return prevRows.filter((_, i) => i !== index);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        const validData = rows
            .filter(r => r.title.trim() !== "" || r.amount !== "")
            .map(r => ({
                ...r,
                amount: Number(r.amount),
                title: r.title.trim(),
                type: r.type || "EXPENSE"
            }));

        if (validData.length === 0) {
            setFormError("Please fill out at least one baseline row with valid descriptors.");
            return;
        }

        for (let i = 0; i < validData.length; i++) {
            const entry = validData[i];
            if (!entry.title) { setFormError(`Row ${i + 1} is missing a valid title.`); return; }
            if (isNaN(entry.amount) || entry.amount <= 0) { setFormError(`Row ${i + 1} amount must be a positive number.`); return; }
            if (!entry.category) { setFormError(`Row ${i + 1} is missing a selected category.`); return; }
            if (!entry.date) { setFormError(`Row ${i + 1} must include a calendar timestamp.`); return; }
        }

        setLoading(true);
        try {
            const response = await API.post("/api/expenses/bulk", validData);
            if (response.status === 200 || response.status === 201) {
                navigate("/expenses", { replace: true });
            }
        } catch (err) {
            console.error("Bulk save operational exception:", err.response?.data || err.message);
            setFormError(err.response?.data?.message || "Operational check failed. Verify endpoint parameters.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-layout dark-theme">
            <Sidebar />
            <div className="main-content">
                <Navbar title="Bulk Entry (Incomes & Expenses)" />

                <div className="bulk-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>Save multiple entries in single click.</p>
                        <div>
                            <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleCsvUpload} />
                            <button type="button" className="view-all-link-btn" onClick={() => fileInputRef.current.click()} style={{ background: '#10b981' }}>📂 Import CSV Dataset</button>
                        </div>
                    </div>

                    {formError && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#f87171', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', fontWeight: '500' }}>
                            ⚠️ {formError}
                        </div>
                    )}

                    <div className="bulk-header-grid">
                        <span>#</span><span>Title</span><span>Amount</span><span>Type</span><span>Category</span><span>Date</span><span></span>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {rows.map((row, index) => (
                            <div key={index} className="bulk-row-grid">
                                <span className="row-number">{index + 1}</span>
                                <input className="bulk-input" type="text" placeholder="e.g. Monthly Salary or Dinner" value={row.title} onChange={(e) => handleInputChange(index, 'title', e.target.value)} />
                                <input className="bulk-input" type="number" step="0.01" style={{ color: row.type === "INCOME" ? "#34d399" : "#f87171", fontWeight: '700' }} placeholder="0.00" value={row.amount} onChange={(e) => handleInputChange(index, 'amount', e.target.value)} />

                                <select className="bulk-input" value={row.type || "EXPENSE"} onChange={(e) => handleInputChange(index, 'type', e.target.value)} style={{ fontWeight: '600' }}>
                                    <option value="EXPENSE">Expense</option>
                                    <option value="INCOME">Income</option>
                                </select>

                                <select className="bulk-input" value={row.category} onChange={(e) => handleInputChange(index, 'category', e.target.value)}>
                                    <option value="">Select Category</option>
                                    {activeCategories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                                    ))}
                                </select>

                                <input className="bulk-input" type="date" value={row.date} onChange={(e) => handleInputChange(index, 'date', e.target.value)} />
                                <button type="button" className="delete-btn" style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleRemoveRow(index)}>×</button>
                            </div>
                        ))}

                        <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
                            <button type="button" className="btn-cancel" style={{ background: '#334155', color: '#fff', fontWeight: '600' }} onClick={handleAddRow}>+ Add Row</button>
                            <button type="submit" className="view-all-link-btn" disabled={loading} style={{ fontWeight: '700' }}>{loading ? "Committing Operations..." : "Confirm & Save"}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}