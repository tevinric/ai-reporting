import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { loginRequest } from '../config/authConfig';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const { instance, accounts, inProgress } = useMsal();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            if (accounts.length > 0) {
                const account = accounts[0];

                try {
                    const response = await instance.acquireTokenSilent({
                        ...loginRequest,
                        account: account
                    });

                    const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
                        headers: {
                            Authorization: `Bearer ${response.accessToken}`
                        }
                    });

                    if (graphResponse.ok) {
                        const userData = await graphResponse.json();
                        setUser({
                            name: userData.displayName || account.name,
                            email: userData.mail || userData.userPrincipalName || account.username,
                            username: account.username,
                            account: account
                        });
                    } else {
                        setUser({
                            name: account.name,
                            email: account.username,
                            username: account.username,
                            account: account
                        });
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    setUser({
                        name: account.name,
                        email: account.username,
                        username: account.username,
                        account: account
                    });
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        };

        if (inProgress === InteractionStatus.None) {
            fetchUserData();
        }
    }, [accounts, instance, inProgress]);

    const getAccessToken = async () => {
        if (accounts.length > 0) {
            const request = {
                ...loginRequest,
                account: accounts[0]
            };

            try {
                const response = await instance.acquireTokenSilent(request);
                return response.accessToken;
            } catch (error) {
                console.error('Error acquiring token:', error);
                const response = await instance.acquireTokenPopup(request);
                return response.accessToken;
            }
        }
        return null;
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        getAccessToken
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
