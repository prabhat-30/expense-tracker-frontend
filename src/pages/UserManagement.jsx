import { useEffect, useState } from "react";
import API from "../api/api";
import Sidebar from "../components/Sidebar";
import "../CSS/layout.css";
import "../CSS/dashboard.css";
import Navbar from "../components/Navbar";

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // State trackers to hold client filtering selections
    const [searchUsername, setSearchUsername] = useState("");
    const [filterRole, setFilterRole] = useState("ALL");
    const [filterStatus, setFilterStatus] = useState("ALL");

    // Safe Guardrails & Confirmation States
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [pendingTargetUser, setPendingTargetUser] = useState(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await API.get("/admin/users");
            setUsers(res.data);
        } catch (error) {
            console.error("Failed to load user matrix:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    // Triggers the safe overlay instead of directly mutating the database
    const handleStatusToggleClick = (user) => {
        // 🌟 SAFETY GUARDRAIL: Block modal trigger if attempting to suspend the Primary Admin
        if (user.username === "admin") return;
        setPendingTargetUser(user);
        setIsConfirmModalOpen(true);
    };

    // Authenticates and dispatches the action upon administrative validation
    const executeStatusToggle = async () => {
        if (!pendingTargetUser) return;
        try {
            const action = pendingTargetUser.enabled ? "disable" : "enable";
            await API.put(`/admin/${action}/${pendingTargetUser.id}`);
            setIsConfirmModalOpen(false);
            setPendingTargetUser(null);
            fetchUsers();
        } catch (error) {
            console.error("Administrative action execution failed:", error);
        }
    };

    const handleRoleChange = async (id, role, username) => {
        // 🌟 SAFETY GUARDRAIL: Block API trigger if attempting to change Primary Admin role
        if (username === "admin") return;
        await API.put(`/admin/role/${id}`, { role });
        fetchUsers();
    };

    // Expanded filtering pipeline to include Username, Role, and Status flags
    const filteredUsers = users.filter(user => {
        const matchesUsername = (user.username || "")
            .toLowerCase()
            .includes(searchUsername.toLowerCase().trim());

        const matchesRole = filterRole === "ALL" || user.role === filterRole;

        let matchesStatus = true;
        if (filterStatus === "ACTIVE") matchesStatus = user.enabled === true;
        if (filterStatus === "DISABLED") matchesStatus = user.enabled === false;

        return matchesUsername && matchesRole && matchesStatus;
    });

    if (loading) return <div className="loading-container"><h2>Loading Users...</h2></div>;

    return (
        <div className="app-layout dark-theme">
            <Sidebar />
            <div className="main-content">
                <Navbar title="User Administration" />

                {/* Responsive Filter Console Strip Block */}
                <div style={{
                    display: 'flex',
                    gap: '15px',
                    alignItems: 'center',
                    background: '#1e293b',
                    padding: '15px 20px',
                    margin: '0 0 20px 0',
                    borderRadius: '10px',
                    border: '1px solid #334155',
                    flexWrap: 'wrap'
                }}>
                    {/* Username Search Input Box */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '220px' }}>
                        <label style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600' }}>Search Username</label>
                        <input
                            type="text"
                            placeholder="Type username..."
                            value={searchUsername}
                            onChange={(e) => setSearchUsername(e.target.value)}
                            style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '8px 12px', borderRadius: '6px', outline: 'none', fontSize: '0.9rem' }}
                        />
                    </div>

                    {/* Role Filter Selector Dropdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '160px' }}>
                        <label style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600' }}>Filter Role</label>
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '8px 12px', borderRadius: '6px', outline: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            <option value="ALL">All Roles Combined 👥</option>
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                    </div>

                    {/* Status Filter Selector Dropdown Component Node */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '160px' }}>
                        <label style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600' }}>Filter Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '8px 12px', borderRadius: '6px', outline: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            <option value="ALL">All Statuses Combined 🔄</option>
                            <option value="ACTIVE">✅ Active Only</option>
                            <option value="DISABLED">❌ Disabled Only</option>
                        </select>
                    </div>

                    {/* Counter KPI Badge Container */}
                    <div style={{ marginLeft: 'auto', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '8px 14px', borderRadius: '6px', color: '#a5b4fc', fontWeight: '700', fontSize: '0.85rem' }}>
                        Matches Found: {filteredUsers.length}
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="expense-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Current Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td style={{ fontWeight: user.username === "admin" ? "bold" : "normal" }}>
                                        {user.username} {user.username === "admin" && "👑"}
                                    </td>
                                    <td>
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value, user.username)}
                                            className="role-select"
                                            disabled={user.username === "admin"} // 🌟 FIXED: Disables role changes for Primary Admin
                                            style={{ opacity: user.username === "admin" ? 0.5 : 1, cursor: user.username === "admin" ? 'not-allowed' : 'pointer' }}
                                        >
                                            <option value="USER">USER</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>
                                    </td>
                                    <td>
                                        <span className={`status-pill ${user.enabled ? 'active' : 'blocked'}`}>
                                            {user.enabled ? "✅ Active" : "❌ Disabled"}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className={user.enabled ? "delete-btn" : "edit-btn"}
                                            onClick={() => handleStatusToggleClick(user)}
                                            disabled={user.username === "admin"} // 🌟 FIXED: Disables Block action for Primary Admin
                                            style={{ opacity: user.username === "admin" ? 0.4 : 1, cursor: user.username === "admin" ? 'not-allowed' : 'pointer' }}
                                        >
                                            {user.enabled ? "Block" : "Unblock"}
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                        No registered database accounts match your active search filter properties.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SECURE ADMINISTRATIVE OVERRIDE OVERLAY MODAL */}
            {isConfirmModalOpen && pendingTargetUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(5px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000
                }}>
                    <div style={{
                        width: '420px', background: 'linear-gradient(145deg, #1e293b, #0f172a)',
                        border: `1px solid ${pendingTargetUser.enabled ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                        padding: '30px', borderRadius: '14px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', color: '#fff'
                    }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', fontWeight: '700', color: pendingTargetUser.enabled ? '#f87171' : '#34d399' }}>
                            {pendingTargetUser.enabled ? "⚠️ Confirm Account Suspension" : "🛡️ Authorize Account Activation"}
                        </h3>
                        <p style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            Are you sure you want to change the platform status access rules for user{" "}
                            <strong style={{ color: '#fff' }}>@{pendingTargetUser.username}</strong>?
                            {pendingTargetUser.enabled
                                ? " This will block their session execution flow and suspend their credentials immediately."
                                : " This will restore their system permissions baseline instantly."}
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setIsConfirmModalOpen(false); setPendingTargetUser(null); }}
                                style={{ background: '#334155', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeStatusToggle}
                                style={{
                                    background: pendingTargetUser.enabled ? '#ef4444' : '#10b981',
                                    color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem',
                                    boxShadow: pendingTargetUser.enabled ? '0 4px 12px rgba(239, 68, 68, 0.25)' : '0 4px 12px rgba(16, 185, 129, 0.25)'
                                }}
                            >
                                Confirm Action
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}