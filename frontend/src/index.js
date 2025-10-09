import React from 'react';
import ReactDOM from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { msalConfig } from './config/authConfig';
import './index.css';
import App from './App';

const msalInstance = new PublicClientApplication(msalConfig);

// Handle the redirect promise when the page loads
msalInstance.initialize().then(() => {
  return msalInstance.handleRedirectPromise();
}).then((tokenResponse) => {
  // Handle redirect response
  if (tokenResponse !== null) {
    console.log('Login redirect successful:', tokenResponse.account);
    msalInstance.setActiveAccount(tokenResponse.account);

    // If we just completed authentication and are on login page, redirect to dashboard
    if (window.location.pathname === '/login' || window.location.pathname === '/') {
      window.history.replaceState(null, '', '/');
    }
  } else {
    // Check if there's already an account
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);

      // If user is already authenticated and on login page, redirect to dashboard
      if (window.location.pathname === '/login') {
        window.history.replaceState(null, '', '/');
      }
    }
  }

  // Add event callback for login success
  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
      const account = event.payload.account;
      msalInstance.setActiveAccount(account);
    }
  });

  // Render app after authentication is handled
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </React.StrictMode>
  );
}).catch((error) => {
  console.error('Authentication initialization error:', error);

  // Still render the app even if there's an error
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </React.StrictMode>
  );
});

export { msalInstance };
