const dotenv = require("dotenv");

const VALID_NODE_ENVIRONMENTS = ["development", "test", "production"];

dotenv.config({ quiet: true });
//this function will throw an error if the environment variable is not defined
const requireEnvironmentVariable = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const getEnvironment = () => {
  const nodeEnv = process.env.NODE_ENV || "development";

  if (!VALID_NODE_ENVIRONMENTS.includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnv}`);
  }

  const port = Number.parseInt(process.env.PORT || "3000", 10);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return {
    nodeEnv,
    port,
    jwtSecret: requireEnvironmentVariable("JWT_SECRET"),
    databaseUrl: requireEnvironmentVariable("DATABASE_URL"),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  };
};

module.exports = { getEnvironment };
