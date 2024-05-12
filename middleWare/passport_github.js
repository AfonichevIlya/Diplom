const GitHubStrategy = require("passport-github").Strategy;
const logger = require("../logger/index");
require("dotenv").config();

function passportFunctionGitHub(passport) {
  passport.serializeUser(function (user, done) {
    const newUser = {};
    (newUser.id = user.id),
      (newUser.email = user._json.email),
      (newUser.name = user.displayName),
      //   (newUser.age = user.birthday ? date.now() - user.birthday : 0),
      done(null, newUser);
  });

  passport.deserializeUser(function (obj, done) {
    done(null, obj);
  });
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "http://localhost:80/auth/github/callback",
      },
      function (accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
          logger.info(`Получили профиль от GitHub ${profile.name}`);
          return done(null, profile);
        });
      }
    )
  );
}

module.exports = passportFunctionGitHub;
