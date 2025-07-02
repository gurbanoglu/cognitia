import React from "react";

interface NewChatButtonProps {
  onNewSessionCreated: () => void;
  disabled?: boolean;
}

const NewChatButton: React.FC<NewChatButtonProps> = ({
  onNewSessionCreated,
  disabled
}) => {
  const handleNewChat = () => {
    if (disabled) return;
    onNewSessionCreated();
  };

  return (
    <button
      disabled={disabled}
      onClick={handleNewChat}
      style={{
        display: "block",
        marginBottom: "1rem",
        width: "100%",
        padding: "0.5rem",
        backgroundColor: disabled ? "#ddd" : "#f0f0f0",
        border: "1px solid #ccc",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        userSelect: "none",
      }}
    >
      + New Chat
    </button>
  );
};

export default NewChatButton;