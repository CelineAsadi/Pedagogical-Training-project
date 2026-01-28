/**
 * Classroom Configuration Hook
 * Responsible for building the full classroom configuration
 * before entering the virtual simulation.
 * Responsibilities:
 * - Load lesson settings from the server (by className)
 * - Fallback to default classroom configuration if none exists
 * - Generate students with:
 *   - Unique IDs
 *   - Gender-based Hebrew names
 *   - Behavior profiles
 *   - Seat assignments
 * - Populate the global classroom store (Zustand)
 * - Expose loading state until configuration is ready
 * Used by:
 * - VirtualClassroom (before rendering VirtualClassroomCore)
 */
import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { useClassroomStore } from "../lib/store";
import { nanoid } from "nanoid";
import { useSearchParams } from "react-router-dom";
export function useClassroomConfig(type = "basic") {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const className = searchParams.get("class");
  useEffect(() => {
    async function fetchConfig() {
      // 1️ Initialize loading state
      setLoading(true);
      // Get classroom furniture (chairs) from global store
      const { items } = useClassroomStore.getState();
      const chairs = items.filter((i) => i.type === "chair");
      let studentTypesData = [];
      let lessonData = null; 
      // 2️ Try loading lesson settings from server
      try {
        const res = await axiosInstance.get(
          `/lesson/settings?className=${encodeURIComponent(className)}`,
          { withCredentials: true }
        );
        const data = res.data;
        if (data && data.studentTypes) {
          studentTypesData = data.studentTypes;
          lessonData = data;
        }
        if (data) {
          setConfig({
            ...data,
            lessonTopic: data.lessonTopic || "",
          });
        }
      } catch (err) {
        console.warn("❌ No custom lesson settings found, will use defaults.");
      }
      // 3️ Fallback to default classroom
      if (studentTypesData.length === 0) {
        let topicFromServer = lessonData?.lessonTopic || "";
        studentTypesData = [
        { name: "Attentive", count: 3 },
        { name: "Talker", count: 2 },
        { name: "Defiant", count: 2 },
        { name: "Sensitive", count: 2 },
        { name: "Withdrawn", count: 2 },
        { name: "Conflicts", count: 1 },
        { name: "Sarcastic", count: 1 },
        { name: "Hyperactive", count: 1 },
        { name: "Neutral", count: 1 },
        ];
        if (!lessonData) {
          lessonData = {
            classSize: 15,
            duration: 5,
            className: className,
            lessonTopic: topicFromServer,
          };
        } else {
          lessonData.classSize = lessonData.classSize || 15;
          lessonData.duration = lessonData.duration || 5;
          lessonData.className = lessonData.className || className;
          lessonData.lessonTopic = topicFromServer;
        }
        setConfig({
          classSize: lessonData.classSize,
          duration: lessonData.duration,
          studentTypes: studentTypesData,
          className: lessonData.className,
          lessonTopic: lessonData.lessonTopic || "",
        });
      }
      // 4️ Validate lesson before session start
      if (!lessonData || !lessonData._id) {
        console.error(
          "❌ useClassroomConfig: lessonData or lessonData._id is missing, cannot start session."
        );
        setLoading(false);
        return;
      }
      // 5️ Name pools (Hebrew, gender-based)
      const maleNames = [
            "יואב",
            "איתי",
            "נועם",
            "אורי",
            "עומר",
            "דניאל",
            "אדם",
            "יונתן",
            "אלון",
            "רון",
            "ליאור",
            "מוחמד",
            "אריאל",
            "תומר",
            "אופק",
      ];
      const femaleNames = [
          "ריתאל",
          "מאיה",
          "יעל",
          "תמר",
          "סילין",
          "ענוד",
          "דנה",
          "שובל",
          "הדר",
          "לוסין",
          "אופיר",
          "ליה",
          "שילי",
          "טל",
          "נור",
      ];
      //  Function to get a unique name
      function getUniqueName(list) {
        if (list.length === 0) return "NoName"; // fallback if names run out
        const index = Math.floor(Math.random() * list.length);
        const name = list[index];
        list.splice(index, 1); // remove used name
        return name;
      }
      //  Ensure each student has a unique seat and name
     // 6️ Build students list
      const students = [];
      let chairIndex = 0;
      // Make copies of the name lists so we don't empty the originals
      let availableMaleNames = [...maleNames];
      let availableFemaleNames = [...femaleNames];
      for (const t of studentTypesData) {
        for (let i = 0; i < t.count; i++) {
          if (chairIndex >= chairs.length) break; // no more seats
          const seat = chairs[chairIndex];
if (Math.random() < 0.5 && availableFemaleNames.length > 0) {
  const name = getUniqueName(availableFemaleNames);
  students.push({
    id: nanoid(),
    name,
    gender: "F",
    behaviorProfile: t.name.toLowerCase(),
    seatId: seat.id,
  });
} else {
  const name = getUniqueName(availableMaleNames);
  students.push({
    id: nanoid(),
    name,
    gender: "M",
    behaviorProfile: t.name.toLowerCase(),
    seatId: seat.id,
  });
}
          chairIndex++;
        }
      }
      // 7️ Update global classroom store
      useClassroomStore.setState(() => ({ students:[] }));
      useClassroomStore.setState((state) => ({ ...state, students }));
      setConfig((prev) => ({
        ...(prev || {}),
        studentTypes: studentTypesData,
      }));
      setLoading(false);
    }
    if (className) {
      fetchConfig();
    }
  }, [type, className]);
  return { config, loading };
}