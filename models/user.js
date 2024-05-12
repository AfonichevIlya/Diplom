const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("test.sqlite");

const sql =
  "CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, password TEXT NOT NULL, age INT NOT NULL, role TEXT DEFAULT 'user', avatar TEXT)";
db.run(sql);

class User {
  constructor() {}

  static createGuest(cb) {
    const guestData = {
      name: "гость",
      email: "guest@nomail.com",
      age: 0,
      role: "guest",
    };

    cb(null, guestData);
  }
  static create(dataForm, cb) {
    dataForm.role = dataForm.role || "user";
    const sql1 =
      "INSERT INTO users (name, email, password, age, role) VALUES (?, ?, ?, ?, ?)";
    db.run(
      sql1,
      dataForm.name,
      dataForm.email,
      dataForm.password,
      dataForm.age,
      dataForm.role,
      function (err) {
        cb(err, { ...dataForm, id: this.lastID });
      }
    );
  }

  static findByEmail(email, cb) {
    db.get("SELECT * FROM users WHERE email = ?", email, function (err, row) {
      if (err) {
        if (cb) {
          cb(err);
        }
      } else {
        if (cb) {
          cb(null, row);
        }
      }
    });
  }
  static authentificate(dataForm, cb) {
    User.findByEmail(dataForm.email, (error, user) => {
      if (error) return cb(error);
      if (!user) return cb();
      if (dataForm.password === user.password) {
        return cb(null, user);
      } else {
        cb();
      }
    });
  }

  static updateAvatar(email, avatarFilename, cb) {
    const sql = "UPDATE users SET avatar = ? WHERE email = ?";
    db.run(sql, [avatarFilename, email], function (err) {
      if (err) {
        console.error("Ошибка обновления аватара:", err);
      }
      cb(err);
    });
  }
  static updateFriendList(req, res, userName) {
    // Ваша логика обновления списка друзей
  }
  static findManyById(ids, callback) {
    // Создаем пустой массив для хранения результатов
    const users = [];

    // Генерируем динамический список параметров запроса на основе количества идентификаторов
    const placeholders = ids.map(() => "?").join(",");

    // Выполняем запрос к базе данных для получения информации о пользователях по их идентификаторам
    db.all(
      `SELECT * FROM users WHERE id IN (${placeholders})`,
      ids,
      (err, rows) => {
        if (err) {
          console.error(
            "Ошибка при получении информации о пользователях:",
            err
          );
          callback(err, null);
        } else {
          // Если запрос выполнен успешно, добавляем результаты в массив пользователей
          rows.forEach((row) => {
            users.push(row);
          });
          // Затем вызываем колбэк с полученными пользователями
          callback(null, users);
        }
      }
    );
  }
}
module.exports = User;
