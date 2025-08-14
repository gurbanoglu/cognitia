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

  sessionSlug: string;
  setSessionSlug: React.Dispatch<React.SetStateAction<string>>;

  fetchMessages: (sessionId: string, csrfToken: string) => Promise<void>;

  loadSessionById: (sessionId: string, slug: string) => Promise<void>;
}

const InputField: React.FC<InputFieldProps> = ({
  sessions, setSessions,
  selectedSessionId, setSelectedSessionId,
  isNewUnsavedChat, setIsNewUnsavedChat,
  sessionMessages, setSessionMessages,
  sessionSlug, setSessionSlug,
  fetchMessages, loadSessionById
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  // const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState<string>('');

  const navigate = useNavigate();

  // This will pause the browser dev tools debugger if open
  // useEffect(() => {
  //   debugger;
  // }, []);

  useEffect(() => {
    const csrfToken = getCookie('csrftoken');
    if (!csrfToken) return;

    // Wait until the response from the web socket is sent.
    fetchSessions();

    if(selectedSessionId) {
      apiClient.get(
        `/api/chat-page/sessions/${selectedSessionId}/`, {
        headers: { 'X-CSRFToken': csrfToken }
      });

      fetchMessages(selectedSessionId, csrfToken);
    }
  }, [messages]);

  useEffect(() => {
    console.log('InputField.tsx useEffect line 73');
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
        console.log('InputField.tsx data.messages 87:', data.messages);

        // Preserve the existing messages while appending
        // data.messages to the end of the list.
        setMessages(
          prev => [...prev, data.messages]
        );
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
    console.log('InputField.tsx ' + '!isAuthenticated 134: ' + !isAuthenticated);
    // if (!isAuthenticated || !csrfToken) return;
    if (!csrfToken) return;
    console.log('InputField.tsx 137');
    try {
      console.log('InputField.tsx 139');

      const response = await apiClient.get(
        `/api/get-all-sessions/`,
        {
          headers: { "X-CSRFToken": csrfToken }
        }
      );

      console.log('InputField.tsx 148 response:', response);

      setSessions(prev => {
        console.log('InputField.tsx 151 prev:', prev);

        const tempSessions = prev.filter(s => s.session_id.startsWith("temp-"));

        console.log('InputField.tsx 155 response.data:', response.data);
        console.log('InputField.tsx 156 response.data.sessions:', response.data.sessions);
        console.log('InputField.tsx 157 ...tempSessions:', ...tempSessions);
        // return [response.data.sessions || [], ...tempSessions];
        return [...(response.data.sessions || []), ...tempSessions];
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
    console.log('InputField.tsx 184 isNewUnsavedChat:', isNewUnsavedChat);
    // If in new a unsaved chat mode, create a
    // backend session now.
    if (isNewUnsavedChat) {
      console.log('InputField.tsx 188');
      try {
        const response = await apiClient.post(
          `/save-chat-session/`,
          {input},
          { headers: { 'X-CSRFToken': csrfToken } }
        );

        activeSessionId = response.data.session_id;

        setSessionSlug(response.data.slug);

        setSelectedSessionId(activeSessionId);

        setIsNewUnsavedChat(false);

        // Add chat session to sidebar immediately.
        setSessions(prev => {
          console.log('InputField.tsx 206 ...prev:', ...prev);
          console.log({
            session_id: response.data.session_id,
            slug: response.data.slug,
            title: response.data.title
          });

          return [
            ...prev,
            {
              session_id: response.data.session_id,
              slug: response.data.slug,
              title: response.data.title
            }
          ];
        });

        console.log('InputField.tsx 223 response.data.session_id:', response.data.session_id);

        setSelectedSessionId(response.data.session_id);

        // navigate(`/chat-page/${response.data.slug}`);

        loadSessionById(response.data.session_id, response.data.slug);
      } catch (error) {
        console.error("Error creating session:", error);
        return;
      }
    }
    console.log('235');
    if (activeSessionId) {
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
        console.log('InputField.tsx 253 activeSessionId:', activeSessionId);
        // await fetchMessages(activeSessionId, csrfToken);
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