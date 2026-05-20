import React from "react";
import { useSystemConfigs } from "../auth/useSystemConfigs"; // 🌟 Context Integration

/**
 * Shared Expense Table Component
 * @param {Array} expenses - List of expense objects
 * @param {Function} onEdit - Callback for the edit action
 * @param {Function} onDelete - Callback for the delete action
 * @param {Function} onStopRecurring - Callback to halt recurring automation
 */
const ExpenseTable = ({ expenses, onEdit, onDelete, onStopRecurring }) => {
  // 🌟 NEW: Pull currency symbols and activeCategories live from remote state context
  const { currencySymbol, activeCategories } = useSystemConfigs();

  return (
    <div className="table-wrapper">
      <table className="expense-table history-table" style={{ width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #334155' }}>
            <th style={{ padding: '12px 8px' }}>Date</th>
            <th style={{ padding: '12px 8px' }}>Title</th>
            <th style={{ padding: '12px 8px' }}>Category</th>
            <th style={{ padding: '12px 8px' }}>Type</th>
            <th style={{ padding: '12px 8px' }}>Amount</th>
            {(onEdit || onDelete) && <th style={{ padding: '12px 8px', width: '240px', textAlign: 'center' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {expenses && expenses.length > 0 ? (
            expenses.map((expense) => {
              const hasRecurring = expense.isRecurring || expense.recurring;
              const displayType = expense.type || "EXPENSE";

              // 🌟 FIXED: Match database category name against configurations to load the right icon
              const matchedCategoryObj = activeCategories?.find(
                (cat) => cat.name?.trim().toUpperCase() === expense.category?.trim().toUpperCase()
              );
              const displayIcon = matchedCategoryObj ? matchedCategoryObj.icon : "🏷️";

              return (
                <tr key={expense.id} style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={{ color: '#64748b', fontWeight: '500', padding: '12px 8px', whiteSpace: 'nowrap' }}>
                      {new Date(expense.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                      })}
                  </td>

                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '600' }}>{expense.title}</span>
                      {hasRecurring && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span title={`Recurring: ${expense.frequency}`} style={{ color: '#6366f1', fontSize: '1.1rem', cursor: 'help' }}>🔄</span>
                          <span style={{ fontSize: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)', fontWeight: '600', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                            {expense.frequency}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 🌟 FIXED: Display matching emoji alongside category name text string column */}
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'black' }}>
                      <span>{displayIcon}</span>
                      <span>{expense.category}</span>
                    </div>
                  </td>

                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase', background: displayType === 'INCOME' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: displayType === 'INCOME' ? '#10b981' : '#ef4444', border: displayType === 'INCOME' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)' }}>
                      {displayType}
                    </span>
                  </td>

                  <td
                    style={{
                      padding: '12px 8px',
                      fontWeight: '700',
                      whiteSpace: 'nowrap',
                      color: displayType === 'INCOME' ? '#10b981' : '#ef4444'
                    }}
                  >
                    {currencySymbol} {Number(expense.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {(onEdit || onDelete) && (
                    <td style={{ padding: '12px 8px', width: '240px' }}>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                        {hasRecurring && (
                          <button className="stop-repeat-btn" style={{ margin: 0, padding: '6px 12px', whiteSpace: 'nowrap' }} onClick={() => { if (window.confirm(`Are you sure you want to stop auto-repeat for "${expense.title}"?`)) { if (onStopRecurring) { onStopRecurring(expense.id); } } }}>
                            Stop Repeat
                          </button>
                        )}
                        {onEdit && <button className="edit-btn" style={{ margin: 0, padding: '6px 12px' }} onClick={() => onEdit(expense)}>Edit</button>}
                        {onDelete && <button className="delete-btn" style={{ margin: 0, padding: '6px 12px' }} onClick={() => onDelete(expense.id)}>Delete</button>}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          ) : (
            <tr><td colSpan={(onEdit || onDelete) ? 6 : 5} style={{ textAlign: "center", padding: "40px" }}>No transactions found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ExpenseTable;