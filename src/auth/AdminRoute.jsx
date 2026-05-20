import { Navigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

export default function AdminRoute({ children }) {

    const {
        token,
        role,
        loading
    } = useAuth();

    if (loading) {
        return <h2>Loading...</h2>;
    }

    return (
        token && role === "ADMIN"
    )
        ? children
        : <Navigate to="/login" />;
}