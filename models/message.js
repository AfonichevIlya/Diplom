const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("test.sqlite");

class Message {
  constructor(sender, recipient, text) {
    this.sender = sender;
    this.recipient = recipient;
    this.text = text;
    this.timestamp = new Date().toISOString(); // Дата и время отправки
  }

  static create(message, cb) {
    const sql =
      "INSERT INTO messages (sender, recipient, text, timestamp) VALUES (?, ?, ?, ?)";
    db.run(
      sql,
      [message.sender, message.recipient, message.text, message.timestamp],
      function (err) {
        if (err) {
          console.error("Ошибка при сохранении сообщения:", err);
          return cb(err);
        }
        cb(null, { ...message, id: this.lastID });
      }
    );
  }

  static getAllByUser(email, cb) {
    const sql = "SELECT * FROM messages WHERE sender = ? OR recipient = ?";
    db.all(sql, [email, email], (err, rows) => {
      if (err) {
        console.error("Ошибка при получении сообщений:", err);
        return cb(err);
      }
      cb(null, rows);
    });
  }
}

module.exports = Message;
