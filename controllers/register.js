const pass_validation = require("../middleware/pass_validation");
const User = require("../models/user");
const validateEmail = require("../middleware/post_validation");

exports.form = (req, res) => {
  res.render("registerForm", { title: "Register" });
};

exports.submit = [
  pass_validation,

  (req, res, next) => {
    const { email } = req.body;
    if (!validateEmail(email)) {
      res.render("registerForm", {
        title: "Register",
        emailError: "Неверный формат электронной почты.",
      });
    } else {
      User.findByEmail(req.body.email, (error, user) => {
        if (error) return next(error);
        if (user) {
          console.log("Такой пользователь в базе уже существует");
          res.redirect("/");
        } else {
          User.create(req.body, (err) => {
            if (err) return next(err);
            req.session.userEmail = req.body.email;
            req.session.userName = req.body.name;
            res.redirect("/");
          });
        }
      });
    }
  },
];
