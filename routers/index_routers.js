const express = require("express");
const router = express.Router();
const register = require("../controllers/register");
const login = require("../controllers/login");
const entries = require("../controllers/entries");
const validatePassword = require("../middleWare/pass_validation");
const User = require("../models/user");
const timeSince = require("../middleware/timeSince");
const multer = require("multer");
const path = require("path");
const validate = require("../middleWare/validation");
const passport = require("passport");
const ensureAuthenticated = require("../middleware/auth");
const bodyParser = require("body-parser");
const axios = require("axios");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("test.sqlite");

const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.use(router);

router.get("/", entries.list);

router.get("/post", entries.form);
router.post(
  "/post",

  entries.submit
);

router.get("/update/:id", entries.updateForm);
router.post("/update/:id", entries.updateSubmit);

router.delete("/:id", (req, res, next) => {
  if (req.user.role === "guest") {
    return res.status(403).send("Guests cannot delete posts.");
  }
  entries.delete(req, res, next);
});

router.get("/register", register.form);
router.post("/register", validatePassword, register.submit);

router.get("/login", login.form);
router.post("/login", login.submit);
router.get("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
      }
      res.locals.user = null;
      res.redirect("/");
    });
  } else {
    res.locals.user = null;
    res.redirect("/");
  }
});
router.get("/guest", (req, res) => {
  User.createGuest((error, guestUser) => {
    if (error) {
      console.error("Error creating guest user:", error);
      return res.redirect("/register");
    }

    req.session.userEmail = guestUser.email;
    req.session.userName = guestUser.name;
    req.session.isGuest = true;
    res.redirect("/");
  });
});
router.get("/profile", (req, res) => {
  if (!req.session.userEmail) {
    return res.redirect("/login");
  }

  User.findByEmail(req.session.userEmail, (err, user) => {
    if (err || !user) {
      res
        .status(500)
        .send("Произошла ошибка при получении информации о пользователе");
    } else {
      res.render("profile", { title: "Профиль", user: user });
    }
  });
});
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/avatars/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

router.post("/profile", upload.single("avatar"), (req, res, next) => {
  if (!req.file) {
    return res.status(400).send("Нет файла для загрузки");
  }
});
router.post("/profile/avatar", upload.single("avatar"), (req, res, next) => {
  if (!req.file) {
    return res.status(400).send("Нет файла для загрузки.");
  }

  const avatarPath = req.file.filename;

  User.updateAvatar(req.session.userEmail, avatarPath, (err) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .send("Ошибка при обновлении аватара пользователя.");
    } else {
      return res.redirect("/profile");
    }
  });
});
router.get("/auth/yandex", passport.authenticate("yandex"));

router.get(
  "/auth/yandex/callback",
  passport.authenticate("yandex", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/");
  }
);

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);
router.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);
router.get("/auth/vkontakte", passport.authenticate("vkontakte"));

