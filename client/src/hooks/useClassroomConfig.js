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
          setConfig({...data,lessonTopic: data.lessonTopic || "", // ✅ שומר נושא השיעור מהשרת
        });
        } catch (err) {
          console.warn("❌ No custom config found, loading default.");
        }
      }

      // ברירת מחדל אם אין custom
      if (studentTypesData.length === 0) {
        const res = await axiosInstance.get(
            `/lesson/settings?className=${encodeURIComponent(className)}`,
            { withCredentials: true }
          );
          const data = res.data;
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
          lessonTopic: data.lessonTopic,//add
        });
      }

     // ✅ English name lists (15 boys + 15 girls)
const maleNames = [
  "Adam", "Ben", "Daniel", "Eli", "Tom", "Lior", "Noam", "Omer", "David", "Yoni",
  "Liam", "Josh", "Aaron", "Ethan", "Sam"
];

const femaleNames = [
  "Sara", "Lia", "Noa", "Maya", "Dana", "Roni", "Tamar", "Yael", "Hila", "Neta",
  "Emma", "Olivia", "Sophia", "Ava", "Isabella"
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

      setLoading(false);
    }

    fetchConfig();
  }, [type, className]);

  return { config, loading };
}
