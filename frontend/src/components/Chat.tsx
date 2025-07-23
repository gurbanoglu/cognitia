import { useState, useEffect, useRef } from "react";
import apiClient from "../api/apiClient";
import { getCookie } from "../api/getCookie";
import { RootState } from './../app/store';
import { useSelector } from "react-redux";
import NewChatButton from "../components/NewChatButton";
import { useParams, useNavigate } from "react-router-dom";
import { deleteChatSession } from "../api/deleteChatSession";
import { Pencil, Trash2, Check, Copy } from "lucide-react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { updateChatSession } from "../api/updateChatSession";
import { NotificationSocket } from "./NotificationSocket";

export interface Message {
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

  const [renamingViaMenuSessionId, setRenamingViaMenuSessionId] = useState<string | null>(null);

  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editedMessage, setEditedMessage] = useState<string>("");


  const mounted = useRef(false);

  const handleClick = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setMenuOpenSessionId(null);
    }
  };

  // Tracks changes to menuOpenSessionId.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    if (menuOpenSessionId) {
      // Wait for UI update, then add the event listener
      setTimeout(() => {
        document.addEventListener("click", handleClick);
      }, 0);  // We add a small delay to allow UI to render
    } else {
      document.removeEventListener("click", handleClick);
    }

    // Cleanup event listener when the component unmounts or when menu is closed
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [menuOpenSessionId]);

  const toggleMenu = (sessionId: string, fromRename = false) => {
    if (fromRename) {
      // Closes the "Rename and Delete" dropdown
      // after the "Rename" button is clicked.
      setMenuOpenSessionId(null);
    } else {
      if (menuOpenSessionId === sessionId) {
        // Close the menu
        setMenuOpenSessionId(null);
      } else {
        // Open the menu
        setMenuOpenSessionId(sessionId);
      }
    }
  };

  const { slug } = useParams();
  const navigate = useNavigate();

  const menuRef = useRef<HTMLDivElement | null>(null);

  const fetchSessions = async () => {
    const csrfToken = getCookie('csrftoken');

    if (!isAuthenticated || !csrfToken) return;

    try {
      console.log('request sent to /api/chat/sessions/');

      const response = await apiClient.get(
        "/api/chat/sessions/",
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
      deleteChatSession(sessionId);

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
        navigate('/chat');
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allSessions = await fetchAllSessions();

        console.log('allSessions:', allSessions);

        setSessions(allSessions.sessions);
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
      }
    };

    fetchData();
  }, []);

  // useEffect(() => {
  //   const csrfToken = getCookie('csrftoken');

  //   if (selectedSessionId && csrfToken) {
  //     console.log('217');
  //     fetchSessions();
  //   }
  // }, [selectedSessionId, csrfToken]);

  useEffect(() => {
    fetchSessions();

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
      console.log('358');
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

  const handleSocketMessage = (updatedMessages: Record<string, Message[]>) => {
    setSessionMessages(updatedMessages);
  };

  return (
    <div className="wrapper">
      <NotificationSocket
        sessionId={selectedSessionId}
        onMessage={handleSocketMessage} />

      <div className="chat-layout"
        style={{ display: 'flex', width: '80%' }}>

        <div className="chat-sidebar"
          style={{
            width: '20rem',
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
              style={{
                position: 'relative',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onMouseEnter={() => setHoveredSessionId(session.session_id)}
              onMouseLeave={() => {
                if (!menuOpenSessionId && !renamingViaMenuSessionId) {
                  /* Remove hovered session only if
                     the menu is not open. */
                  setHoveredSessionId(null);
                }
              }}
            >
              <div
                onClick={() => {
                  if (session.slug && editingSessionId !== session.session_id) {
                    loadSessionById(session.session_id, session.slug);
                  }

                  console.log('Chat session clicked:', session.session_id);
                }}
                onDoubleClick={() => {
                  setEditingSessionId(session.session_id);
                  setEditingTitle(session.title || "");
                }}
                className={`session-button ${session.session_id === selectedSessionId ? "active" : ""}`}
                style={{
                  flexGrow: 1,
                  textAlign: 'left',
                  paddingRight: '0.5rem',
                  minHeight: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                {editingSessionId === session.session_id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <input
                      type="text"
                      value={editingTitle}
                      autoFocus
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateSessionTitle(session.session_id, editingTitle.trim() || "Untitled Chat");
                          setEditingSessionId(null);
                        } else if (e.key === 'Escape') {
                          setEditingSessionId(null);
                        }
                      }}
                      style={{
                        flexGrow: 1,
                        font: 'inherit',
                        padding: '0.25rem',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        backgroundColor: 'white'
                      }}
                    />
                  </div>
                ) : (
                  session.title?.trim() || "Untitled Chat"
                )}
              </div>

              {/* Show ⋯ button when the session is hovered */}
              {hoveredSessionId === session.session_id && (
                <div style={{ position: "relative" }}>
                  {renamingViaMenuSessionId === session.session_id ?
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem' }}>
                      {/* Green checkmark button */}
                      <button
                        onClick={() => {
                          updateSessionTitle(
                            session.session_id,
                            editingTitle.trim() || "Untitled Chat"
                          );

                          setEditingSessionId(null);

                          setRenamingViaMenuSessionId(null);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        aria-label="Confirm rename"
                      >
                        <Check size={18} color="green" />
                      </button>

                      <button
                        onClick={() => {
                          setEditingSessionId(null);
                          setRenamingViaMenuSessionId(null);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          color: 'red',
                          fontWeight: 'bold'
                        }}
                        aria-label="Cancel rename"
                      >
                        X
                      </button>
                    </div>
                    :
                    <button
                      // Open the menu on click
                      onClick={() => toggleMenu(session.session_id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        fontSize: "1rem",
                        cursor: "pointer",
                        padding: "0.25rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      aria-label="Open session menu"
                    >
                      ⋯
                    </button>
                  }

                  {/* Menu (Rename, Delete) */}
                  {menuOpenSessionId === session.session_id && (
                    <div
                      ref={menuRef}
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "1.5rem",
                        backgroundColor: "#fff",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        zIndex: 9999,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                      }}
                    >
                      <div
                        onClick={() => {
                          setEditingSessionId(session.session_id);
                          setEditingTitle(session.title || "");
                          toggleMenu(session.session_id, true);
                          setRenamingViaMenuSessionId(session.session_id);
                        }}
                        style={{
                          padding: "0.5rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <Pencil size={16} />
                        Rename
                      </div>

                      <div
                        onClick={() => {
                          setSessionToDelete(session.session_id);
                          toggleMenu(session.session_id, true);
                        }}
                        style={{
                          padding: "0.5rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          color: "red",
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
                {messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  const isEditing = editingMessageIndex === index;

                  const handleUpdateMessage = async () => {
                    const csrfToken = getCookie('csrftoken');

                    if (!selectedSessionId || !csrfToken) return;

                    try {
                      const response = await updateChatSession(selectedSessionId, index, editedMessage);

                      setSessionMessages(prev => ({
                        ...prev,
                        [selectedSessionId]: response?.data?.messages
                      }));

                      setEditingMessageIndex(null);
                    } catch (error) {
                      console.error("Failed to update message:", error);
                    }
                  };

                  return (
                    <div key={index} className={`message${isUser ? " user" : ""}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ flex: 1 }}>
                        {isUser ? "Me: " : "AI: "}
                        {isUser && isEditing ? (
                          <div style={{ display: "flex" }}>
                            <input
                              value={editedMessage}
                              onChange={(e) => setEditedMessage(e.target.value)}
                              style={{ flex: 1 }}
                            />

                            <button onClick={handleUpdateMessage}>
                              Save
                            </button>

                            <button
                              onClick={
                                () => setEditingMessageIndex(null)
                            }>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span>{msg.content}</span>
                        )}
                      </div>

                      {/* Buttons only for user messages and if NOT editing */}
                      {isUser && !isEditing && (
                        <div style={{ display: "flex", marginLeft: "1rem" }}>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(msg.content).then(() => {
                                console.log("Copied to clipboard!");
                              }).catch(() => {
                                console.log("Failed to copy");
                              });
                            }}
                            aria-label="Copy message"
                            style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                          >
                            <Copy size={16} />
                            Copy
                          </button>

                          <button
                            onClick={() => {
                              setEditingMessageIndex(index);
                              setEditedMessage(msg.content);
                            }}
                            aria-label="Edit message"
                            style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                          >
                            <Pencil size={16} />
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
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
            if (sessionToDelete) {
              // Update the state to see the changes
              // immediately in the UI.
              deleteSession(sessionToDelete);

              setSessionToDelete(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default Chat;