import { useState } from "react";
import API from "../api/api";
import { useSystemConfigs } from "../auth/useSystemConfigs"; // 🌟 NEW Context Integration
import "../CSS/modal.css";

export default function AddExpenseModal({ isOpen, onClose, onExpenseAdded }) {
    if (!isOpen) return null;

    // 🌟 NEW: Fetch operational configurations live from our master remote tracker
    const { activeCategories } = useSystemConfigs();

    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState("");
    const [type, setType] = useState("EXPENSE");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState("MONTHLY");
    const [includeSat, setIncludeSat] = useState(false);
    const [includeSun, setIncludeSun] = useState(false);

    const calculateInitialNextDate = (freq, startDate) => {
        const baseDate = startDate ? new Date(startDate) : new Date();
        if (isNaN(baseDate.getTime())) return null;
        const next = new Date(baseDate);
        if (freq === "DAILY") next.setDate(next.getDate() + 1);
        else if (freq === "WEEKLY") next.setDate(next.getDate() + 7);
        else if (freq === "MONTHLY") next.setMonth(next.getMonth() + 1);
        else if (freq === "YEARLY") next.setFullYear(next.getFullYear() + 1);
        return next.toISOString().split('T')[0];
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            setError("❌ Validation Error: Amount must be a positive number greater than 0.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                title,
                amount: numericAmount,
                category,
                date,
                type,
                recurring: isRecurring,
                isRecurring: isRecurring,
                frequency: isRecurring ? frequency : null,
                nextDate: isRecurring ? calculateInitialNextDate(frequency, date) : null,
                includeSat: isRecurring && frequency === "DAILY" ? includeSat : false,
                includeSun: isRecurring && frequency === "DAILY" ? includeSun : false
            };

            await API.post("/api/expenses", payload);

            setTitle("");
            setAmount("");
            setCategory("");
            setDate("");
            setType("EXPENSE");
            setIsRecurring(false);
            setFrequency("MONTHLY");
            setIncludeSat(false);
            setIncludeSun(false);

            onExpenseAdded();
            onClose();
        } catch (err) {
            console.error("Add Expense Error Output:", err);
            if (err.response && err.response.data) {
                const apiMessage = typeof err.response.data === 'string'
                    ? err.response.data
                    : (err.response.data.message || JSON.stringify(err.response.data));
                setError(`⚠️ Server rejection: ${apiMessage}`);
            } else {
                setError("Failed to add transaction due to a network error.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h2>Add New Transaction</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                {error && <div className="modal-error" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.85rem', fontWeight: '500', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{error}</div>}

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Transaction Type</label>
                        <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                            <label style={{ display: 'flex', gap: '5px', cursor: 'pointer', color: '#ef4444' }}>
                                <input type="radio" name="type" value="EXPENSE" checked={type === "EXPENSE"} onChange={(e) => setType(e.target.value)} /> Expense
                            </label>
                            <label style={{ display: 'flex', gap: '5px', cursor: 'pointer', color: '#10b981' }}>
                                <input type="radio" name="type" value="INCOME" checked={type === "INCOME"} onChange={(e) => setType(e.target.value)} /> Income
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Title</label>
                        <input type="text" placeholder="eg: Monthly Salary or Dinner" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label>Amount</label>
                        <input type="number" step="0.01" min="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label>Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} required >
                             <option value="">Select Category</option>
                             {/* 🌟 FIXED DYNAMIC MAP: Loops through your dynamic remote dashboard categories with active icons */}
                             {activeCategories.map(cat => (
                                 <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                             ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Date</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                    </div>

                    <div className="form-group" style={{ marginTop: '15px', padding: '15px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', cursor: 'pointer' }}>
                            <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: `#6366f1`, cursor: 'pointer' }} />
                            <span style={{ fontWeight: `500`, fontSize: `0.95rem`, color: `#301934` }}>Rotate Automation (Repeat this transaction)</span>
                        </label>
                    </div>

                    {isRecurring && (
                        <div className="form-group animate-fade-in" style={{ marginTop: '10px' }}>
                            <label style={{ color: `#708090`, fontSize: '0.85rem' }}>Frequency Schedule</label>
                            <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="modal-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#1f2937', color: 'white', border: '1px solid #475569', marginTop: '4px', outline: 'none' }}>
                                <option value="DAILY">Daily</option>
                                <option value="WEEKLY">Weekly</option>
                                <option value="MONTHLY">Monthly</option>
                                <option value="YEARLY">Yearly</option>
                            </select>

                            {frequency === "DAILY" && (
                                <div style={{ marginTop: '12px', display: 'flex', gap: '15px', paddingLeft: '2px' }}>
                                    <label style={{ color: '#708090', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <input type="checkbox" checked={includeSat} onChange={(e) => setIncludeSat(e.target.checked)} style={{ cursor: 'pointer' }} /> Include Saturday
                                    </label>
                                    <label style={{ color: '#708090', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <input type="checkbox" checked={includeSun} onChange={(e) => setIncludeSun(e.target.checked)} style={{ cursor: 'pointer' }} /> Include Sunday
                                    </label>
                                </div>
                            )}
                        </div>
                    )}

                    <button type="submit" className="submit-btn" disabled={loading} style={{ marginTop: '25px', height: '45px' }}>
                        {loading ? "Processing..." : `Add ${type === "INCOME" ? "Income" : "Expense"}`}
                    </button>
                </form>
            </div>
        </div>
    );
}