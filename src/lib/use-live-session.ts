import { useEffect, useRef, useState } from 'react';
import { LiveSession, SessionStatus } from './gemini-live';

export function useLiveSession(apiKey: string | undefined) {
  const [status, setStatus] = useState<SessionStatus>('disconnected');
  const [modelVolume, setModelVolume] = useState(0);
  const [userVolume, setUserVolume] = useState(0);
  const sessionRef = useRef<LiveSession | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!apiKey) return;

    sessionRef.current = new LiveSession(apiKey, {
      onStatusChange: (newStatus) => setStatus(newStatus),
      onInterruption: () => {
        // Interruption logic handled inside LiveSession internally for stopping player
      }
    });

    return () => {
      sessionRef.current?.stop();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [apiKey]);

  useEffect(() => {
    if (status === 'connected') {
      const updateVolume = () => {
        const modelAnalyser = sessionRef.current?.getAnalyser();
        const userAnalyser = sessionRef.current?.getUserAnalyser();

        if (modelAnalyser) {
          const dataArray = new Uint8Array(modelAnalyser.frequencyBinCount);
          modelAnalyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          const avg = sum / dataArray.length;
          setModelVolume(avg / 128);
        }

        if (userAnalyser) {
          const dataArray = new Uint8Array(userAnalyser.frequencyBinCount);
          userAnalyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          const avg = sum / dataArray.length;
          setUserVolume(avg / 128);
        }

        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } else {
      setModelVolume(0);
      setUserVolume(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [status]);

  const start = () => sessionRef.current?.start();
  const stop = () => sessionRef.current?.stop();

  return {
    status,
    start,
    stop,
    modelVolume,
    userVolume
  };
}
