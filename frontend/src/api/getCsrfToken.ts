import apiClient from './apiClient';

export const getCsrfToken = async () => {
  const response = await apiClient.get('/api/get-csrf-token/');

  return response.data;
};