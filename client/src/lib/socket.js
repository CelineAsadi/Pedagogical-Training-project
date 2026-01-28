import io from "socket.io-client";
/**
 * Socket.IO Client Configuration
 * Responsible for creating a real-time WebSocket
 * connection between the client and the backend.
 * The socket is used for:
 * - Receiving student disruptions
 * - Sending lesson lifecycle events
 * - Synchronizing student movement
 */
// Automatically select backend URL:
// - REACT_APP_API_URL → custom deployment
// - localhost in development
// - Render backend in production
const BASE =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:4000"
    : "https://pedagogical-training-project.onrender.com");

/**
 * createSocket
 * Creates a socket connection for a specific session.
 * The sessionId is passed as a query param so the server
 * can:
 * - Join the client to the correct lesson room
 * - Emit disruptions only to relevant participants
 */
export function createSocket(sessionId) {
  return io(BASE, {
    query: { sessionId },// Identify lesson session
    withCredentials: true, // Send auth cookies
    transports: ["websocket"],// Force WebSocket (no polling)
  });
}