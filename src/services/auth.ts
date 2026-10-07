const PARENT_PASSWORD_KEY = 'lernheld_parent_password_hash_v1';

// Hash string using SHA-256 via native browser Web Crypto API
export const hashPassword = async (password: string): Promise<string> => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password.trim());
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Simple fallback for environments without crypto.subtle
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return `fallback_${hash}`;
};

export const hasParentPassword = (): boolean => {
  try {
    return !!localStorage.getItem(PARENT_PASSWORD_KEY);
  } catch {
    return false;
  }
};

export const saveParentPassword = async (password: string): Promise<void> => {
  try {
    const hashed = await hashPassword(password);
    localStorage.setItem(PARENT_PASSWORD_KEY, hashed);
  } catch (e) {
    console.error('Failed to save parent password', e);
  }
};

export const verifyParentPassword = async (inputPassword: string): Promise<boolean> => {
  try {
    const storedHash = localStorage.getItem(PARENT_PASSWORD_KEY);
    if (!storedHash) return true; // No password set
    const inputHash = await hashPassword(inputPassword);
    return storedHash === inputHash;
  } catch (e) {
    console.error('Failed to verify password', e);
    return false;
  }
};

export const removeParentPassword = (): void => {
  try {
    localStorage.removeItem(PARENT_PASSWORD_KEY);
  } catch (e) {
    console.error('Failed to remove password', e);
  }
};
