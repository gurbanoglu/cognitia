import apiClient from './apiClient';
import { AxiosResponse } from "axios";
import { getCookie } from "./getCookie";

export const updateChatSession = async (
  selectedSessionId: string,
  messageIndex: number,
  editedMessage: string
): Promise<AxiosResponse<any> | undefined> => {
  const csrfToken = getCookie("csrftoken");

  if (!csrfToken) {
    console.error("CSRF token is missing.");
    return;
  }

  console.log('editedMessage:', editedMessage);

  try {
    const response = await apiClient.patch(
      `/api/chat/update/${selectedSessionId}/${messageIndex}/`,
      {
        updated_message: editedMessage
      },
      {
        headers: {
          'X-CSRFToken': csrfToken
        }
      }
    );

    console.log(`Session ${selectedSessionId} updated successfully.`);

    return response;
  } catch (error) {
    console.error("Error updating session:", error);
  }
};