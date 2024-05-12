const VKontakteStrategy = require("passport-vkontakte").Strategy;
const logger = require("../logger/index");
require("dotenv").config();

function passportFunctionVK(passport) {
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
    new VKontakteStrategy(
      {
        clientID: process.env.VK_CLIENT_ID,
        clientSecret: process.env.VK_CLIENT_SECRET,
        callbackURL: "http://localhost/auth/vkontakte/callback",
      },
      function (accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
          logger.info(`Получили профиль от VK ${profile.name}`);
          return done(null, profile);
        });
      }
    )
  );
}

module.exports = passportFunctionVK;
