
import CryptoJS from 'crypto-js';

// In a production app, this should be a robust environment variable or key management system.
// For this implementation, we combine this salt with the User ID to ensure
// one user cannot decrypt another user's data even if they accessed the DB.
const APP_SECRET = 'life-sync-secure-salt-v1';

const generateKey = (uid: string) => {
    return `${uid}-${APP_SECRET}`;
};

/**
 * Encrypts a string value
 */
export const encryptText = (text: string, uid: string): string => {
    if (!text) return text;
    try {
        return CryptoJS.AES.encrypt(text, generateKey(uid)).toString();
    } catch (e) {
        console.error("Encryption failed", e);
        return text;
    }
};

/**
 * Decrypts a string value.
 * Includes a safety check: if decryption fails (malformed or already plain text),
 * it returns the original text. This ensures backward compatibility.
 */
export const decryptText = (ciphertext: string, uid: string): string => {
    if (!ciphertext) return ciphertext;
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, generateKey(uid));
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText || ciphertext; // Fallback if result is empty (invalid key)
    } catch (e) {
        // If it fails, it might be plain text from before encryption was added
        return ciphertext;
    }
};

/**
 * Helper to encrypt specific fields of an object
 */
export const encryptObject = <T extends Record<string, any>>(
    obj: T, 
    uid: string, 
    fieldsToEncrypt: (keyof T)[]
): T => {
    const newObj = { ...obj };
    fieldsToEncrypt.forEach(field => {
        if (typeof newObj[field] === 'string') {
            newObj[field] = encryptText(newObj[field], uid) as any;
        }
    });
    return newObj;
};

/**
 * Helper to decrypt specific fields of an object
 */
export const decryptObject = <T extends Record<string, any>>(
    obj: T, 
    uid: string, 
    fieldsToDecrypt: (keyof T)[]
): T => {
    const newObj = { ...obj };
    fieldsToDecrypt.forEach(field => {
        if (typeof newObj[field] === 'string') {
            newObj[field] = decryptText(newObj[field], uid) as any;
        }
    });
    return newObj;
};
