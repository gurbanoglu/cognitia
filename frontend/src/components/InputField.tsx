import { useEffect, useState } from 'react';
import { SendHorizonal } from "lucide-react";
import apiClient from "../api/apiClient";
import { getCookie } from "../api/getCookie";
import { useNavigate } from "react-router-dom";
import { RootState } from './../app/store';
import { useSelector } from "react-redux";

export interface Message {
  role: string;
  content: string;
}

interface InputFieldProps {
  sessions: { session_id: string; title?: string; slug?: string }[];
  setSessions: React.Dispatch<React.SetStateAction<{ session_id: string; title?: string; slug?: string }[]>>;

  selectedSessionId: string | null;
  setSelectedSessionId: React.Dispatch<React.SetStateAction<string | null>>;

  isNewUnsavedChat: boolean;
  setIsNewUnsavedChat: React.Dispatch<React.SetStateAction<boolean>>;

  sessionMessages: Record<string, Message[]>;
  setSessionMessages: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;

  fetchMessages: (sessionId: string, csrfToken: string) => Promise<void>;

  loadSessionById: (sessionId: string, slug: string) => Promise<void>;
}

const InputField: React.FC<InputFieldProps> = ({
  sessions, setSessions,
  selectedSessionId, setSelectedSessionId,
  isNewUnsavedChat, setIsNewUnsavedChat,
  sessionMessages, setSessionMessages,
  fetchMessages, loadSessionById
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  // const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState<string>('');
  const [sessionSlug, setSessionSlug] = useState<string>('');

  const navigate = useNavigate();

  useEffect(() => {
    // Creates a new WebSocket connection to the
    // backend server at the given address.
    const ws = new WebSocket('ws://localhost:8000/ws/simple/');

    ws.onopen = () => {
      console.log('WebSocket connected!');
    };

    // Defines the callback for when the server
    // sends a message to the client.
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
      console.log('WebSocket disconnected.');
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  const postMessage = async (sessionId: string, message: string) => {
    const csrfToken = getCookie('csrftoken');

    // await apiClient.post(
    //   `/api/chat-page/sessions/${sessionId}/`,
    //   {message},
    //   {
    //     headers: {
    //       'X-CSRFToken': csrfToken
    //     }
    //   }
    // );

    if (csrfToken) {
      await fetchMessages(sessionId, csrfToken);
    }
  };

  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  const fetchSessions = async () => {
    const csrfToken = getCookie('csrftoken');

    if (!isAuthenticated || !csrfToken) return;

    try {
      console.log('request sent to /api/chat-page/sessions/');

      const response = await apiClient.get(
        "/api/chat-page/sessions/",
        {
          headers: { "X-CSRFToken": csrfToken }
        }
      );

      setSessions(prev => {
        console.log('prev:', prev);

        const tempSessions = prev.filter(s => s.session_id.startsWith("temp-"));

        console.log('response.data:', response.data);

        return [response.data.messages || [], ...tempSessions];
      });
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  const sendMessage = async () => {
    console.log('sendMessage button clicked!')

    console.log('input:', input)

    // If the end user did not click the "Enter" button
    // on their keyboard or inputted nothing and clicked
    // "Enter".
    if (!input.trim()) return;

    const csrfToken = getCookie('csrftoken');

    if (!csrfToken) {
      console.warn("No CSRF token available.");
      return;
    }

    let activeSessionId = selectedSessionId;
    console.log('isNewUnsavedChat:', isNewUnsavedChat);
    // If in new a unsaved chat mode, create a
    // backend session now.
    if (isNewUnsavedChat) {
      console.log('167');
      try {
        const response = await apiClient.post(
          '/save-chat-session/',
          {input},
          { headers: { 'X-CSRFToken': csrfToken } }
        );

        activeSessionId = response.data.session_id;

        setSessionSlug(response.data.slug);

        setSelectedSessionId(activeSessionId);

        setIsNewUnsavedChat(false);

        // Add chat session to sidebar immediately.
        setSessions(prev => {
          return [
          ...prev,
            {
              session_id: response.data.session_id,
              slug: response.data.slug,
              title: response.data.title
            }
          ];
        });

        console.log('InputField.tsx sendMessage');

        console.log('response.data.session_id:', response.data.session_id);

        setSelectedSessionId(response.data.session_id);

        // navigate(`/chat-page/${response.data.slug}`);

        loadSessionById(response.data.session_id, response.data.slug);
      } catch (error) {
        console.error("Error creating session:", error);
        return;
      }
    }
    console.log('209');
    if (activeSessionId) {
      console.log('211');
      try {
        // postMessage(activeSessionId, input);

        if (socket && socket.readyState === WebSocket.OPEN) {
          // Send the message through the WebSocket.
          socket.send(JSON.stringify({
            session_id: activeSessionId,
            message: input
          }));

          setInput('');
        }else{
          console.log('Socket not ready!')
        }

        // setInput("");

        await fetchMessages(activeSessionId, csrfToken);

        await fetchSessions();

        await apiClient.get(
          `/api/chat-page/sessions/${activeSessionId}/`, {
          headers: { 'X-CSRFToken': csrfToken }
        });
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      await sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '0.5rem',
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />

        <button
          className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
          onClick={sendMessage}
          disabled={!input.trim()}
          aria-label="Send message"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <SendHorizonal className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default InputField;