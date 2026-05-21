import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL
});

API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token");
    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.clear();
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export const getUpcomingBillings = async () => {
    try {
        const response = await API.get('/api/expenses/upcoming-billings');
        return response.data;
    } catch (error) {
        console.error("Error fetching upcoming billings:", error);
        throw error;
    }
};

export default API;