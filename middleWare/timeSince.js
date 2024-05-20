function timeSince(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval + " год" + (interval > 1 ? "а" : "") + " назад";
  }
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval + " месяц" + (interval > 1 ? "а" : "") + " назад";
  }
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval + " день" + (interval > 1 ? "ев" : "") + " назад";
  }
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval + " час" + (interval > 1 ? "ов" : "") + " назад";
  }
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval + " минут" + (interval > 1 ? "ы" : "а") + " назад";
  }
  return seconds + " секунд" + (seconds > 1 ? "" : "а") + " назад";
}
module.exports = timeSince;
