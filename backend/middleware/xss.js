const sanitize = (val) => {
  if (typeof val === 'string') {
    return val
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  if (Array.isArray(val)) {
    return val.map(sanitize);
  }
  if (typeof val === 'object' && val !== null) {
    const clean = {};
    for (const key in val) {
      clean[key] = sanitize(val[key]);
    }
    return clean;
  }
  return val;
};

const xssClean = (req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
};

module.exports = xssClean;
