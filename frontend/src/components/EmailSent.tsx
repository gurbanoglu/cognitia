import React, { useState } from 'react';

const EmailSent: React.FC = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [accountAlreadyActive, setAccountAlreadyActive] = useState(false);

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    // TODO: Add code verification logic here
    alert(`Code submitted: ${code}`);
  };

  return (
    <div className={`
      min-h-screen
      flex items-center
      justify-center
      bg-gray-50 px-4
    `}>
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">
          {accountAlreadyActive ?
            <>
              Your account is already active.
            </>
            :
            <>
              Verify your account sign up by clicking on the link in the email sent.
              You can close this tab now.
            </>
          }
        </h2>
      </div>
    </div>
  );
};

export default EmailSent;