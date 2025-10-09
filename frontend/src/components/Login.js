import React, { useState, useEffect } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import { loginRequest, validateConfig } from '../config/authConfig';
import { Shield, CheckCircle, BarChart3, Lock, AlertCircle, Bot } from 'lucide-react';
import '../styles/Login.css';

const Login = () => {
    const { instance, accounts, inProgress } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!validateConfig()) {
            setError('Azure configuration is incomplete. Please check environment variables.');
        }
    }, []);

    // Redirect authenticated users immediately
    useEffect(() => {
        if ((isAuthenticated || accounts.length > 0) && inProgress === 'none') {
            console.log('User already authenticated, redirecting to dashboard...');
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, accounts.length, inProgress, navigate]);

    const handleLogin = async () => {
        setError(null);
        setIsLoading(true);

        try {
            if (accounts.length > 0) {
                console.log('User already authenticated:', accounts[0]);
                setIsLoading(false);
                return;
            }

            console.log('Initiating Entra ID redirect login...');
            await instance.loginRedirect(loginRequest);

        } catch (error) {
            console.error('Entra ID login failed:', error);
            setIsLoading(false);

            if (error.errorCode === 'user_cancelled') {
                setError('Login was cancelled. Please try again.');
            } else if (error.errorCode === 'consent_required') {
                setError('Additional permissions required. Please contact your administrator.');
            } else if (error.errorCode === 'interaction_required') {
                setError('Interaction required. Please try logging in again.');
            } else {
                setError(`Login failed: ${error.message || 'Unknown error occurred'}`);
            }
        }
    };

    if (inProgress === 'login') {
        return (
            <div className="login-container">
                <div className="login-wrapper">
                    <div className="login-card" style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="loading-spinner"></div>
                        <h2>Signing you in...</h2>
                        <p>Please wait while we redirect you to Microsoft Entra ID</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-wrapper">
                <div className="login-card">
                    <div className="login-logo-container">
                        <div className="login-logo">
                            <Bot size={48} strokeWidth={1.5} />
                        </div>
                    </div>

                    <div className="login-header">
                        <h1 className="login-title">TIH AI Center of Excellence</h1>
                        <p className="login-subtitle">
                            AI and RPA Initiative Monitoring
                        </p>
                        <p className="login-description">
                            Track, monitor, and report on all AI and RPA initiatives across the organization
                        </p>
                    </div>

                    {error && (
                        <div className="error-message" style={{
                            background: '#fee2e2',
                            border: '1px solid #fca5a5',
                            borderRadius: '6px',
                            padding: '12px',
                            margin: '16px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#dc2626'
                        }}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="login-features">
                        <div className="login-feature">
                            <BarChart3 className="login-feature-icon" />
                            <p className="login-feature-text">Monitor Initiatives</p>
                        </div>
                        <div className="login-feature">
                            <CheckCircle className="login-feature-icon" />
                            <p className="login-feature-text">Track Progress</p>
                        </div>
                        <div className="login-feature">
                            <Shield className="login-feature-icon" />
                            <p className="login-feature-text">Secure Reporting</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogin}
                        className={`login-button ${isLoading ? 'loading' : ''}`}
                        disabled={isLoading || !!error}
                        style={{ opacity: (isLoading || error) ? 0.6 : 1 }}
                    >
                        {isLoading ? (
                            <span>Redirecting to Microsoft...</span>
                        ) : (
                            <>
                                <svg viewBox="0 0 23 23" className="microsoft-logo">
                                    <path fill="#f25022" d="M0 0h11v11H0z"/>
                                    <path fill="#00a4ef" d="M12 0h11v11H12z"/>
                                    <path fill="#7fba00" d="M0 12h11v11H0z"/>
                                    <path fill="#ffb900" d="M12 12h11v11H12z"/>
                                </svg>
                                <span>Authenticate with AD</span>
                            </>
                        )}
                    </button>

                    <div className="login-security">
                        <Shield size={16} />
                        <span className="login-security-text">
                            Enterprise-grade security with Microsoft Entra ID
                        </span>
                    </div>

                    <div className="login-divider"></div>

                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <p style={{ fontSize: '0.75rem', color: '#718096' }}>
                            <Lock style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
                            Your data is encrypted and secure
                        </p>
                    </div>
                </div>

                <div className="login-footer">
                    <p className="login-footer-text">
                        By signing in, you agree to use this system for authorized purposes only.
                        <br />
                        All activities are logged and monitored for security compliance.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
