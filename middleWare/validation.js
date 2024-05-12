exports.getField = (req, parsedField) => {
  value = req.body[parsedField[0]][parsedField[1]];
  return value;
};
function parseField(field) {
  return field.split(/\[|\]/).filter((s) => s);
}
exports.required = (field) => {
  let parsedField = parseField(field);
  return (req, res, next) => {
    if (getField(req, parsedField)) {
      next();
    } else {
      res.error("Required");
      res.redirect("/back");
    }
  };
};
exports.lenghtAbove = (field, len) => {
  return (req, res, next) => {
    if (getField(req, field).lenght > len) {
      next();
    } else {
      res.error("Required");
      res.redirect("/back");
    }
  };
};
