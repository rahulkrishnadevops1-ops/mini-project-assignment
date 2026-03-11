import axios from 'axios';

// Create axios instance with relative paths (no localhost!)
const api = axios.create({
    baseURL: '/api',
    timeout: 30000, // 30 second timeout for mining requests
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add response interceptor for global error handling
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            message: error.message
        });
        return Promise.reject(error);
    }
);

// Fetch wallet data
export const fetchData = async (walletId) => {
    const response = await api.get(`/data/${walletId}`);
    return response.data;
};

// Buy KubeCoin (with dynamic price)
export const buy = async (walletId, amount, price) => {
    const response = await api.post('/buy', {
        id: walletId,
        amount: Number(amount),
        price: Number(price),
    });
    return response.data;
};

// Sell KubeCoin (with dynamic price)
export const sell = async (walletId, amount, price) => {
    const response = await api.post('/sell', {
        id: walletId,
        amount: Number(amount),
        price: Number(price),
    });
    return response.data;
};

// Mine KubeCoin (High CPU stress test)
export const mine = async (walletId) => {
    const response = await api.post('/mine', {
        id: walletId,
    });
    return response.data;
};

// Emergency bailout / reset
export const reset = async (walletId) => {
    const response = await api.post('/reset', {
        id: walletId,
    });
    return response.data;
};

export default api;
