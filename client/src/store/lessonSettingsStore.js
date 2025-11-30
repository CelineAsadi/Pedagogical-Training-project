import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const lessonSettingsStore = create((set, get) => ({

  fetchUserData: async (setUser) => {
    try {
      const res = await axiosInstance.get("/auth/check");
      setUser(res.data);
    } catch (err) {
      console.error("Error loading user:", err);
    }
  },

  saveLessonSettings: async (data) => {
    try {
      // 1️⃣ Save lesson settings
      const res = await axiosInstance.post(
        "/lesson/save",
        data,
        { withCredentials: true }
      );

      toast.success(res.data.message || "Lesson saved");

      const savedLesson = res.data.lesson;
      const lessonId = savedLesson._id;
      const className = savedLesson.className;

      // 2️⃣ Start session
      const sessionRes = await axiosInstance.post(
        "/session/start",
        { lessonId },
        { withCredentials: true }
      );

      const sessionId = sessionRes.data.sessionId;

      // 3️⃣ Return classroom URL
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
