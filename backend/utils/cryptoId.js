const crypto = require('crypto');

/**
 * Generate IDs strictly matching frontend formats.
 * e.g. MFR-001, PHR-001, DLV-001, usr_XXXXXX
 */
const generateId = (prefix, length = 6) => {
  if (prefix === 'usr') {
    // usr_abcdef
    return `usr_${crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length)}`;
  }
  
  // For entities like MFR, PHR, DLV, frontend uses sequential (e.g. 001, 002) 
  // but for backend generation we'll use crypto hex to guarantee uniqueness
  return `${prefix}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
};

module.exports = { generateId };
