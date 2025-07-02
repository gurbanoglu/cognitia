import apiClient from './apiClient';

export interface GoogleAuthResponse {
  message: string;
}

export const checkIfActive = async (
  emailAddress: string,
  csrfToken: string
): Promise<GoogleAuthResponse> => {
  const response = await apiClient.post(
    'check-if-active/',
    {
      emailAddress
    },
    {
      headers: {
        'X-CSRFToken': csrfToken
      }
    }
  );

  return response.data;
};