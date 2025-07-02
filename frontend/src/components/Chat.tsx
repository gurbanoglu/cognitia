import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import { getCookie } from "../api/getCookie";
import { RootState } from './../app/store';
import { useSelector } from "react-redux";
import NewChatButton from "../components/NewChatButton";
import { useParams, useNavigate } from "react-router-dom";
import { deleteChatSession } from "../api/deleteChatSession";
import { Pencil, Trash2 } from "lucide-react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

interface Message {
  role: string;
  content: string;
}

/* Controlled component
   Keeping track of the input entered into
   that component. */
const Chat: React.FC = () => {

  const [message, setMessage] = useState<string>("");

  /*
  sessionMessages is not an array, it's an object like:

  {
    "session-id-123": [ { role: "user", content: "Hi" } ],
  }
  */
  const [sessionMessages, setSessionMessages] = useState<Record<string, Message[]>>({});

  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  const csrfToken = useSelector((state: RootState) => state.auth.csrfToken);

  const [sessionSlug, setSessionSlug] = useState<string>('');
  const [sessions, setSessions] = useState<{ session_id: string; title?: string; slug?: string }[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Track if the current chat is a new unsaved chat (blank chat).
  const [isNewUnsavedChat, setIsNewUnsavedChat] = useState(true);

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");

  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);
  const [menuOpenSessionId, setMenuOpenSessionId] = useState<string | null>(null);

  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const toggleMenu = (sessionId: string) => {
    setMenuOpenSessionId(prev => (prev === sessionId ? null : sessionId));
  };

  const { slug } = useParams();
  const navigate = useNavigate();

  const fetchSessions = async () => {
    const csrfToken = getCookie('csrftoken');

    if (!isAuthenticated || !csrfToken) return;
    console.log('fetchSessions 50');
    try {
      const response = await apiClient.get(
        "/api/chat/sessions/",
        {
          headers: { "X-CSRFToken": csrfToken }
        }
      );

      setSessions(prev => {
        const tempSessions = prev.filter(s => s.session_id.startsWith("temp-"));
        return [...response.data, ...tempSessions];
      });
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  const fetchAllSessions = async () => {
    const response = await apiClient.get(
      `/get-all-sessions/`,
      {
        headers: {
          'X-CSRFToken': csrfToken
        }
      }
    );

    return response.data;
  }

  const updateSessionTitle = async (sessionId: string, newTitle: string) => {
    try {
      const csrfToken = getCookie('csrftoken');
      if (!csrfToken) return;

      await apiClient.put(
        `/api/chat/sessions/${sessionId}/`,
        { title: newTitle },
        { headers: { 'X-CSRFToken': csrfToken } }
      );

      // Update locally
      setSessions(prev =>
        prev.map(session =>
          session.session_id === sessionId
            ? { ...session, title: newTitle }
            : session
        )
      );

      setEditingSessionId(null);
    } catch (error) {
      console.error("Failed to update session title:", error);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const csrfToken = getCookie('csrftoken');
      if (!csrfToken) return;

      await apiClient.delete(
        `/api/chat/sessions/${sessionId}/`,
        { headers: { 'X-CSRFToken': csrfToken } }
      );

      // Remove from local state
      setSessions(prev => prev.filter(session => session.session_id !== sessionId));

      // If deleted session was selected, reset selected session
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
        setIsNewUnsavedChat(true);
        setSessionSlug("");
        setSessionMessages(prev => {
          const copy = { ...prev };
          delete copy[sessionId];
          return copy;
        });
        navigate('/chat'); // go to new chat empty route
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allSessions = await fetchAllSessions();

        // console.log('allSessions.sessions:', allSessions.sessions);

        setSessions(allSessions.sessions);
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const csrfToken = getCookie('csrftoken');

    if (selectedSessionId && csrfToken) {
      fetchSessions();
    }
  }, [selectedSessionId, csrfToken]);

  useEffect(() => {
    if (sessionSlug && sessions.length > 0) {
      const matchedSession = sessions.find(s => s.slug === sessionSlug);

      if (matchedSession) {
        setSelectedSessionId(matchedSession.session_id);
        setIsNewUnsavedChat(false);

        if (csrfToken) {
          fetchMessages(matchedSession.session_id, csrfToken);
        }
      }
    }
  }, [slug, sessions, csrfToken]);

  // Necessary for obtaining OpenAI API responses.
  const fetchMessages = async (
    sessionId: string,
    csrfToken: string
  ) => {
    const response = await apiClient.get(
      `/api/chat/sessions/${sessionId}/`,
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

  const postMessage = async (sessionId: string, message: string) => {
    const csrfToken = getCookie('csrftoken');

    await apiClient.post(
      `/api/chat/sessions/${sessionId}/`,
      {message},
      {
        headers: {
          'X-CSRFToken': csrfToken
        }
      }
    );

    if (csrfToken) {
      await fetchMessages(sessionId, csrfToken);
    }
  };

  const sendMessage = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !message.trim()) return;

    const csrfToken = getCookie('csrftoken');

    if (!csrfToken) {
      console.warn("No CSRF token available.");
      return;
    }

    let activeSessionId = selectedSessionId;

    // If in new a unsaved chat mode, create a
    // backend session now.
    if (isNewUnsavedChat) {
      try {
        const response = await apiClient.post(
          '/save-chat-session/',
          {message},
          { headers: { 'X-CSRFToken': csrfToken } }
        );

        activeSessionId = response.data.session_id;

        setSessionSlug(response.data.slug);

        setSelectedSessionId(activeSessionId);
        setIsNewUnsavedChat(false);

        // Add to chat session to sidebar immediately.
        setSessions(prev => {
          console.log('prev:', prev);

          return [
          ...prev,
            {
              session_id: response.data.session_id,
              slug: response.data.slug,
              title: response.data.title
            }
          ];
        });

        if (response.data.slug) {
          navigate(`/chat/${response.data.slug}`);
        }
      } catch (error) {
        console.error("Error creating session:", error);
        return;
      }
    }

    if (activeSessionId) {
      try {
        await postMessage(activeSessionId, message);

        setMessage("");

        await fetchMessages(activeSessionId, csrfToken);

        await fetchSessions();

        await apiClient.get(
          `/api/chat/sessions/${activeSessionId}/`, {
          headers: { 'X-CSRFToken': csrfToken }
        });
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }
  };

  const canStartNewChat =
    !isNewUnsavedChat &&
    selectedSessionId !== null &&
    (sessionMessages[selectedSessionId]?.length ?? 0) > 0;

  const loadSessionById = async (sessionId: string, slug: string) => {
    const csrfToken = getCookie('csrftoken');
    navigate(`/chat/${slug}`);

    setTimeout(async () => {
      setSelectedSessionId(sessionId);
      setIsNewUnsavedChat(false);

      if (csrfToken) {
        await fetchMessages(sessionId, csrfToken);
      }
    }, 10);
  };

  const messages = selectedSessionId
    ? sessionMessages[selectedSessionId] || []
    : isNewUnsavedChat
      ? []
      : [];

  return (
    <div className="wrapper">
      <div className="chat-layout"
        style={{ display: 'flex', width: '80%' }}>

        <div className="chat-sidebar"
          style={{
            width: '13rem',
            borderRight: '1px solid #ccc',
            padding: '1rem',
            height: '100vh',
            overflowY: 'auto',
            boxSizing: 'border-box'
        }}>
          <NewChatButton
            disabled={!canStartNewChat}
            onNewSessionCreated={() => {
              const tempId = `temp-${Date.now()}`;

              setSelectedSessionId(tempId);
              setIsNewUnsavedChat(true);

              setMessage("");

              setSessionMessages(prev => ({
                ...prev,
                [tempId]: []
              }));

              setSessionSlug("");

              navigate('/chat');
            }}
          />

          {/* Left side panel */}
          {sessions.length > 0 && sessions.map((session) => (
          <div
            key={session.session_id}
            className="session-button-wrapper"
            style={{ position: 'relative', marginBottom: '0.5rem' }}
            onMouseEnter={() => setHoveredSessionId(session.session_id)}
            onMouseLeave={() => setHoveredSessionId(null)}
          >
            <button
              onClick={() => {
                if (session.slug && editingSessionId !== session.session_id) {
                  loadSessionById(session.session_id, session.slug);
                }
              }}
              onDoubleClick={() => {
                setEditingSessionId(session.session_id);
                setEditingTitle(session.title || "");
              }}
              className={`session-button ${session.session_id === selectedSessionId ? "active" : ""}`}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                paddingRight: '2rem',
                position: 'relative',
                minHeight: '2.5rem'
              }}
            >
              {editingSessionId === session.session_id ? (
                <input
                  type="text"
                  value={editingTitle}
                  autoFocus
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => {
                    updateSessionTitle(session.session_id, editingTitle.trim() || "Untitled Chat");
                    setEditingSessionId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateSessionTitle(session.session_id, editingTitle.trim() || "Untitled Chat");
                      setEditingSessionId(null);
                    } else if (e.key === 'Escape') {
                      setEditingSessionId(null);
                    }
                  }}
                  style={{
                    width: '90%',
                    font: 'inherit',
                    padding: '0.25rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: 'white'
                  }}
                />
              ) : (
                session.title?.trim() || "Untitled Chat"
              )}
            </button>

            {/* 3-dot menu button */}
            {hoveredSessionId === session.session_id && (
              <div style={{ position: 'absolute', top: '0.25rem', right: '0.25rem' }}>
                <button
                  onClick={() => toggleMenu(session.session_id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  ⋯
                </button>

                {menuOpenSessionId === session.session_id && (
                  <div style={{
                    position: 'absolute',
                    right: '0',
                    top: '1.5rem',
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    zIndex: 9999,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }}>
                    <div
                      onClick={() => {
                        setEditingSessionId(session.session_id);
                        setEditingTitle(session.title || "");
                        setMenuOpenSessionId(null);
                      }}
                      style={{
                        padding: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Pencil size={16} />
                      Rename
                    </div>

                    <div
                      onClick={() => {
                        setSessionToDelete(session.session_id);
                        setMenuOpenSessionId(null);
                      }}
                      style={{
                        padding: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'red'
                      }}
                    >
                      <Trash2 size={16} />
                      Delete
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          ))}
        </div>

        <div
          className="chat-wrapper"
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            padding: '1rem',
            boxSizing: 'border-box',
            flex: 1
          }}
        >
          <div
            className="chat-history"
            style={{
              flexGrow: 1,
              overflowY: 'auto',
              marginBottom: '1rem'
            }}
          >
            <div>
              <div>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`message${msg.role === "user" ? " user" : ""}`}
                  >
                    {msg.role === "user" ? "Me: " : "AI: "}
                    {msg.content}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={sendMessage}
            style={{
              padding: '0.5rem',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      {sessionToDelete && (
        <ConfirmDeleteModal
          onCancel={() => setSessionToDelete(null)}
          onConfirm={() => {
            deleteChatSession(sessionToDelete);
            setSessionToDelete(null);
          }}
        />
      )}
    </div>
  );
};

export default Chat;