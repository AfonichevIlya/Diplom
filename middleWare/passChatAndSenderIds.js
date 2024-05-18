const passChatAndSenderIds = (req, res, next) => {
  // Добавляем id чата и id отправителя к объекту req
  req.chatId = req.params.id; // Присваиваем id чата из параметра маршрута
  req.senderId = req.user.id; // Присваиваем id отправителя из объекта пользователя (если он доступен)
  next(); // Передаем управление следующему middleware или обработчику маршрута
};

module.exports = passChatAndSenderIds;
