// Global speaking registry (runtime only, not React state)
const speakingState = {}; // { studentId: text }
const listeners = new Set();
// Subscribe — StudentAvatar will listen to immediate updates
export function subscribeToSpeakingMap(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
// Set text instantly (bubble appears instantly)
export function setSpeaking(studentId, text) {
  speakingState[studentId] = text;
  for (const cb of listeners) cb(studentId, text);
}
// Clear bubble
export function clearSpeaking(studentId) {
  delete speakingState[studentId];
  for (const cb of listeners) cb(studentId, null);
}
// Get initial state
export function getSpeaking(studentId) {
  return speakingState[studentId] || null;
}