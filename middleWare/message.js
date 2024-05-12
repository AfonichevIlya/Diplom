const express = require("express");

function message(req) {
  return (msg, type) => {
    type = type || "info";
    let sess = req.session;
    sess.messages = sess.messages || [];
    sess.messages.push({ type: type, string: msg });
  };
}

module.exports = function (req, res, next) {
  res.pushFunction = message(req);
  res.error = (msg) => {
    return res.pushFunction(msg, "error");
  };
  res.locals.messages = req.session.messages || [];
  res.locals.removeMessages = function () {
    req.session.messages = [];
  };
  next();
};
