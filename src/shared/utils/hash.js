const crypto = require("node:crypto");
const { promisify } = require("node:util");

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

const hashValue = async (value) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(value, salt, KEY_LENGTH);

  return `${salt}:${derivedKey.toString("hex")}`;
};

const compareHash = async (value, storedHash) => {
  const [salt, key] = storedHash.split(":");

  if (!salt || !key) {
    return false;
  }

  const storedKey = Buffer.from(key, "hex");
  const derivedKey = await scrypt(value, salt, storedKey.length);

  return crypto.timingSafeEqual(storedKey, derivedKey);
};

module.exports = { compareHash, hashValue };
