import { createContext, useContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(undefined);
    const [role, setRole] = useState(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storedRole = localStorage.getItem("role");
        if (storedToken) {
            setToken(storedToken);
            setRole(storedRole || "USER");
        } else {
            setToken(null);
            setRole(null);
        }
        setLoading(false);
    }, []);

    const login = (data) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role || "USER");
        setToken(data.token);
        setRole(data.role || "USER");
    };

    const logout = () => {
        localStorage.clear();
        setToken(null);
        setRole(null);
        window.location.assign("/login");
    };

    return (
        <AuthContext.Provider value={{ token, role, login, logout, loading, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);