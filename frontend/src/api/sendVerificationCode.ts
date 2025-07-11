import apiClient from './apiClient';

export const sendVerificationCode = async (
  emailAddress: string
): Promise<void> => {
  await apiClient.post('send-verification-code/', { emailAddress });
};