import axios from "axios";

//export const axiosInstance = axios.create({
   // baseURL:"http://localhost:3001/api",
   // withCredentials:true
//});
//change
// client/src/lib/axios.js

// שם לב: שמנו /api ב-baseURL כדי שהקריאות שלך כמו '/auth/Login'
// יהפכו בפועל ל: http://localhost:4000/api/auth/Login

export const axiosInstance = axios.create({
  baseURL:import.meta.env.MODE === "development" ? "http://localhost:4000/api" : "/api",
  withCredentials: true,
});

// גם ברירת מחדל וגם בשם — כדי שלא תצטרך/י לשנות ייבוא בקבצים אחרים
// export default axiosInstance;
// export { axiosInstance };