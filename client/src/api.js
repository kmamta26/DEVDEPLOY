import axios from 'axios';

const api = axios.create({
    baseURL: '/api'
});

// Add token to each request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('devdeploy_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
