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
import "./App.css";

const App = () => (
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

export default App;