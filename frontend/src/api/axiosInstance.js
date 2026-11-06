import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json"
  }
});

// Attach the JWT to every outgoing request, if present.
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("paytab_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized handling for expired/invalid tokens and network failures.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== "/login") {
      localStorage.removeItem("paytab_token");
      localStorage.removeItem("paytab_user");
      window.location.href = "/login";
    }
    if (!error.response) {
      // No response at all means a network failure (backend down, no
      // connectivity), not a server-side error - worth distinguishing so
      // calling code can show a clearer message.
      error.isNetworkError = true;
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
