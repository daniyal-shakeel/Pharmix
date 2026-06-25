import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { useAuth } from "../store";
import { toast } from "sonner";

const getDeviceId = () => {
  let id = localStorage.getItem("_phx_device_id");
  if (!id) {
    id = "dev-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("_phx_device_id", id);
  }
  return id;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("_phx_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["x-device-id"] = getDeviceId();
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    const isGet = response.config.method === "get" || response.config.method === "GET";
    if (response.data && response.data.demoMode === true && !isGet) {
      toast.error(response.data.error || response.data.message || "This action is not allowed in demo mode.");
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("_phx_token");
      useAuth.getState().logout();
    }
    const isDemoMode = error.response && (error.response.data as any)?.demoMode === true;
    if (!isDemoMode) {
      let errMsg = "An unexpected error occurred.";
      if (error.response && error.response.data) {
        const data = error.response.data as any;
        errMsg = data.error || data.message || errMsg;
      } else if (error.message) {
        errMsg = error.message;
      }
      toast.error(errMsg);
    }
    return Promise.reject(error);
  },
);

export default api;
