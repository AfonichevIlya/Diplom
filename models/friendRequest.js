const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("test.sqlite");
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS friend_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT NOT NULL,
      sender_avatar TEXT, -- Добавляем столбец для пути к аватару отправителя
      recipient TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
});
class FriendRequest {
  static updateFriendRequestStatus(requestId, status, callback) {
    const db = new sqlite3.Database("test.sqlite");
    db.run(
      `UPDATE friend_requests SET status = ? WHERE id = ?`,
      [status, requestId],
      function (err) {
        if (err) {
          console.error("Error updating friend request status:", err);
          callback(err);
        } else {
          callback(null, { changes: this.changes });
        }
      }
    );
  }
  static getAcceptedFriendRequestsForUser(userId, callback) {
    const db = new sqlite3.Database("test.sqlite");
    db.all(
      `SELECT * FROM friend_requests WHERE (sender = ? OR recipient = ?) AND status = 'accepted'`,
      [userId, userId],
      (err, rows) => {
        if (err) {
          console.error("Error getting accepted friend requests:", err);
          callback(err);
        } else {
          const friends = [];
          rows.forEach((row) => {
            const friendId = row.sender === userId ? row.recipient : row.sender;
            User.findById(friendId, (err, friend) => {
              if (err) {
                console.error("Error finding friend by id:", err);
              } else {
                friends.push(friend);
                if (friends.length === rows.length) {
                  callback(null, friends);
                }
              }
            });
          });
        }
      }
    );
  }
}

module.exports = FriendRequest;
