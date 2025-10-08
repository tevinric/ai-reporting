/**
 * User utility functions for handling authenticated user information
 * based on environment (DEV vs PROD)
 */

const TEST_USER = {
  name: 'Tester',
  email: 'test@tester.com'
};

/**
 * Get the current user information based on environment
 * ENV=DEV: Returns test user
 * ENV=PROD: Returns authenticated user from Entra ID
 *
 * @param {Object} authenticatedUser - User object from useAuth() hook
 * @returns {Object} User object with name and email
 */
export const getCurrentUser = (authenticatedUser) => {
  const env = process.env.REACT_APP_ENV || 'DEV';

  if (env === 'DEV') {
    return TEST_USER;
  }

  // PROD environment - use authenticated user
  if (authenticatedUser && authenticatedUser.name && authenticatedUser.email) {
    return {
      name: authenticatedUser.name,
      email: authenticatedUser.email
    };
  }

  // Fallback to test user if authenticated user is not available
  console.warn('Authenticated user not available in PROD environment, using test user');
  return TEST_USER;
};

/**
 * Get the current environment mode
 * @returns {string} 'DEV' or 'PROD'
 */
export const getEnvironmentMode = () => {
  return process.env.REACT_APP_ENV || 'DEV';
};

/**
 * Check if running in development mode
 * @returns {boolean}
 */
export const isDevelopmentMode = () => {
  return getEnvironmentMode() === 'DEV';
};

/**
 * Check if running in production mode
 * @returns {boolean}
 */
export const isProductionMode = () => {
  return getEnvironmentMode() === 'PROD';
};
