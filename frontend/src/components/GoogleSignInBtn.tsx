import React from 'react';
import Button from './Button';
import { ButtonColor } from './Button'
import { useGoogleLogin } from '@react-oauth/google';

const GoogleSignInButton: React.FC = () => {
  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // tokenResponse.access_token is the OAuth access token
      // Send this to your backend for verification and user creation/login
      const response = await fetch('/api/auth/google/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenResponse.access_token }),
      });

      const data = await response.json();
      // Handle backend response: store JWT, redirect, etc.
    },
    onError: (error) => {
      console.error('Google Sign-In failed', error);
    },
  });

  return (
    <Button
      color={ButtonColor.DarkBlue}
      width="w-full"
      height="h-10"
      onClick={handleGoogleSignIn}
      className="flex items-center justify-center gap-2 mb-4"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 488 512"
        className="w-5 h-5"
        fill="currentColor"
      >
        <path d="M488 261.8c0-17.4-1.6-34.1-4.7-50.4H249v95.5h134.3c-5.8 31.3-23.6 57.8-50.3 75.6v62h81.3c47.6-43.9 75-108.3 75-182.7zM249 492c67.2 0 123.7-22.2 164.9-60.1l-81.3-62c-22.6 15.2-51.5 24.3-83.6 24.3-64.3 0-118.8-43.4-138.4-101.7h-82.4v63.8C75.4 440.1 155.4 492 249 492zM110.6 292.5c-4.8-14.3-7.5-29.5-7.5-45s2.7-30.7 7.5-45v-63.8h-82.4C14.1 202.7 0 247.1 0 292.5s14.1 89.8 28.2 109.3l82.4-63.8zM249 97.7c35.4 0 67.3 12.2 92.4 36.1l69.3-69.3C370.3 27.7 311.1 0 249 0 155.4 0 75.4 51.9 38.6 126.1l82.4 63.8c19.6-58.3 74.1-101.7 138.4-101.7z" />
      </svg>
      Sign in with Google
    </Button>
  );
};

export default GoogleSignInButton;