router.get(
  "/auth/vkontakte/callback",
  passport.authenticate("vkontakte", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);
router.get("/music", function (req, res) {
  res.render("music");
});
/////////////////////

router.get("/messages", ensureAuthenticated, function (req, res) {
  console.log("req.user:", req.user); // Вывод отладочной информации
  if (!req.user || !req.user.name) {
    // Проверка, что пользователь и его имя установлены корректно
    res.status(401).send("Unauthorized"); // Отправка ответа о неаутентифицированном доступе
  } else {
    res.render("chat", { username: req.user.name }); // Рендеринг шаблона с именем пользователя
  }
});
router.use(bodyParser.json());

// Обработчик запроса для получения списка треков
router.get("/tracks", (req, res) => {
  axios
    .get("https://api.jamendo.com/v3.0/tracks/?client_id=b2b8fa60&limit=200")
    .then((response) => {
      const tracks = response.data.results.map((track) => {
        return {
          name: track.name,
          audio: track.audio,
        };
      });
      res.json(tracks);
    })
    .catch((error) => {
      res.status(500).json({ error: "Ошибка при получении списка треков" });
    });
});

// Предположим, что у вас есть база данных для хранения избранных треков
// и здесь будет соответствующий код для работы с базой данных

// Обработчик запроса для добавления трека в избранное
router.post("/favorites", (req, res) => {
  const { track } = req.body;

  // Вставляем новый трек в таблицу favorite_tracks
  db.run(
    `INSERT INTO favorite_tracks (name) VALUES (?)`,
    [track.name],
    function (err) {
      if (err) {
        console.error("Ошибка при добавлении трека в избранное:", err);
        res
          .status(500)
          .json({ error: "Ошибка при добавлении трека в избранное" });
      } else {
        res.json({ message: "Трек успешно добавлен в избранное" });
      }
    }
  );
});

// Обработчик запроса для получения избранных треков
router.get("/favorites", (req, res) => {
  // Извлекаем все треки из таблицы favorite_tracks
  db.all(`SELECT * FROM favorite_tracks`, (err, rows) => {
    if (err) {
      console.error("Ошибка при получении избранных треков:", err);
      res.status(500).json({ error: "Ошибка при получении избранных треков" });
    } else {
      res.json(rows);
    }
  });
});
router.delete("/favorites/:name", (req, res) => {
  const { name } = req.params;

  // Удаляем трек из таблицы favorite_tracks по его имени
  db.run(`DELETE FROM favorite_tracks WHERE name = ?`, [name], function (err) {
    if (err) {
      console.error("Ошибка при удалении трека из избранного:", err);
      res
        .status(500)
        .json({ error: "Ошибка при удалении трека из избранного" });
    } else {
      res.json({ message: "Трек успешно удален из избранного" });
    }
  });
});
//////////
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      text TEXT NOT NULL,
      time DATETIME DEFAULT CURRENT_TIMESTAMP,
      sender_id INTEGER,
      chat_id INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1_id INTEGER,
      user2_id INTEGER,
      FOREIGN KEY(user1_id) REFERENCES users(id),
      FOREIGN KEY(user2_id) REFERENCES users(id)
    )
  `);
});

router.get("/chats", (req, res) => {
  db.all(
    `SELECT chats.*, u1.name as user1_name, u2.name as user2_name
    FROM chats
    JOIN users u1 ON chats.user1_id = u1.id
    JOIN users u2 ON chats.user2_id = u2.id`,
    [],
    (err, chats) => {
      if (err) {
        console.error("Ошибка получения чатов:", err);
        return res.status(500).send("Ошибка получения чатов.");
      }
      db.all(`SELECT * FROM users`, [], (err, users) => {
        if (err) {
          console.error("Ошибка получения списка пользователей:", err);
          return res.status(500).send("Ошибка получения списка пользователей.");
        }
        res.render("chats", { users, chats });
      });
    }
  );
});
router.get("/add-friend", (req, res) => {
  db.all(`SELECT * FROM users`, [], (err, users) => {
    if (err) {
      console.error("Ошибка получения списка пользователей:", err);
      return res.status(500).send("Ошибка получения списка пользователей.");
    }
    res.render("addFriend", { users });
  });
});
const passChatAndSenderIds = (req, res, next) => {
  // Добавляем id чата и id отправителя к объекту req
  req.chatId = req.params.id;
  req.senderId = req.user.id;
  next();
};

router.post("/chats", passChatAndSenderIds, (req, res) => {
  const { user2_id } = req.body;
  const user1_id = req.user.id;
  const chatId = req.chatId; // Используйте переданный id чата
  const senderId = req.senderId;

  db.get(
    `SELECT id FROM chats WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`,
    [user1_id, user2_id, user2_id, user1_id],
    (err, chat) => {
      if (err) {
        console.error("Ошибка проверки существующего чата:", err);
        return res.status(500).send("Ошибка проверки существующего чата.");
      }
      if (chat) {
        return res.redirect(`/chats/${chat.id}`);
      } else {
        db.run(
          `INSERT INTO chats (user1_id, user2_id) VALUES (?, ?)`,
          [user1_id, user2_id],
          function (err) {
            if (err) {
              console.error("Ошибка создания чата:", err);
              return res.status(500).send("Ошибка создания чата.");
            }
            res.redirect(`/chats/${this.lastID}`);
          }
        );
      }
    }
  );
});

router.get("/chats/:id", passChatAndSenderIds, (req, res) => {
  const chatId = req.params.id;
  db.all(
    `SELECT messages.*, users.name AS sender_username 
    FROM messages 
    JOIN users ON messages.sender_id = users.id 
    WHERE chat_id = ?`,
    [chatId],
    (err, messages) => {
      if (err) {
        console.error("Ошибка получения сообщений:", err);
        return res.status(500).send("Ошибка получения сообщений.");
      }
      res.render("messages", { chatId, messages });
    }
  );
});

router.get("/messages", ensureAuthenticated, (req, res) => {
  console.log("req.user:", req.user);
  if (!req.user || !req.user.name) {
    res.status(401).send("Unauthorized");
  } else {
    db.all(
      `SELECT username, text, time FROM messages ORDER BY time ASC`,
      [],
      (err, rows) => {
        if (err) {
          console.error("Error fetching messages:", err.message); // Log the error
          res.status(500).send("Internal Server Error");
        } else {
          res.render("chat", { username: req.user.name, messages: rows });
        }
      }
    );
  }
});
// Инициализация Socket.IO
router.get("/chats/:id/messages", passChatAndSenderIds, (req, res) => {
  const chatId = req.params.id;
  db.all(
    `SELECT messages.*, users.name AS sender_username 
    FROM messages 
    JOIN users ON messages.sender_id = users.id 
    WHERE chat_id = ?`,
    [chatId],
    (err, messages) => {
      if (err) {
        console.error("Ошибка получения сообщений:", err);
        return res.status(500).send("Ошибка получения сообщений.");
      }
      res.json(messages); // Отправляем сообщения в формате JSON
    }
  );
});
app.use(router);

module.exports = router;
