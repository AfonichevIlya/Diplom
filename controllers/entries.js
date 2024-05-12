const logger = require("../logger/index");
const Entry = require("../models/entry");
const path = require("path");
const timeSince = require("../middleware/timeSince");
exports.list = (req, res, next) => {
  Entry.selectAll((err, entries) => {
    if (err) return next(err);
    const userData = req.user;
    res.render("entries", {
      title: "List",
      entries: entries,
      user: userData,
      timeSince: timeSince,
    });
    logger.info("Зашли на страницу");
  });
};

exports.form = (req, res) => {
  res.render("post", { title: "Post" });
};
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage: storage });

exports.submit = (req, res, next) => {
  const uploadSingle = upload.single("image");

  uploadSingle(req, res, function (err) {
    if (err) {
      return next(err);
    }

    try {
      const username = req.user ? req.user.name : null;
      const data = req.body.entry;
      const imageFileName = req.file ? req.file.filename : null;
      const entry = {
        username: username,
        title: data.title,
        content: data.content,
        image: imageFileName,
      };

      Entry.create(entry, (err) => {
        if (err) {
          return next(err);
        }
        res.redirect("/");
      });
    } catch (err) {
      return next(err);
    }
  });
};
exports.delete = (req, res, next) => {
  const entryId = req.params.id;
  Entry.delete(entryId, (err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
};

exports.updateForm = (req, res) => {
  const entryId = req.params.id;
  Entry.getEntryById(entryId, (err, entry) => {
    if (err) {
      return res.redirect("/");
    }
    res.render("update", { title: "Update", entry: entry });
  });
};

exports.updateSubmit = (req, res, next) => {
  const entryId = req.params.id;
  const newData = {
    title: req.body.entry.title,
    content: req.body.entry.content,
  };

  Entry.update(entryId, newData, (err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
};
