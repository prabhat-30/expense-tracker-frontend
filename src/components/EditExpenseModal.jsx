import React, { useState, useEffect } from "react";
import { useSystemConfigs } from "../auth/useSystemConfigs"; // 🌟 NEW Context Integration
import "../CSS/modal.css";

const TYPES = ["EXPENSE", "INCOME"];
const FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];

const EditExpenseModal = ({ isOpen, onClose, expense, onSave }) => {
  if (!isOpen) return null;

  // 🌟 NEW: Pull dynamic tracking categories from your live admin control panel
  const { activeCategories } = useSystemConfigs();

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    date: "",
    type: "",
    recurring: false,
    frequency: "MONTHLY",
    nextDate: "",
    includeSat: false,
    includeSun: false
  });

  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (expense) {
      setFormData({
        title: expense.title || "",
        amount: expense.amount || "",
        category: expense.category || "",
        date: expense.date || "",
        type: expense.type || "EXPENSE",
        recurring: expense.recurring || expense.isRecurring || false,
        frequency: expense.frequency || "MONTHLY",
        nextDate: expense.nextDate || expense.date || "",
        includeSat: expense.includeSat || false,
        includeSun: expense.includeSun || false
      });
      setLocalError("");
    }
  }, [expense]);

  const calculateNextDate = (freq, baseDateString) => {
    const baseDate = baseDateString ? new Date(baseDateString) : new Date();
    if (isNaN(baseDate.getTime())) return "";

    const next = new Date(baseDate);
    if (freq === "DAILY") next.setDate(next.getDate() + 1);
    else if (freq === "WEEKLY") next.setDate(next.getDate() + 7);
    else if (freq === "MONTHLY") next.setMonth(next.getMonth() + 1);
    else if (freq === "YEARLY") next.setFullYear(next.getFullYear() + 1);

    return next.toISOString().split('T')[0];
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prevData) => {
      let updatedFields = {
        ...prevData,
        [name]: type === 'checkbox' ? checked : value
      };

      if (name === "frequency" || name === "date" || (name === "recurring" && checked)) {
        updatedFields.nextDate = calculateNextDate(updatedFields.frequency, updatedFields.date);
      }

      return updatedFields;
    });
  };

  const handleUpdateClick = () => {
    setLocalError("");
    const parsedAmount = parseFloat(formData.amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setLocalError("❌ Validation Error: Amount must be a positive value greater than 0.");
        return;
    }

    onSave({
        ...formData,
        amount: parsedAmount
    });
  };



  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxHeight: '90vh', overflowY: 'auto', width: '450px' }}>
        <div className="modal-header">
            <h2>Edit Transaction</h2>
            <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-form">
          {localError && (
              <div className="modal-error" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.85rem', fontWeight: '500', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  {localError}
              </div>
          )}

          <div className="form-group">
              <label>Title</label>
              <input name="title" value={formData.title} onChange={handleChange} placeholder="Expense Title" required />
          </div>

          <div className="form-group">
              <label>Amount</label>
              <input name="amount" value={formData.amount} onChange={handleChange} type="number" step="0.01" min="0.01" placeholder="0.00" required />
          </div>

          <div className="form-group">
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleChange} required>
                  <option value="">Select Category</option>
                  {/* 🌟 FIXED DYNAMIC MAP: Pulls dynamic category lists during single item editing records */}
                  {activeCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>)}
              </select>
          </div>

          <div className="form-group">
              <label>Type</label>
              <select name="type" value={formData.type} onChange={handleChange} required>
                  <option value="">Select Type</option>
                  {TYPES.map(t => (
                      <option key={t} value={t}>
                          {t.charAt(0) + t.slice(1).toLowerCase()}
                      </option>
                  ))}
              </select>
          </div>

          <div className="form-group">
              <label>Date</label>
              <input name="date" value={formData.date} onChange={handleChange} type="date" required />
          </div>

          <div className="form-group" style={{ marginTop: '15px', padding: '15px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', cursor: 'pointer' }}>
              <input type="checkbox" id="recurring" name="recurring" checked={formData.recurring} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: `#6366f1`, cursor: 'pointer' }} />
              <span style={{ fontWeight: `500`, fontSize: `0.95rem`, color: `#301934` }}>Rotate Automation (Repeat this transaction)</span>
            </label>
          </div>

          {formData.recurring && (
            <div className="form-group animate-fade-in" style={{ marginTop: '10px' }}>
              <label style={{ color: `#708090`, fontSize: '0.85rem' }}>Frequency Schedule</label>
              <select name="frequency" value={formData.frequency} onChange={handleChange} className="modal-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#1f2937', color: 'white', border: '1px solid #475569', marginTop: '4px', outline: 'none' }}>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>

              <div style={{ marginTop: '12px' }}>
                <label style={{ color: `#708090`, fontSize: '0.85rem' }}>Next Automatic Charge Date</label>
                <input type="date" name="nextDate" className="white-calendar-icon" value={formData.nextDate} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#1f2937', color: 'white', border: '1px solid #475569', marginTop: '4px', outline: 'none' }} required />
              </div>

              {formData.frequency === "DAILY" && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '15px', paddingLeft: '2px' }}>
                  <label style={{ color: '#708090', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="checkbox" id="includeSat" name="includeSat" checked={formData.includeSat} onChange={handleChange} style={{ cursor: 'pointer' }} /> Include Saturday
                  </label>
                  <label style={{ color: '#708090', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="checkbox" id="includeSun" name="includeSun" checked={formData.includeSun} onChange={handleChange} style={{ cursor: 'pointer' }} /> Include Sunday
                  </label>
                </div>
              )}
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button className="btn-cancel" style={{ flex: 1 , height: '45px', padding: '0'}} onClick={onClose}>Cancel</button>
            <button className="submit-btn" style={{ flex: 1, height: '45px', padding: '0' }} onClick={handleUpdateClick}>Update Transaction</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditExpenseModal;