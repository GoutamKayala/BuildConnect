const STORAGE_KEY = 'BUILDCONNECT_DEVICE_ACCOUNTS';

export const DEFAULT_DEVICE_ACCOUNTS = [];

export const getDeviceGoogleAccounts = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DEVICE_ACCOUNTS));
      return DEFAULT_DEVICE_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const existingEmails = new Set(parsed.map((a) => a.email.toLowerCase()));
      const missing = DEFAULT_DEVICE_ACCOUNTS.filter(
        (def) => !existingEmails.has(def.email.toLowerCase())
      );
      if (missing.length > 0) {
        const merged = [...parsed, ...missing];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DEVICE_ACCOUNTS));
    return DEFAULT_DEVICE_ACCOUNTS;
  } catch (err) {
    console.error('Error reading device Google accounts:', err);
    return DEFAULT_DEVICE_ACCOUNTS;
  }
};

export const saveDeviceGoogleAccount = (account) => {
  try {
    const accounts = getDeviceGoogleAccounts();
    const cleanEmail = account.email.toLowerCase().trim();
    const existingIndex = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);

    const updatedAccount = {
      name: account.name || 'Google User',
      email: cleanEmail,
      avatarUrl:
        account.avatarUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name || 'User')}&background=2563eb&color=fff`,
      role: account.role || 'CLIENT',
      googleId: account.googleId || `google_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      lastUsedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      accounts[existingIndex] = { ...accounts[existingIndex], ...updatedAccount };
    } else {
      accounts.unshift(updatedAccount);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    localStorage.setItem('last_user_email', cleanEmail);
    localStorage.setItem('last_user_name', updatedAccount.name);
    return accounts;
  } catch (err) {
    console.error('Error saving device Google account:', err);
    return [];
  }
};

export const removeDeviceGoogleAccount = (email) => {
  try {
    const accounts = getDeviceGoogleAccounts().filter(
      (a) => a.email.toLowerCase() !== email.toLowerCase().trim()
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    return accounts;
  } catch (err) {
    console.error('Error removing device Google account:', err);
    return [];
  }
};
