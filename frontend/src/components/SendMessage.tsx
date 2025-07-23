import { useEffect, useState, ChangeEvent } from 'react';

const WebSocketDemo = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState<string>('');

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/simple/');

    ws.onopen = () => {
      console.log('WebSocket connected!');
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (typeof data.message === 'string') {
          setMessages(prev => [...prev, data.message]);
        }
      } catch (error) {
        console.error('Failed to parse message', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ message: input }));
      setInput('');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return (
    <div>
      <input
        value={input}
        onChange={handleInputChange}
        placeholder="Type message..."
      />
      <button onClick={sendMessage}>Send</button>

      <ul>
        {messages.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}

export default WebSocketDemo;