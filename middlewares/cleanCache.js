const { clearCache } = require('../services/cache');

module.exports = async (req, res, next) => {
  // Await processing next function.
  await next();

  clearCache(req.user.id);
};
