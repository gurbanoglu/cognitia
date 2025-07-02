import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Provider } from 'react-redux';
import store from './app/store';
import App from './App'
import './index.css'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function Root() {
  if (!clientId) {
    return (
      <div style={{ padding: 20, color: 'red', fontWeight: 'bold' }}>
        Error: Google OAuth Client ID is not configured.
        Please set VITE_GOOGLE_CLIENT_ID in your environment variables.
      </div>
    );
  }

  return (
    <Provider store={store}>
      <GoogleOAuthProvider clientId={clientId}>
        <App />
      </GoogleOAuthProvider>
    </Provider>
  );
}

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing in index.html');

const root = ReactDOM.createRoot(container);

root.render(<Root />);