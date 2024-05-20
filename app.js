const express = require("express");
const favicon = require("express-favicon");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const message = require("./middleware/message");
const messanger = "https://kappa.lol/iSONv";
const link = "https://kappa.lol/VMimi";
const bodyParser = require("body-parser");
const logger = require("./logger/index");
const passport = require("passport");
const passportFunction = require("./middleware/passport_jwt");
const passportFunctionYandex = require("./middleware/passport_yandex");
const passportFunctionGoogle = require("./middleware/passport_go");
const passportFunctionGitHub = require("./middleware/passport_github");
const passportFunctionVkontakte = require("./middleware/passport_vkontakte");
const socketIo = require("socket.io");
const moment = require("moment");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("test.sqlite");
const http = require("http");
const passChatAndSenderIds = require("./middleWare/passChatAndSenderIds");
const winston = require("winston");
const app = express();
app.locals.moment = moment;
app.use(bodyParser.json());
const server = http.createServer(app);
const io = socketIo(server);
app.use(bodyParser.urlencoded({ extended: true }));
const myRoutes = require("./routers/index_routers");
const userSession = require("./middleware/user_session");
const passportFunctionJWT = require("./middleware/passport_jwt");

require("dotenv").config;
const port = process.env.PORT;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
const flash = require("connect-flash");
app.use(flash());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(express.static(path.join(__dirname, "css")));
app.use(express.static(path.join(__dirname, "views")));
app.use("/uploads", express.static("uploads"));
// app.use(morgan("tiny"));
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
passportFunctionJWT(passport);
passportFunctionYandex(passport);
passportFunctionGoogle(passport);
passportFunctionGitHub(passport);
passportFunctionVkontakte(passport);
app.use(
  "/css/bootstrap.css",
  express.static(
    path.join(
      __dirname,
      "public/css/bootstrap-5.3.2/dist/css/bootstrap.min.css"
    )
  )
);

app.use(favicon(__dirname + "/public/img/logo.png"));
app.use(userSession);
app.use(message);
app.use(myRoutes);

app.get("/", (req, res) => {
  res.render("registerForm.ejs", { link: link, messanger: messanger });
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("set username", (username) => {
    socket.username = username;
  });

  socket.on("chat message", (data) => {
    const message = {
      username: data.username,
      time: Date.now(),
      text: data.message,
    };
    io.emit("chat message", message);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});
app.use(passChatAndSenderIds);

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("message chat", (data) => {
    const message = {
      username: data.username,
      time: new Date().toISOString(), // Use ISO string for consistency
      text: data.message,
      sender_id: data.senderId,
      chat_id: data.chatId,
      avatar: data.avatar, // Ensure this matches the database field name
    };

    // Emit the message to all clients
    io.emit("message chat", message);

    // Insert the message into the database
    db.run(
      `INSERT INTO messages (username, time, text, sender_id, chat_id, avatar) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        message.username,
        message.time,
        message.text,
        message.sender_id,
        message.chat_id,
        message.avatar, // Include avatar in the insert statement
      ],
      (err) => {
        if (err) {
          console.error("Error saving message to the database:", err);
        } else {
          console.log("Message saved to the database successfully.");
        }
      }
    );
  });
});

///////////////////

// Message event handler
const handleMessage = (chatId, message) => {
  io.to(chatId).emit("message chat", message);
};
app.set("io", io);
// Pass the function to your routes
app.set("handleMessage", handleMessage);
server.listen(port, () => {
  console.log("Сервер запущен на http://localhost:80");
});
/////////////
