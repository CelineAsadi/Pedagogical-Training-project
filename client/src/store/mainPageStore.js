import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
/**
 * Main Page Store (Zustand)
 * This store handles all data used on the Main Page:
 * - Fetching authenticated user info
 * - Starting a basic (quick) lesson
 * - Loading user classes with pagination
 * - Fetching lesson summaries and recent sessions
 * Used mainly in:
 * - MainPage dashboard
 * - Lesson history & summaries views
 */
export const mainPageStore = create((set, get) => ({
    /**
   * Fetch the currently authenticated user
   * Used to display user info on the main page
   */
  fetchUser: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      return res.data;                // return user to UI
    } catch (err) {
      console.error("Error fetching user:", err);
      return null;
    }
  },
  /**
   * Starts a basic lesson flow (quick start).
   */
  startBasicLesson: async (lessonTopic) => {
    try {
      // 1️ Create lesson on server
      const lessonRes = await axiosInstance.post(
        "/lesson/basic",
        { lessonTopic },
        { withCredentials: true }
      );
      const { lessonId, className } = lessonRes.data;
      // 2️ Create real session
      const sessionRes = await axiosInstance.post(
        "/session/start",
        { lessonId },
        { withCredentials: true }
      );
      // 3️ Return data needed to enter classroom
      return {
        sessionId: sessionRes.data.sessionId,
        className,
      };
    } catch (err) {
      console.error("❌ Error starting basic session:", err);
      toast.error("Could not start your session.");
      return null;
    }
  },
   // Fetch all user classes with pagination
  fetchUserClasses: async (page = 1, limit = 5) => {
    const res = await axiosInstance.get(`/lesson/all?page=${page}&limit=${limit}`);
    return res.data; // contains { classes, hasMore, page, totalPages }
  },
   //Fetch a single class with all its session summaries
  fetchClassSummaries: async (classId) => {
  const res = await axiosInstance.get(`/lesson/${classId}/with-summaries`);
  return res.data;  // contains { lesson, totalSessions, sessions[] }
},
   //Fetch the last three sessions related to a given session
   //Used for progress graphs and comparison
fetchLastThree: async (sessionId) => {
  const res = await axiosInstance.get(`/session/last-three/${sessionId}`);
  return res.data;
},
}));