import { useEffect } from 'react';
import { Message } from './Chat';

type NotificationSocketProps = {
  sessionId: string | null;
  onMessage: (updatedMessages: Record<string, Message[]>) => void;
};

export const NotificationSocket = (
  { sessionId, onMessage }: NotificationSocketProps
) => {
  useEffect(() => {
    if (!sessionId) return;

    // const ws = new WebSocket(`ws://localhost:8000/ws/session/${sessionId}/`);

    const ws = new WebSocket(`ws://backend:8000/ws/session/${sessionId}/`);

    // const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws/session/${sessionId}/`);

    // const ws = new WebSocket(`ws://host.docker.internal:8000/ws/session/${sessionId}/`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.status === "done") {
        onMessage(data.messages);
      }
    };

    ws.onopen = () => {
      console.log("WebSocket connection opened");
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => ws.close();
  }, [sessionId, onMessage]);

  return null;
};