import api from '../api/axios';

const STORAGE_KEY = 'BUILDCONNECT_GOOGLE_CLIENT_ID';

export const getGoogleClientId = async () => {
  // 1. Check local storage override first
  const localId = localStorage.getItem(STORAGE_KEY);
  if (localId && isGoogleClientIdValid(localId)) {
    return localId.trim();
  }

  // 2. Check Vite environment variable
  const viteId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (viteId && isGoogleClientIdValid(viteId)) {
    return viteId.trim();
  }

  // 3. Check backend config
  try {
    const res = await api.get('/auth/google/config');
    if (res.data?.clientId && isGoogleClientIdValid(res.data.clientId)) {
      return res.data.clientId.trim();
    }
  } catch (err) {
    console.warn('Could not fetch Google config from backend:', err);
  }

  return '';
};

export const saveGoogleClientId = (clientId) => {
  if (!clientId) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, clientId.trim());
};

export const isGoogleClientIdValid = (clientId) => {
  if (!clientId || typeof clientId !== 'string') return false;
  const clean = clientId.trim();
  if (clean === 'your-google-client-id.apps.googleusercontent.com') return false;
  // A standard Google OAuth Client ID has numbers followed by apps.googleusercontent.com
  return clean.endsWith('.apps.googleusercontent.com') && clean.length > 25;
};

// Wait for the Google Identity Services SDK (GIS) to be loaded on window
export const ensureGsiLoaded = () => {
  return new Promise((resolve) => {
    if (window.google?.accounts?.oauth2) {
      return resolve(true);
    }

    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      if (window.google?.accounts?.oauth2) {
        clearInterval(interval);
        return resolve(true);
      }
      if (attempts > 30) {
        // 3 seconds timeout
        clearInterval(interval);
        resolve(false);
      }
    }, 100);
  });
};

/**
 * Triggers Google's real OAuth Account Chooser popup with `prompt: 'select_account'`
 * to show all logged in Google accounts on the device.
 */
export const launchGoogleAccountChooser = async ({
  clientId,
  role = 'CLIENT',
  onSuccess,
  onError,
}) => {
  const isLoaded = await ensureGsiLoaded();
  if (!isLoaded || !window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services SDK could not be loaded. Please check your internet connection.');
  }

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        prompt: 'select_account', // Forces Google to show all accounts on this device/browser
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            const msg = tokenResponse.error_description || tokenResponse.error;
            onError?.(msg);
            return reject(new Error(msg));
          }

          try {
            // Fetch the selected user's Google profile from Google userinfo API
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });

            if (!userInfoRes.ok) {
              throw new Error('Failed to retrieve user info from Google.');
            }

            const profile = await userInfoRes.json();
            const accountData = {
              name: profile.name || profile.given_name || 'Google User',
              email: profile.email,
              avatarUrl: profile.picture || '',
              googleId: profile.sub,
              role,
            };

            onSuccess?.(accountData);
            resolve(accountData);
          } catch (fetchErr) {
            onError?.(fetchErr.message);
            reject(fetchErr);
          }
        },
      });

      // Launch the native Google Account Chooser popup
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      onError?.(err.message);
      reject(err);
    }
  });
};
