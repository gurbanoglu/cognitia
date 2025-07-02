import { getCookie } from "../api/getCookie";

interface UpdateSessionPayload {
  title?: string;
  messages?: { index: number; newContent: string }[];
}

export const updateChatSession = async (
  sessionId: string,
  payload: UpdateSessionPayload
): Promise<void> => {
  const csrfToken = getCookie("csrftoken");

  if (!csrfToken) {
    console.error("CSRF token is missing.");
    return;
  }

  try {
    const response = await fetch(`/api/chat/sessions/${sessionId}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to update session ${sessionId}`);
    }

    console.log(`Session ${sessionId} updated successfully.`);
  } catch (error) {
    console.error("Error updating session:", error);
  }
};