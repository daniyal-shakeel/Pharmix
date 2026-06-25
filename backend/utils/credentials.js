const crypto = require('crypto');

/**
 * Generate a random secure password for new users.
 * @param {number} length - Length of the password
 * @returns {string} - Generated password
 */
const generatePassword = (length = 10) => {
  // Generate random bytes and convert to base64, then clean up and add a special character
  return crypto
    .randomBytes(length)
    .toString('base64')
    .slice(0, length)
    .replace(/[+/=]/g, 'x') + '!';
};

module.exports = { generatePassword };
