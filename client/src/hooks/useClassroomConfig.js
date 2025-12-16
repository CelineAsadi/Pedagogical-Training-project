// client/src/hooks/useClassroomConfig.js
import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { useClassroomStore } from "../lib/store";
import { nanoid } from "nanoid";
import { useSearchParams } from "react-router-dom";

export function useClassroomConfig(type = "basic") {
  const [config, setConfig] = useState(null);
 //const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const className = searchParams.get("class");

  useEffect(() => {
    async function fetchConfig() {
      setLoading(true);

      const { items } = useClassroomStore.getState();
      const chairs = items.filter((i) => i.type === "chair");

      let studentTypesData = [];
      let lessonData = null; // המסמך שחוזר מ-LessonSettings

      // ===== 1) מנסים להביא הגדרות כיתה מהשרת לפי className =====
      try {
        const res = await axiosInstance.get(
          `/lesson/settings?className=${encodeURIComponent(className)}`,
          { withCredentials: true }
        );
        const data = res.data;

        // אם יש הגדרות מותאמות – נשמור
        if (data && data.studentTypes) {
          studentTypesData = data.studentTypes;
          lessonData = data;
        }

        // שומרים config ראשוני כולל נושא השיעור
        if (data) {
          setConfig({
            ...data,
            lessonTopic: data.lessonTopic || "",
          });
        }
      } catch (err) {
        console.warn("❌ No custom lesson settings found, will use defaults.");
      }

      // ===== 2) אם אין studentTypes – נופלים לברירת מחדל =====
      if (studentTypesData.length === 0) {
        // עדיין ננסה לשמור את lessonTopic אם קיים ב-data
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

        // אם אין lessonData בכלל – נבנה אחד בסיסי
        if (!lessonData) {
          lessonData = {
            classSize: 15,
            duration: 5,
            className: className,
            lessonTopic: topicFromServer,
          };
        } else {
          // מוודאים שיש ערכים סבירים
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

      // אם עדיין אין לנו lessonData (שזה מוזר) – נסיים כאן
      if (!lessonData || !lessonData._id) {
        console.error(
          "❌ useClassroomConfig: lessonData or lessonData._id is missing, cannot start session."
        );
        setLoading(false);
        return;
      }

      // ===== 3) יצירת Session אמיתי בשרת לפי lessonId =====
      // try {
      //   const sessionRes = await axiosInstance.post(
      //     "/session/start",
      //     { lessonId: lessonData._id }, // 👈 זה ה-ObjectId של LessonSettings
      //     { withCredentials: true }
      //   );

      //   if (sessionRes.data?.ok && sessionRes.data.sessionId) {
      //     setSessionId(sessionRes.data.sessionId); // ⭐ זה ה-ObjectId של Session
      //   } else {
      //     console.warn(
      //       "⚠️ session/start did not return ok=true or sessionId."
      //     );
      //   }
      // } catch (err) {
      //   console.error("❌ Error starting session:", err);
      // }

      // ===== 4) בניית רשימת תלמידים עם שמות/מגדר/כיסאות =====

      // ✅ hebrew name lists (15 boys + 15 girls)
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

      // ✅ Function to get a unique name
      function getUniqueName(list) {
        if (list.length === 0) return "NoName"; // fallback if names run out
        const index = Math.floor(Math.random() * list.length);
        const name = list[index];
        list.splice(index, 1); // remove used name
        return name;
      }

      // ✅ Ensure each student has a unique seat and name
      const students = [];
      let chairIndex = 0;

      // Make copies of the name lists so we don't empty the originals
      let availableMaleNames = [...maleNames];
      let availableFemaleNames = [...femaleNames];

      for (const t of studentTypesData) {
        for (let i = 0; i < t.count; i++) {
          if (chairIndex >= chairs.length) break; // no more seats

          const seat = chairs[chairIndex];
          const gender = Math.random() < 0.5 ? "F" : "M";
          const name =
            gender === "F"
              ? getUniqueName(availableFemaleNames)
              : getUniqueName(availableMaleNames);

          students.push({
            id: nanoid(),
            name, // 🧒 unique English name
            gender,
            behaviorProfile: t.name.toLowerCase(),
            seatId: seat.id,
          });

          chairIndex++;
        }
      }

      // ✅ עדכון בטוח ל־store (לא מוחק פריטים אחרים)
      useClassroomStore.setState((state) => ({ ...state, students }));

      // נעדכן שוב את ה-config עם studentTypes (למקרה שעודכנו)
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

  // ⭐ מחזירים גם sessionId, כדי שמעבר לזה תעבירי ל-VirtualClassroomCore
  return { config, loading };
}