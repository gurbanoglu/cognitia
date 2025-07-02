import apiClient from './apiClient';

export const deleteChatSession = async (sessionId: string): Promise<void> => { 

  try {
    const response = await apiClient.delete(
      `/api/chat/sessions/${sessionId}/`
    );

    console.log(`Session ${sessionId} deleted successfully.`, response.data);
  } catch (error) {
    console.error("Error deleting session:", error);
  }
};