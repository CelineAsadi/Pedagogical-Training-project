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
      const { items } = useClassroomStore.getState();
      const chairs = items.filter((i) => i.type === "chair");

      let studentTypesData = [];

      if (type === "custom") {
        try {
          const res = await axiosInstance.get(
            `/lesson/settings?className=${encodeURIComponent(className)}`,
            { withCredentials: true }
          );
          const data = res.data;
          if (data && data.studentTypes) studentTypesData = data.studentTypes;
          setConfig(data);
        } catch (err) {
          console.warn("❌ No custom config found, loading default.");
        }
      }

      // ברירת מחדל אם אין custom
      if (studentTypesData.length === 0) {
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
        setConfig({
          classSize: 15,
          duration: 5,
          studentTypes: studentTypesData,
          className,
        });
      }

      // ✅ נוודא שלכל תלמיד יש מושב ייחודי
      const students = [];
      let chairIndex = 0;

      for (const t of studentTypesData) {
        for (let i = 0; i < t.count; i++) {
          if (chairIndex >= chairs.length) break; // אין יותר מושבים

          const seat = chairs[chairIndex];
          students.push({
            id: nanoid(),
            name: `${t.name} ${i + 1}`,
            gender: Math.random() < 0.5 ? "F" : "M",
            behaviorProfile: t.name.toLowerCase(),
            seatId: seat.id,
          });
          chairIndex++;
        }
      }

      // ✅ עדכון בטוח ל־store (לא מוחק פריטים אחרים)
      useClassroomStore.setState((state) => ({ ...state, students }));

      setLoading(false);
    }

    fetchConfig();
  }, [type, className]);

  return { config, loading };
}
