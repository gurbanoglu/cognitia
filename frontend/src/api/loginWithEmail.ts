import apiClient from './apiClient';

export const loginWithEmail = async (
  emailAddress: string,
  csrfToken: string
): Promise<void> => {
  const response = await apiClient.post(
    'login-with-email/',
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