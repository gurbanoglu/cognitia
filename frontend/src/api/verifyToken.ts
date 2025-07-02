import apiClient from './apiClient';

interface VerifyEmailResponse {
  message: string;
}

// Sends the token from the URL to the backend (Django)
// for the purpose of confirming that it matches the
// one in the database table.
export const verifyToken = async (
  activationToken: string): Promise<VerifyEmailResponse> => {
  const response = await apiClient.post<VerifyEmailResponse>(
    'verify-token/',
    { "activationToken": activationToken }
  );

  return response.data;
};