const User = require("../models/user");

module.exports = function (req, res, next) {
  if (req.session.isGuest) {
    req.user = {
      email: "guest@example.com",
      name: "гость",
      role: "guest",
    };
    res.locals.user = req.user;
    return next();
  }

  if (req.session.userEmail) {
    User.findByEmail(req.session.userEmail, (error, user) => {
      if (error) return next(error);

      if (user) {
        req.user = user;
      } else {
        req.session.destroy();
        req.user = undefined;
      }
      res.locals.user = req.user;
      return next();
    });
  } else {
    return next();
  }
};
