function timeSince(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return (
      interval + " " + pluralize(interval, "год", "года", "лет") + " назад"
    );
  }
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return (
      interval +
      " " +
      pluralize(interval, "месяц", "месяца", "месяцев") +
      " назад"
    );
  }
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return (
      interval + " " + pluralize(interval, "день", "дня", "дней") + " назад"
    );
  }
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return (
      interval + " " + pluralize(interval, "час", "часа", "часов") + " назад"
    );
  }
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return (
      interval +
      " " +
      pluralize(interval, "минута", "минуты", "минут") +
      " назад"
    );
  }
  return (
    Math.floor(seconds) +
    " " +
    pluralize(seconds, "секунда", "секунды", "секунд") +
    " назад"
  );
}

function pluralize(
  value,
  singularNominative,
  singularGenitive,
  pluralGenitive
) {
  const valueMod10 = value % 10;
  const valueMod100 = value % 100;

  if (valueMod100 >= 11 && valueMod100 <= 19) {
    return pluralGenitive;
  }
  if (valueMod10 > 1 && valueMod10 < 5) {
    return singularGenitive;
  }
  if (valueMod10 === 1) {
    return singularNominative;
  }
  return pluralGenitive;
}

module.exports = timeSince;
