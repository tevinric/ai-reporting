import { LogLevel } from "@azure/msal-browser";

// Azure Entra ID Configuration
export const msalConfig = {
    auth: {
        clientId: process.env.REACT_APP_AZURE_CLIENT_ID || "",
        authority: `https://login.microsoftonline.com/${process.env.REACT_APP_AZURE_TENANT_ID || ""}`,
        redirectUri: process.env.REACT_APP_REDIRECT_URI || window.location.origin,
        postLogoutRedirectUri: process.env.REACT_APP_REDIRECT_URI || window.location.origin,
        navigateToLoginRequestUrl: false,
        clientCapabilities: ["CP1"]
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: true,
        secureCookies: true
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        console.error(`MSAL Error: ${message}`);
                        return;
                    case LogLevel.Info:
                        console.info(`MSAL Info: ${message}`);
                        return;
                    case LogLevel.Verbose:
                        console.debug(`MSAL Debug: ${message}`);
                        return;
                    case LogLevel.Warning:
                        console.warn(`MSAL Warning: ${message}`);
                        return;
                    default:
                        return;
                }
            },
            logLevel: LogLevel.Info,
            piiLoggingEnabled: false
        },
        allowNativeBroker: false,
        windowHashTimeout: 60000,
        iframeHashTimeout: 6000,
        loadFrameTimeout: 0,
        asyncPopups: false
    }
};

// Login request configuration for Entra ID
export const loginRequest = {
    scopes: [
        "openid",
        "profile",
        "User.Read",
        "email"
    ],
    extraScopesToConsent: ["User.ReadBasic.All"]
};

// Microsoft Graph configuration
export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
    graphUsersEndpoint: "https://graph.microsoft.com/v1.0/users"
};

// Validate configuration
export const validateConfig = () => {
    const requiredEnvVars = [
        'REACT_APP_AZURE_CLIENT_ID',
        'REACT_APP_AZURE_TENANT_ID'
    ];

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missing.length > 0) {
        console.error('Missing required environment variables:', missing);
        return false;
    }

    return true;
};
