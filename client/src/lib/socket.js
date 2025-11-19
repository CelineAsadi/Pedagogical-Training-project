import io from 'socket.io-client';
//const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const BASE = 'https://pedagogical-training-project.onrender.com' || 'http://localhost:4000';
export function createSocket(sessionId) {
  return io(BASE, { query: { sessionId } });

}
