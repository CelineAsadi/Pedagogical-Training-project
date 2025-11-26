// import io from 'socket.io-client';
// //const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';
// const BASE = 'https://pedagogical-training-project.onrender.com' || 'http://localhost:4000';
// export function createSocket(sessionId) {
//   return io(BASE, { query: { sessionId } });

// }

// import io from "socket.io-client";

// const BASE =
//   process.env.REACT_APP_API_URL ||
//   (process.env.NODE_ENV === "development"
//     ? "http://localhost:4000"
//     : "https://pedagogical-training-project.onrender.com");

// export function createSocket(sessionId) {
//   return io(BASE, {
//     query: { sessionId },
//     withCredentials: true,
//     transports: ["websocket"], // IMPORTANT for Render
//   });
// }

import io from "socket.io-client";

// AUTO-PICK BACKEND URL
const BASE =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:4000"
    : "https://pedagogical-training-project.onrender.com");

export function createSocket(sessionId) {
  return io(BASE, {
    query: { sessionId },
    withCredentials: true,
    transports: ["websocket"],
  });
}

