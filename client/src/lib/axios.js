import axios from "axios";

//export const axiosInstance = axios.create({
   // baseURL:"http://localhost:3001/api",
   // withCredentials:true
//});
//change
// client/src/lib/axios.js

// שם לב: שמנו /api ב-baseURL כדי שהקריאות שלך כמו '/auth/Login'
// יהפכו בפועל ל: http://localhost:4000/api/auth/Login

const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:4000/api" // local backend during development
    : "/api"; // in production → same domain on Render

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default axiosInstance;

// גם ברירת מחדל וגם בשם — כדי שלא תצטרך/י לשנות ייבוא בקבצים אחרים
// export default axiosInstance;
// export { axiosInstance };