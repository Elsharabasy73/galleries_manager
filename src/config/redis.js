const Redis = require("ioredis");

const { getEnvironment } = require("./env");

let redis;

const getRedis = () => {
  if (!redis) {
    const { redisUrl } = getEnvironment();
    const isHerokuTlsConnection =
      Boolean(process.env.DYNO) && redisUrl.startsWith("rediss://");
    // Keep TLS encryption enabled while working around Heroku Redis's untrusted certificate chain.
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
      ...(isHerokuTlsConnection && {
        tls: { rejectUnauthorized: false },
      }),
    });

    redis.on("error", (err) => {
      console.error("[redis] error", err.message);
    });
  }

  return redis;
};

const disconnectRedis = async () => {
  if (redis) {
    try {
      await redis.quit();
    } catch (err) {
      console.error("[redis] error during disconnect", err.message);
    } finally {
      redis = undefined;
    }
  }
};

module.exports = { getRedis, disconnectRedis };
