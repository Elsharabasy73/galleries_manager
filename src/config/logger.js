const logger = Object.freeze({
  error: (...args) => console.error(...args),
  info: (...args) => console.log(...args),
  warn: (...args) => console.warn(...args),
});

module.exports = logger;
