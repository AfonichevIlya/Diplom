const YandexStrategy = require("passport-yandex").Strategy;
const User = require("../models/user");
const logger = require("../logger/index");
require("dotenv").config();

function passportFunction(passport) {
  passport.serializeUser(function (user, done) {
    // console.log(user);
    if (user && user.id) {
      const newUser = {
        id: user.id,
        email: user.email,
        name: user.displayName,
        age: user.birthday ? Date.now() - user.birthday : 0,
      };
      done(null, newUser);
    } else {
      // Используйте другое уникальное свойство пользователя или верните ошибку
      done(new Error("User object does not contain id property"), null);
    }
  });

  passport.deserializeUser(function (obj, done) {
    done(null, obj);
  });
  passport.use(
    new YandexStrategy(
      {
        clientID: process.env.YANDEX_CLIENT_ID,
        clientSecret: process.env.YANDEX_CLIENT_SECRET,
        callbackURL: "http://127.0.0.1:80/auth/yandex/callback",
      },
      function (appToken, refreshToken, profile, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {
          // To keep the example simple, the user's Yandex profile is returned
          // to represent the logged-in user.  In a typical application, you would
          // want to associate the Yandex account with a user record in your
          // database, and return that user instead.
          logger.info(`Получили профиль от Yandex ${profile.name}`);
          return done(null, profile);
        });
      }
    )
  );
}

module.exports = passportFunction;
