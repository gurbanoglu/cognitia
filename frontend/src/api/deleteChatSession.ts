import apiClient from './apiClient';
import { getCookie } from "../api/getCookie";

export const deleteChatSession = async (sessionId: string): Promise<void> => { 
  const csrfToken = getCookie("csrftoken");

  if (!csrfToken) {
    console.error("CSRF token is missing.");
    return;
  }

  try {
    const response = await apiClient.delete(
        `/api/chat-page/sessions/${sessionId}/`,
        { headers: { 'X-CSRFToken': csrfToken } }
    );

    console.log(`Session ${sessionId} deleted successfully.`, response.data);
  } catch (error) {
    console.error("Error deleting session:", error);
  }
};