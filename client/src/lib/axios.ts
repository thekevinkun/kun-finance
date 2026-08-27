import axios, { AxiosInstance } from "axios";

// 1. Define base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", // Default to localhost if env variable is not set
  timeout: 10000, // 10 seconds timeout,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// 2. Add request interceptor
// Axios lets you register a function that runs on every request (or response) before it reaches your code.
// Think of it as a checkpoint the request passes through automatically — you write the logic once, and
// every single API call benefits without you repeating yourself in every function that uses apiClient.
// Right now, if you call apiClient.get('/forecasts'), no Authorization header goes out — the server has no idea who's asking.
// Once Phase 2 exists, every protected route requires a JWT in that header. Without an interceptor, you'd have to manually
// attach the token in every single API call across your entire app — dozens of places, each one a chance to forget it.
apiClient.interceptors.request.use(
  (config) => {
    // You can add authorization headers or other custom logic here
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// TODO(Phase 2): move to src/lib/auth.ts or the Zustand auth store once auth exists
// Helper function to get the access token from local storage or any other storage mechanism
function getAccessToken(): string | null {
  return null;
}

// 3. Export the configured Axios instance
export default apiClient;
