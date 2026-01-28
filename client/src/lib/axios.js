/**
 * API base URL configuration
 * - In development:
 *   The frontend runs separately from the backend,
 *   so requests are sent to the local Express server.
 * - In production:
 *   The frontend and backend are served from the same domain,
 *   so API requests are routed internally through `/api`.
 */
import axios from "axios";
const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:4000/api" // local backend during development
    : "/api"; // in production → same domain on Render
/**
 * Axios instance
 * Centralized HTTP client used across the frontend for:
 * - authentication
 * - lesson/session management
 * - feedback & summaries
 * `withCredentials: true` ensures cookies (JWT/session)
 * are included in every request.
 */
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});
export default axiosInstance;