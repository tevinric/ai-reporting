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
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }

  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
      const account = event.payload.account;
      msalInstance.setActiveAccount(account);
    }
  });

  msalInstance.handleRedirectPromise().then((tokenResponse) => {
    if (tokenResponse !== null) {
      msalInstance.setActiveAccount(tokenResponse.account);
    }
  }).catch((error) => {
    console.error('Redirect error:', error);
  });
});

export { msalInstance };

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </React.StrictMode>
);
