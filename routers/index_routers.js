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
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
} = require("../controllers/friendController");
const FriendRequest = require("../models/friendRequest");

const db = new sqlite3.Database("test.sqlite");

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
const getAcceptedFriends = (userId, callback) => {
  db.all(
    `SELECT * FROM friend_requests WHERE (sender = ? OR recipient = ?) AND status = 'accepted'`,
    [userId, userId],
    (err, friendRequests) => {
      if (err) {
        console.error("Ошибка при получении списка друзей:", err);
        callback(err, null);
      } else {
        // Extract IDs of friends
        const friendIds = friendRequests.map((request) =>
          request.sender === userId ? request.recipient : request.sender
        );

        // Retrieve information about friends from the User model
        User.findManyById(friendIds, (err, friends) => {
          if (err) {
            console.error("Ошибка при получении информации о друзьях:", err);
            callback(err, null);
          } else {
            callback(null, friends);
          }
        });
      }
    }
  );
};
const getPendingFriends = (userId, callback) => {
  db.all(
    `SELECT * FROM friend_requests WHERE (sender = ? OR recipient = ?) AND status = 'pending'`,
    [userId, userId],
    (err, friendRequests) => {
      if (err) {
        console.error("Ошибка при получении списка друзей:", err);
        callback(err, null);
      } else {
        // Создаем массив для хранения ID друзей
        const friendIds = [];

        // Проходим по каждому запросу в друзья
        friendRequests.forEach((request) => {
          // Определяем ID друга на основе отправителя и получателя
          const friendId =
            request.sender === userId ? request.recipient : request.sender;
          // Добавляем ID друга в массив, если его еще нет там
          if (!friendIds.includes(friendId)) {
            friendIds.push(friendId);
          }
        });

        // Получаем информацию о друзьях из таблицы пользователей
        User.findManyById(friendIds, (err, friends) => {
          if (err) {
            console.error("Ошибка при получении информации о друзьях:", err);
            callback(err, null);
          } else {
            callback(null, friends);
          }
        });
      }
    }
  );
};

////////////////////
const getFriends = (userId, callback) => {
  db.all(
    `SELECT * FROM friend_requests WHERE (sender = ? OR recipient = ?) AND status = 'accepted'`,
    [userId, userId],
    (err, friendRequests) => {
      if (err) {
        console.error("Error getting friends:", err);
        callback(err, null);
      } else {
        // Extract usernames of friends
        const friends = friendRequests.map((request) =>
          request.sender === userId ? request.recipient : request.sender
        );
        callback(null, friends);
      }
    }
  );
};

// Assuming you have a route to render the addFriend.ejs template
router.get("/friends", (req, res) => {
  // Get the list of friends for the current user
  const userId = req.user.id; // Assuming you have a way to retrieve the user ID
  getFriends(userId, (err, friends) => {
    if (err) {
      console.error("Error getting friends:", err);
      // Handle the error
    } else {
      // Render the addFriend.ejs template with the list of friends
      res.render("addFriend", { friends });
    }
  });
});

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

