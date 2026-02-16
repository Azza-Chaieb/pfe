import axios from "axios";

const API_URL = "http://192.168.100.97:1337/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwt");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // console.log("API Request with Token:", config.url); // Commented out to reduce noise
    } else {
      // console.warn("API Request WITHOUT Token:", config.url);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
