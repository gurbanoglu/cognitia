import { 
  BrowserRouter as Router,
  Routes,
  Route } from 'react-router-dom';

// The better practice is to exclude the file
// extension when importing components.
import SignUp from "./components/SignUp";
import EmailSent from "./components/EmailSent";
import Chat from "./components/Chat";
import ConfirmEmail from "./components/ConfirmEmail";
import "./App.css";

const App = () => (
  <Router>
    <Routes>
      <Route path="/sign-up" element={<SignUp />} />

      <Route path="/email-sent" element={<EmailSent />} />

      <Route path="/confirm-email/:activationToken"
        element={<ConfirmEmail />} />

      <Route path="/chat" element={<Chat />} />

      <Route path="/chat/:slug" element={<Chat />} />
    </Routes>
  </Router>
);

export default App;