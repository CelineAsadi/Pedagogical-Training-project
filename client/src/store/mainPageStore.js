import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const mainPageStore = create((set, get) => ({

  fetchUser: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      return res.data;                // return user to UI
    } catch (err) {
      console.error("Error fetching user:", err);
      return null;
    }
  },

  startBasicLesson: async (lessonTopic) => {
    try {
      // 1️⃣ Create lesson on server
      const lessonRes = await axiosInstance.post(
        "/lesson/basic",
        { lessonTopic },
        { withCredentials: true }
      );

      const { lessonId, className } = lessonRes.data;

      // 2️⃣ Create real session
      const sessionRes = await axiosInstance.post(
        "/session/start",
        { lessonId },
        { withCredentials: true }
      );

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

  fetchUserClasses: async (page = 1, limit = 5) => {
    const res = await axiosInstance.get(`/lesson/all?page=${page}&limit=${limit}`);
    return res.data; // contains { classes, hasMore, page, totalPages }
  },
  fetchClassSummaries: async (classId) => {
  const res = await axiosInstance.get(`/lesson/${classId}/with-summaries`);
  return res.data;  // contains { lesson, totalSessions, sessions[] }
},
fetchLastThree: async (sessionId) => {
  const res = await axiosInstance.get(`/session/last-three/${sessionId}`);
  return res.data;
},


}));