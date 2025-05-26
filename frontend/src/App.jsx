import { useState } from "react";

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

  // Handles the end user clicking the "Enter"
  // key on the keyboard.
  const sendMessage = (e) => {
    if (e.key === "Enter") {
      setMessage("");

      /* In React, state shouldn't be mutated or have its
         value change because it'll generate errors:
         messages.push()
      */

      setMessages([...messages, { content: message, role: "user" }]);
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