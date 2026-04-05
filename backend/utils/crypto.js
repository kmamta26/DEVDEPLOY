const CryptoJS = require('crypto-js');

const SECRET_KEY = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'devdeploy_fallback_key_2024';

/**
 * Encrypt a plaintext string using AES-256 (CryptoJS).
 * @param {string} text
 * @returns {string} Ciphertext string
 */
function encrypt(text) {
  if (!text) throw new Error('encrypt(): text is required');
  return CryptoJS.AES.encrypt(text.toString(), SECRET_KEY).toString();
}

/**
 * Decrypt an AES-256 ciphertext back to plaintext.
 * @param {string} ciphertext
 * @returns {string} Plaintext
 */
function decrypt(ciphertext) {
  if (!ciphertext) throw new Error('decrypt(): ciphertext is required');
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  if (!decrypted) throw new Error('decrypt(): Failed — invalid ciphertext or wrong key');
  return decrypted;
}

module.exports = { encrypt, decrypt };
