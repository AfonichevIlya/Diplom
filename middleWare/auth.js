const User = require("../models/user");

module.exports = async function (req, res, next) {
  try {
    if (req.session.userEmail) {
      const userData = await User.findByEmail(req.session.userEmail);
      if (userData) {
        req.user = res.locals.user = userData;
        res.locals.admin = userData.isAdmin === 1 ? true : false;
      }
    }
    if (req.session.passport) {
      res.locals.user = req.session.passport.user;
    }
    next();
  } catch (err) {
    return next(err);
  }
};
