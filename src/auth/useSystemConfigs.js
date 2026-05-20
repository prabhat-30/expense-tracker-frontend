import { useState, useEffect } from "react";
import API from "../api/api";

export function useSystemConfigs() {
    const [configs, setConfigs] = useState({
        currency: "INR",
        maxFileSize: "5",
        budgetThreshold: "90"
    });
    const [activeCategories, setActiveCategories] = useState([]);
    const [loadingConfigs, setLoadingConfigs] = useState(true);

    useEffect(() => {
        const structuralBootstrapPayload = async () => {
            try {
                setLoadingConfigs(true);

                // 🌟 Simultaneously stream both global settings and active operational categories
                const [settingsRes, categoriesRes] = await Promise.all([
                    API.get("/api/public/settings"),
                    API.get("/api/categories/active")
                ]);

                if (settingsRes.data) {
                    setConfigs({
                        currency: settingsRes.data.currency || "INR",
                        maxFileSize: settingsRes.data.maxFileSize || "5",
                        budgetThreshold: settingsRes.data.budgetThreshold || "85"
                    });
                }

                setActiveCategories(categoriesRes.data || []);
            } catch (error) {
                console.error("System configuration matrix streaming aborted:", error);
            } finally {
                setLoadingConfigs(false);
            }
        };

        structuralBootstrapPayload();
    }, []);

    // Helper utility to instantly map raw currency keys to design layout symbols
    const getCurrencySymbol = () => {
        switch (configs.currency) {
            case "USD": return "$";
            case "EUR": return "€";
            default: return "₹";
        }
    };

    return {
        configs,
        activeCategories,
        loadingConfigs,
        currencySymbol: getCurrencySymbol()
    };
}