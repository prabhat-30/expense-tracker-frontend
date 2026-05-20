import React, { useState } from "react";
import API from "../api/api";
import { useSystemConfigs } from "../auth/useSystemConfigs"; // 🌟 NEW Context Integration
import "../CSS/modal.css";

export default function SetBudgetModal({ isOpen, onClose, onBudgetSaved }) {
    // 🌟 NEW: Loading user category metrics from remote context hook
    const { activeCategories, currencySymbol } = useSystemConfigs();
    const [formData, setFormData] = useState({ category: "", limitAmount: "" });

    if (!isOpen) return null;

    const handleSubmit = async () => {
        try {
            await API.post("/api/budgets", formData);
            onBudgetSaved();
            onClose();
        } catch (error) {
            console.error("Error saving budget:", error);
            alert("Failed to save budget. Check console for details.");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    {/* 🌟 FIXED: Tracks active currency standard automatically */}
                    <h2>Set Monthly Budget Limits ({currencySymbol})</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-form">
                    <div className="form-group">
                        <label>Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                        >
                            <option value="">Select Target Category</option>
                            {/* 🌟 FIXED DYNAMIC MAP: Uses dynamic active options for custom limits assignment */}
                            {activeCategories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Monthly Limit Max Amount</label>
                        <input
                            type="number"
                            value={formData.limitAmount}
                            onChange={(e) => setFormData({...formData, limitAmount: e.target.value})}
                            placeholder="e.g. 5000"
                        />
                    </div>
                    <div className="modal-actions">
                        <button className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button className="submit-btn" onClick={handleSubmit}>Save Budget</button>
                    </div>
                </div>
            </div>
        </div>
    );
}