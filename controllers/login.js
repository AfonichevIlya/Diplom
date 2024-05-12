const User = require("../models/user");
exports.form = (req, res) => {
  res.render("loginForm", { title: "Login" });
};

exports.submit = (req, res, next) => {
  User.authentificate(req.body.loginForm, (error, data) => {
    if (error) return next(error);
    if (!data) {
      res.error("loginForm", {
        title: "Login",
        errorMessage: "Почта или пароль неверные",
      });
    } else {
      req.session.userEmail = data.email;
      req.session.userName = data.name;
      res.redirect("/");
    }
  });
};
exports.logout = function (req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error("Ошибка при уничтожении сессии: ", err);
      return res.redirect("back");
    }
    res.locals.user = null;
    res.redirect("/");
  });
};
