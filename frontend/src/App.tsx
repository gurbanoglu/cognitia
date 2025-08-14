import { 
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';

// The better practice is to exclude the file
// extension when importing components.
import SignUp from "./components/SignUp";
import EmailSent from "./components/EmailSent";
import ChatPage from "./components/ChatPage";
import ConfirmEmail from "./components/ConfirmEmail";
import SendMessage from "./components/InputField";
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess, logout } from './slices/authSlice';
import "./App.css";
import axios from 'axios';

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await axios.get('/auth-status/', { withCredentials: true });
        if (res.data.authenticated) {
          dispatch(loginSuccess({
            user: res.data.email,
            csrfToken: res.data.csrfToken
          }));
        } else {
          dispatch(logout());
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        dispatch(logout());
      }
    };

    checkAuthStatus();
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        <Route path="/sign-up" element={<SignUp />} />

        <Route path="/email-sent" element={<EmailSent />} />

        <Route path="/confirm-email/:activationToken"
          element={<ConfirmEmail />} />

        <Route path="/chat-page" element={<ChatPage />} />

        <Route path="/chat-page/:slug" element={<ChatPage />} />
      </Routes>
    </Router>
  );
};

export default App;