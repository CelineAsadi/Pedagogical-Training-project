import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
/**
 * Lesson Settings Store (Zustand)
 * This store is responsible for:
 * - Loading the authenticated user's data
 * - Saving lesson/classroom configuration
 * - Creating a new session for the lesson
 * - Returning the Virtual Classroom URL
 * Used mainly in:
 * - LessonSettings page
 * - Custom classroom setup flow
 */
export const lessonSettingsStore = create((set, get) => ({
    /**
   * Fetches the currently authenticated user's data
   * and passes it to a local React state setter.
   */
  fetchUserData: async (setUser) => {
    try {
      const res = await axiosInstance.get("/auth/check");
      setUser(res.data);
    } catch (err) {
      console.error("Error loading user:", err);
    }
  },
  /**
   * Saves lesson settings, starts a session,
   * and returns the Virtual Classroom URL.
   */
  saveLessonSettings: async (data) => {
    try {
      // 1️ Save lesson settings
      const res = await axiosInstance.post(
        "/lesson/save",
        data,
        { withCredentials: true }
      );
      toast.success(res.data.message || "Lesson saved");
      const savedLesson = res.data.lesson;
      const lessonId = savedLesson._id;
      const className = savedLesson.className;
      // 2️ Start session
      const sessionRes = await axiosInstance.post(
        "/session/start",
        { lessonId },
        { withCredentials: true }
      );
      const sessionId = sessionRes.data.sessionId;
      // 3️ Return classroom URL
      return `/VirtualClassroom?type=custom&class=${encodeURIComponent(
        className
      )}&sessionId=${sessionId}`;
    } catch (err) {
      console.error("Error saving lesson settings:", err);
      toast.error(err.response?.data?.message || "Failed to save");
      return null;
    }
  },
}));