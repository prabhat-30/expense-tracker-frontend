import React, { useState, useEffect } from 'react';
import API from '../api/api';
import { useSystemConfigs } from '../auth/useSystemConfigs'; // 🌟 NEW Context Hook Integration
import '../CSS/dashboard.css';

const UpcomingBillingsPanel = ({ refreshTrigger }) => {
    // 🌟 NEW: Stream global configurations and localized currency symbols live
    const { currencySymbol, loadingConfigs } = useSystemConfigs();

    const [billings, setBillings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        const fetchBillings = async () => {
            // Safety Check: Verify the token exists before hitting the protected server route
            const activeToken = localStorage.getItem("token");
            if (!activeToken) {
                console.warn("UpcomingBillingsPanel: No active security token found in storage session.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const res = await API.get("/api/expenses/upcoming-billings");

                // Flexible data assignment parser logic
                let dataArray = [];
                if (res.data) {
                    if (Array.isArray(res.data)) {
                        dataArray = res.data;
                    } else if (res.data.content && Array.isArray(res.data.content)) {
                        dataArray = res.data.content;
                    } else if (Array.isArray(res.data.recentTransactions)) {
                        dataArray = res.data.recentTransactions;
                    }
                }

                setBillings(dataArray);
            } catch (error) {
                console.error("Failed to load upcoming billings via authenticated API context:", error);
                setBillings([]);
            } finally {
                setLoading(false);
            }
        };

        // Wait to fetch data until our global configuration maps are loaded smoothly
        if (!loadingConfigs) {
            fetchBillings();
        }
    }, [refreshTrigger, loadingConfigs]);

    if (loading || loadingConfigs) return <div className="billings-loading" style={{ color: '#94a3b8', padding: '10px 0' }}>Checking upcoming bills...</div>;
    if (!billings || billings.length === 0 || isDismissed) return null;

    return (
        <div className="upcoming-billings-card" style={{
            position: 'relative',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '25px'
        }}>
            <div className="billings-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⚠️ Upcoming Recurring Bills (Next 7 Days)
                </h3>
                <button
                    onClick={() => setIsDismissed(true)}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.4rem',
                        cursor: 'pointer',
                        color: '#f59e0b',
                        fontWeight: 'bold',
                        padding: '0 5px',
                        lineHeight: '1'
                    }}
                    title="Dismiss for now"
                >
                    ×
                </button>
            </div>
            <ul className="billings-list" style={{ listStyle: 'none', padding: 0, margin: '15px 0 0 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {billings.map((bill) => (
                    <li key={bill.id} className="billing-item" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#1e293b',
                        padding: '12px 15px',
                        borderRadius: '8px',
                        border: '1px solid #334155'
                    }}>
                        <div className="billing-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className="billing-title" style={{ color: '#f8fafc', fontWeight: '600' }}>{bill.title}</span>
                            <span className="billing-category" style={{ color: '#6366f1', fontSize: '0.8rem', background: 'rgba(99, 102, 241, 0.15)', padding: '2px 8px', borderRadius: '12px', width: 'fit-content', fontWeight: '600' }}>{bill.category}</span>
                        </div>
                        <div className="billing-details" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            {/* 🌟 FIXED: Placed currencySymbol here dynamically instead of hardcoded Indian Rupee */}
                            <span className="billing-amount" style={{ color: '#f43f5e', fontWeight: '700' }}>{currencySymbol}{Number(bill.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            <span className="billing-date" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                Due: {new Date(bill.nextDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default UpcomingBillingsPanel;