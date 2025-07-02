import React, { useState } from 'react';
import Button from './Button';
import GoogleSignInButton from './GoogleSignInBtn';
import { useNavigate } from 'react-router-dom';
import { sendVerificationCode } from '../api/sendVerificationCode';
import { checkIfActive, GoogleAuthResponse } from  '../api/checkIfActive';
import { loginWithEmail } from '../api/loginWithEmail';
import { getCsrfToken } from '../api/getCsrfToken';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../app/store';
import { loginSuccess } from '../slices/authSlice';

const SignUp: React.FC = () => {
  const [emailAddress, setEmailAddress] = useState('');
  const [accountAlreadyActivated, setAccountAlreadyActive] = useState(false);

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const dispatch = useDispatch<AppDispatch>();

  const navigate = useNavigate();

  const sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  const handleSubmit = async () => {
    setStatus('loading');

    try {
      const response = await getCsrfToken();

      const csrfToken = response.csrfToken;

      // Search for a user in the database who has
      // the email address that was inputted.
      const data: GoogleAuthResponse = await checkIfActive(
        emailAddress, csrfToken
      );

      if (data.message !== 'Active user already exists in the database') {
        await sendVerificationCode(emailAddress);

        navigate('/email-sent');
      }else{
        setAccountAlreadyActive(true);        

        await sleep(3000);

        const response = await loginWithEmail(emailAddress, csrfToken);

        console.log('response:', response);

        dispatch(loginSuccess({ user: emailAddress, csrfToken: csrfToken }));

        navigate('/chat');
      }

      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-4">
          Sign Up
        </h2>

        {accountAlreadyActivated ?
          <p className='mb-4 text-center text-lg'>
            You already have an active account linked to the
            email you inputted. You will be signed in now.
          </p>
          :
          <>
            <p className='mb-4 text-center text-lg'>
              Sign up now to uncover the depths where brilliance lies,
              To see your knowledge ascend like an emerging sunrise.
            </p>

            <GoogleSignInButton />

            <label htmlFor="emailAddress"
              className={`
                block
                text-gray-700
                text-lg
              `}>
              Email address
            </label>

            <input
              id="emailAddress"
              name="emailAddress"
              type="email"
              required
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              className={`
                text-lg
                block
                w-full
                rounded-md
                border
                border-gray-300
                px-3
                py-2
                focus:outline-none
                focus:ring-2
                focus:ring-indigo-500
                mt-1
                mb-4
              `}
              placeholder="Input your email address"
              disabled={status === 'loading'}
            />

            <Button
              onClick={handleSubmit}
              className={`
                w-full
                bg-gray-200 hover:bg-gray-300
                font-semibold
                rounded-md
                transition
                flex items-center justify-center gap-2
                text-gray-800
              `}
            >
              Continue with email address
            </Button>

            <div className="flex justify-center items-center text-lg mt-4">
              {status === 'success' && <p>Verification email sent!</p>}
              {status === 'error' && <p>Failed to send verification email.</p>}
            </div>

            <div className="flex justify-center items-center text-lg mt-4">
              {status === 'success' && <p>Verification email sent!</p>}
              {status === 'error' && <p>Failed to send verification email.</p>}
            </div>
          </>
        }
      </div>
    </div>
  );
};

/* The subsequent line is a default export, which is
   the common convention for React components that
   represent a single main export from a file. */
export default SignUp;