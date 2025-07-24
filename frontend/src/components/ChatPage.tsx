import { useState } from 'react';
import { getCookie } from "../api/getCookie";
import Chat from './Chat';
import { Message } from './Chat';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

export default function ChatPage() {
  const [sessions, setSessions] = useState<
    { session_id: string; title?: string; slug?: string }[]
  >([]);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Track if the current chat is a new unsaved chat (blank chat).
  const [isNewUnsavedChat, setIsNewUnsavedChat] = useState(true);

  /*
  sessionMessages is not an array, it's an object like:

  {
    "session-id-123": [ { role: "user", content: "Hi" } ],
  }
  */
  const [sessionMessages, setSessionMessages] = useState<Record<string, Message[]>>({});

  const navigate = useNavigate();

  // Necessary for obtaining OpenAI API responses.
  const fetchMessages = async (
    sessionId: string,
    csrfToken: string
  ) => {
    const response = await apiClient.get(
      `/api/chat-page/sessions/${sessionId}/`,
      {
        headers: {
          'X-CSRFToken': csrfToken
        }
      }
    );

    const data = response.data;

    setSessionMessages(prev => ({
      ...prev,
      [sessionId]: data.messages
    }));
  };

  const loadSessionById = async (sessionId: string, slug: string) => {
    const csrfToken = getCookie('csrftoken');

    navigate(`/chat-page/${slug}`);

    setTimeout(async () => {
      console.log('304');
      setSelectedSessionId(sessionId);
      setIsNewUnsavedChat(false);

      if (csrfToken) {
        await fetchMessages(sessionId, csrfToken);
      }
    }, 10);
  };

  return (
    <>
      <Chat sessions={sessions}
        setSessions={setSessions}
        selectedSessionId={selectedSessionId}
        setSelectedSessionId={setSelectedSessionId}
        isNewUnsavedChat={isNewUnsavedChat}
        setIsNewUnsavedChat={setIsNewUnsavedChat}
        sessionMessages={sessionMessages}
        setSessionMessages={setSessionMessages}
        fetchMessages={fetchMessages}
        loadSessionById={loadSessionById} />
    </>
  );
}