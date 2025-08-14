import { useEffect, useState } from 'react';
import { getCookie } from "../api/getCookie";
import Chat from './Chat';
import { Message } from './Chat';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { RootState } from './../app/store';
import { useSelector } from "react-redux";
import axios from 'axios';

const ChatPage = () => {
  const [sessions, setSessions] = useState<
    { session_id: string; title?: string; slug?: string }[]
  >([]);

  const [activeSession, setActiveSession] = useState(null);

  // useEffect(() => {
  //   const fetchSessions = async () => {
  //     try {
  //       const res = await axios.get('/get-all-sessions/', { withCredentials: true });
  //       const userSessions = res.data.sessions;
  //       console.log('userSessions:', userSessions);

  //       if (userSessions && userSessions.length > 0) {
  //         setSessions(userSessions);
  //         // setActiveSession(userSessions[0]);
  //       }
  //     } catch (error) {
  //       console.error('Failed to fetch sessions:', error);
  //     }
  //   };

  //   fetchSessions();
  // }, []);

  const createNewSession = async () => {
    const res = await apiClient.post(
      '/create_chat_session/',
      {},
      { withCredentials: true }
    );

    setActiveSession(res.data);
    setSessions(prev => [res.data, ...prev]);
  };

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
  console.log('ChatPage.tsx 56 sessionMessages:', sessionMessages);
  const [sessionSlug, setSessionSlug] = useState<string>('');

  /*
  Use the useSelector hook from Redux (via react-redux)
  to extract the isAuthenticated value from your app's
  global Redux store.
  */
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  const csrfToken = useSelector((state: RootState) => state.auth.csrfToken);

  const { slug } = useParams();
  const navigate = useNavigate();

  // fetchMessages get messages only for
  // a particular chat session.
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

    console.log('ChatPage.tsx 95 data:', data);

    setSessionMessages(prev => ({
      ...prev,
      [sessionId]: data.messages
    }));
  };

  const fetchSessions = async () => {
    const csrfToken = getCookie('csrftoken');
    console.log('ChatPage.tsx 100 isAuthenticated:', isAuthenticated);
    console.log('ChatPage.tsx 101 csrfToken:', csrfToken);
    // if (!isAuthenticated || !csrfToken) return;
    if (!csrfToken) return;

    try {
      console.log('ChatPage.tsx 111 request sent to /api/get-all-sessions/');

      // const response = await apiClient.get(
      //   "/api/chat-page/sessions/",
      //   {
      //     headers: { "X-CSRFToken": csrfToken }
      //   }
      // );

      const response = await apiClient.get(
        `/api/get-all-sessions/`,
        {
          headers: { "X-CSRFToken": csrfToken }
        }
      );
      console.log('ChatPage.tsx 126 response.data:', response.data);
      console.log('ChatPage.tsx 127 response.data.sessions:', response.data.sessions);
      // Problem: prev is empty after creating a new session.
      setSessions(prev => {
        console.log('ChatPage.tsx 130 prev:', prev);
        // const tempSessions = prev.filter(s => s.session_id.startsWith("temp-"));
        // console.log('ChatPage.tsx 125 tempSessions:', tempSessions);
        if (prev.length <= 1) return prev;
        // const tempSessions = prev.filter(s => s.session_id.startsWith("temp-"));

        // console.log('ChatPage.tsx 129 tempSessions:', tempSessions);

        // Creating a new chat session causes response.data?.messages
        // to be undefined.
        const updatedSessions = [
          // If response.data.messages exists (i.e. is not undefined
          // or null), then wrap it in an array.
          ...(response.data.sessions ? [response.data.sessions] : []),
          // ...tempSessions,
        ];

        /*
        [...([{ session_id: "123", name: "New Session" }])]

        becomes:

        [{ session_id: "123", name: "New Session" }]
        */

        console.log('ChatPage.tsx 155 updatedSessions:', updatedSessions);

        // Whatever is returned inside a set function
        // becomes the updated state.
        return updatedSessions;
      });

      console.log('sessions:', sessions)
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  useEffect(() => {
    console.log('ChatPage.tsx useEffect line 169');
    (async () => {
      await fetchSessions();
    })();

    if (sessions.length == 0) {
      console.log('ChatPage.tsx session.length == 0');

      setIsNewUnsavedChat(true);
    }
    console.log('ChatPage.tsx 179 sessions:', sessions);
    if (sessionSlug && sessions.length > 0) {
      const matchedSession = sessions.find(s => s.slug === sessionSlug);

      if (matchedSession) {
        // console.log('ChatPage.tsx 159');
        setSelectedSessionId(matchedSession.session_id);
        // console.log('ChatPage.tsx 161');
        setIsNewUnsavedChat(false);
        // console.log('ChatPage.tsx 163');
        if (csrfToken) {
          // console.log('ChatPage.tsx 165');
          fetchMessages(matchedSession.session_id, csrfToken);
        }
      }
    }
  }, [slug, sessions, csrfToken]);

  const loadSessionById = async (sessionId: string, slug: string) => {
    const csrfToken = getCookie('csrftoken');

    // console.log('ChatPage.tsx 175 loadSessionById');

    // setTimeout(async () => {
    setSelectedSessionId(sessionId);
    setIsNewUnsavedChat(false);

    if (csrfToken) {
      console.log('ChatPage.tsx 207');

      await fetchMessages(sessionId, csrfToken);
    }
    // }, 10);

    navigate(`/chat-page/${sessionId}`);
    // navigate(`/chat-page/${slug}`);
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
        sessionSlug={sessionSlug}
        setSessionSlug={setSessionSlug}
        fetchMessages={fetchMessages}
        loadSessionById={loadSessionById}
        isAuthenticated={isAuthenticated}
        csrfToken={csrfToken} />
    </>
  );
}

export default ChatPage;