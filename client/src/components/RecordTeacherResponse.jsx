import React, { useRef, useState } from 'react';

export default function RecordTeacherResponse({ sessionId }) {
  const recRef = useRef(null);
  const [chunks, setChunks] = useState([]);
  const [isRec, setIsRec] = useState(false);
  const socketRef = useRef(null);

  // לקבל socket מגלובל אם תרצי, או להעביר כ-prop. כאן נוותר.

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    const arr = [];
    rec.ondataavailable = (e)=> arr.push(e.data);
    rec.onstop = ()=> setChunks(arr);
    rec.start();
    recRef.current = rec;
    setIsRec(true);
    window.socket?.emit?.('mic:state', true); // אם תחשפי את הסוקט ל-window
  };

  const stop = () => {
    recRef.current?.stop();
    setIsRec(false);
    window.socket?.emit?.('mic:state', false);
  };

  const send = async () => {
    const blob = new Blob(chunks, { type: 'audio/webm' });
    const form = new FormData();
    form.append('audio', blob, 'resp.webm');
    const base = process.env.REACT_APP_API_URL || 'http://localhost:4000';

    const stt = await fetch(`${base}/api/eval/stt`, { method:'POST', body: form }).then(r=>r.json());

    const score = await fetch(`${base}/api/eval/score`, {
      method:'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, text: stt.text, tone: stt.tone, timingMs: stt.timingMs })
    }).then(r=>r.json());

    console.log('STT:', stt, 'SCORE:', score);
    alert(`Score: ${score.score}\n${score.feedback.explanation}`);
  };

  return (
    <div style={{ position:'absolute', right:12, top:12, display:'flex', gap:8, background:'#fff', padding:8, border:'1px solid #eee', borderRadius:8 }}>
      {!isRec ? <button onClick={start}>🎙️ התחל</button> : <button onClick={stop}>⏹️ עצור</button>}
      <button disabled={!chunks.length} onClick={send}>שלח תגובה</button>
    </div>
  );
}