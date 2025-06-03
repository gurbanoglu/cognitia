import { useState, useEffect } from "react";

import "./App.css";

function App() {
  /* Controlled component
     Keeping track of the input entered into
     that component. */

  // Two pieces of state:
  // message
  // messages

  /* "message" stores the message that has
     been inputted by the end user.
     
     setMessage updates "message" with the inputted
     value. */
  const [message, setMessage] = useState("");

  /* "messages"  */
  const [messages, setMessages] = useState([]);

  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    if (!sessionId) return;

    const intervalId = setInterval(async () => {
      const response = await fetch(
        `http://localhost:8000/api/chat/sessions/${sessionId}/`,
        {
          method: "GET",
        }
      );
      const data = await response.json();
      setMessages(data.messages);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [sessionId]);

  // useEffect is initiated when the "sessionId"
  // variable is modified.

  const postMessage = async (sessionId, message) => {
    await fetch(`http://localhost:8000/api/chat/sessions/${sessionId}/`, {
      method: "POST",
      headers: {
        // Tells the backend to expect the
        // content to be a JSON object.
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: message }),
    });
  };

  // Handles the end user clicking the
  // "Enter" key on the keyboard.
  const sendMessage = async (e) => {
    if (e.key === "Enter") {

      // If there isn't a session ID, then
      // create a new one.
      if (!sessionId) {
        // Sends a HTTP request to the API.
        const response = await fetch(
          "http://localhost:8000/api/chat/sessions/",
          {
            method: "POST",
          }
        );

        const data = await response.json();

        setSessionId(data.id);

        postMessage(data.id, message);
      } else {
        // Post the message to the existing
        // session if one already exists.
        postMessage(sessionId, message);
      }

      setMessage("");

      /* In React, state shouldn't be mutated or have its
         value change because it'll generate errors:
         messages.push()
      */
    }
  };

  return (
    <div className="wrapper">
      <div className="chat-wrapper">
        <div className="chat-history">
          <div>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message${message.role === "user" ? " user" : ""}`}
              >
                {message.role === "user" ? "Me: " : "AI: "}
                {message.content}
              </div>
            ))}
          </div>
        </div>

        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyUp={sendMessage}
        />
      </div>
    </div>
  );
}

export default App;