// Маршрут для обработки отправки запроса на добавление в друзья
router.post("/add-friend", (req, res) => {
  const senderName = req.user && req.user.name;
  const recipientName = req.body.friendName; // Получаем имя получателя из запроса
  const senderAvatar = req.user && req.user.avatar;

  // Проверка, что recipientName не пустое значение
  if (!recipientName) {
    return res
      .status(400)
      .json({ error: "Не указан получатель запроса в друзья" });
  }

  // Вставляем новый запрос в таблицу friend_requests
  db.run(
    `INSERT INTO friend_requests (sender, sender_avatar, recipient) VALUES (?, ?, ?)`,
    [senderName, senderAvatar, recipientName],
    function (err) {
      if (err) {
        console.error("Ошибка при отправке запроса в друзья:", err);
        return res
          .status(500)
          .json({ error: "Ошибка при отправке запроса в друзья" });
      } else {
        // После успешной отправки запроса, обновляем список друзей
        updateFriendList(req, res, senderName);
      }
    }
  );
});
function updateFriendList(req, res, userName) {
  // Извлекаем список друзей из базы данных
  db.all(
    `SELECT * FROM friend_requests WHERE sender = ? OR recipient = ?`,
    [userName, userName],
    (err, friends) => {
      if (err) {
        console.error("Ошибка при получении списка друзей:", err);
        // Возможно, здесь нужно обработать ошибку
      } else {
        res.render("addFriend", { friends: friends }); // Передаем список друзей в шаблон
      }
    }
  );
}
// Маршрут для отображения страницы запросов в друзья
router.get("/friend-requests", (req, res) => {
  // Извлекаем список запросов в друзья из базы данных
  db.all(`SELECT * FROM friend_requests`, (err, friendRequests) => {
    if (err) {
      console.error("Ошибка при получении запросов в друзья:", err);
      res.status(500).json({ error: "Ошибка при получении запросов в друзья" });
    } else {
      // Для каждого запроса в друзья получаем информацию о пользователе-отправителе
      const requestsWithSenders = [];
      friendRequests.forEach((request) => {
        User.findByEmail(request.sender, (err, sender) => {
          if (err) {
            console.error(
              "Ошибка при получении информации об отправителе:",
              err
            );
          } else {
            requestsWithSenders.push({ request, sender });
            // Если информация о всех отправителях получена, рендерим страницу
            if (requestsWithSenders.length === friendRequests.length) {
              res.render("friendRequests", {
                friendRequests: requestsWithSenders,
              });
            }
          }
        });
      });
    }
  });
});
router.post("/friend-requests", (req, res) => {
  const userId = req.user.id;

  FriendRequest.getFriendRequestsForUser(userId, (err, friendRequests) => {
    if (err) {
      console.error("Error getting friend requests:", err);
      return res.status(500).json({ error: "Error getting friend requests" });
    }
    res.render("friendRequests", { friendRequests, user: req.user });
  });
});
// Маршрут для принятия запроса в друзья
router.post("/accept-friend", (req, res) => {
  const { requestId } = req.body;

  FriendRequest.updateFriendRequestStatus(
    requestId,
    "accepted",
    (err, changes) => {
      if (err) {
        console.error("Error accepting friend request:", err);
        return res
          .status(500)
          .json({ error: "Error accepting friend request" });
      }
      res.redirect("/friend-requests");
    }
  );
});

// Маршрут для отклонения запроса в друзья
router.post("/reject-friend", (req, res) => {
  const { requestId } = req.body;

  FriendRequest.updateFriendRequestStatus(
    requestId,
    "rejected",
    (err, changes) => {
      if (err) {
        console.error("Error rejecting friend request:", err);
        return res
          .status(500)
          .json({ error: "Error rejecting friend request" });
      }
      // Redirect back to the friend requests page
      res.redirect("/friend-requests");
    }
  );
});
router.get("/my-friends", (req, res) => {
  const userId = req.user.id; // Предполагается, что у тебя есть объект пользователя в запросе
  getAcceptedFriends(userId, (err, friends) => {
    if (err) {
      console.error("Ошибка при получении списка друзей:", err);
      // Обработка ошибки
      res.status(500).send("Ошибка при получении списка друзей");
    } else {
      console.log("Список друзей:", friends); // Логирование списка друзей
      res.render("myFriends", { friends: friends }); // Передача списка друзей в шаблон
    }
  });

  FriendRequest.getAcceptedFriendRequestsForUser(userId, (err, friends) => {
    if (err) {
      console.error("Error getting friends:", err);
      res.status(500).send("Internal Server Error");
    } else {
      // Рендерим шаблон и передаем данные о друзьях в него
      res.render("my-friends", { friends });
    }
  });
});
module.exports = router;
