const Redis = require("ioredis");

const { getEnvironment } = require("./env");

let redis;

const getRedis = () => {
  if (!redis) {
    const { redisUrl } = getEnvironment();
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    redis.on("error", (err) => {
      console.error("[redis] error", err.message);
    });
  }

  return redis;
};

const disconnectRedis = async () => {
  if (redis) {
    await redis.quit();
    redis = undefined;
  }
};

module.exports = { getRedis, disconnectRedis };
