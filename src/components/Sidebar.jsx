import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Sidebar() {
    const { logout, role } = useAuth();
    const location = useLocation();

    // Helper to apply the active class highlight seamlessly
    const isActive = (path) => location.pathname === path ? "active" : "";

    return (
        <div className="sidebar">
            <div className="sidebar-logo">
                <h1>Expense<span>Tracker</span></h1>
            </div>

            <div className="sidebar-menu">
                {/* 1. Dashboard */}
                <Link
                    to={role === "ADMIN" ? "/admin" : "/user"}
                    className={isActive(role === "ADMIN" ? "/admin" : "/user")}
                >
                    <span className="icon">📊</span>
                    <span className="title">Dashboard</span>
                </Link>

                {/* =========================================================================
                    🌟 CONDITIONAL RENDER: STANDARD USER OPTIONS ONLY
                    ========================================================================= */}
                {role === "USER" && (
                    <>
                        {/* 2. Expenses */}
                        <Link to="/expenses" className={isActive("/expenses")}>
                            <span className="icon">💸</span>
                            <span className="title">Expenses</span>
                        </Link>

                        {/* 3. Bulk Entry */}
                        <Link to="/bulk-add" className={isActive("/bulk-add")}>
                            <span className="icon">📥</span>
                            <span className="title">Bulk Entry</span>
                        </Link>

                        {/* 4. Budget Planning */}
                        <Link to="/budgets" className={isActive("/budgets")}>
                             <span className="icon">🎯</span>
                             <span className="title">Budget Planning</span>
                        </Link>

                        {/* 5. Analytics */}
                        <Link to="/analytics" className={isActive("/analytics")}>
                            <span className="icon">📈</span>
                            <span className="title">Analytics</span>
                        </Link>
                    </>
                )}

                {/* =========================================================================
                    🌟 CONDITIONAL RENDER: EXCLUSIVE SYSTEM ADMIN OPTIONS ONLY (CLEANED UP)
                    ========================================================================= */}
                {role === "ADMIN" && (
                    <>
                        {/* 6. Admin User Management Controls */}

                       <Link to="/admin/health" className={isActive("/admin/health")}>
                           <span className="icon">📊</span>
                           <span className="title">System Health Monitor</span>
                       </Link>

                        <Link to="/admin/users" className={isActive("/admin/users")}>
                            <span className="icon">👥</span>
                            <span className="title">Users</span>
                        </Link>

                        {/* 7. Global App Settings Console Button */}
                        <Link to="/admin/settings" className={isActive("/admin/settings")}>
                            <span className="icon">⚙️</span>
                            <span className="title">Settings</span>
                        </Link>

                        {/* 8. Dynamic Expense Category Manager Button */}
                        <Link to="/admin/categories" className={isActive("/admin/categories")}>
                            <span className="icon">🎯</span>
                            <span className="title">Categories</span>
                        </Link>
                    </>
                )}

                {/* 9. Profile Section (Visible to both Roles) */}
                <Link to="/profile" className={isActive("/profile")}>
                    <span className="icon">👤</span>
                    <span className="title">Profile</span>
                </Link>

                {/* 10. Security & System Audit Logs */}
                <Link
                    to={role === "ADMIN" ? "/admin/logs" : "/security-logs"}
                    className={isActive(role === "ADMIN" ? "/admin/logs" : "/security-logs")}
                >
                    <span className="icon">🛡️</span>
                    <span className="title">Security Logs</span>
                </Link>
            </div>

            <div className="sidebar-footer">
                <button onClick={logout}>
                    <span className="icon" style={{ marginRight: '8px' }}>🚪</span>
                    Logout
                </button>
            </div>
        </div>
    );
}