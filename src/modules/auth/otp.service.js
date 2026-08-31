const crypto = require("node:crypto");

const { getRedis } = require("../../config/redis");
const ApiError = require("../../shared/utils/ApiError");
const generateOtp = require("../../shared/utils/generateOTP");
const {
  OTP_TTL_SECONDS,
  COOLDOWN_TTL_SECONDS,
  MAX_ATTEMPTS,
  PASSWORD_RESET_VERIFIED_TTL_SECONDS,
} = require("./auth.constants");

const keyOtp = (userId) => `otp:email_verification:${userId}`;
const keyCooldown = (userId) => `otp:email_verification:cooldown:${userId}`;
const keyAttempts = (userId) => `otp:email_verification:attempts:${userId}`;

// Password-reset keys (mirrors email_verification with separate namespace + verified flag)
const keyResetOtp = (userId) => `otp:password_reset:${userId}`;
const keyResetCooldown = (userId) => `otp:password_reset:cooldown:${userId}`;
const keyResetAttempts = (userId) => `otp:password_reset:attempts:${userId}`;
const keyResetVerified = (userId) => `otp:password_reset:verified:${userId}`;

const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

const VERIFY_LUA = `
local otpKey = KEYS[1]
local attemptsKey = KEYS[2]
local providedHash = ARGV[1]
local maxAttempts = tonumber(ARGV[2])
local storedHash = redis.call("GET", otpKey)
if not storedHash then
  return {0, "expired"}
end
if storedHash == providedHash then
  redis.call("DEL", otpKey)
  redis.call("DEL", attemptsKey)
  return {1, "ok"}
end
local attempts = redis.call("INCR", attemptsKey)
if attempts == 1 then
  local ttl = redis.call("TTL", otpKey)
  if ttl > 0 then
    redis.call("EXPIRE", attemptsKey, ttl)
  else
    redis.call("EXPIRE", attemptsKey, 300)
  end
end
if attempts >= maxAttempts then
  redis.call("DEL", otpKey)
  redis.call("DEL", attemptsKey)
  return {0, "max_attempts"}
end
return {0, "invalid"}
`;

/**
 * Generates a 6-digit OTP, hashes with SHA-256, stores in Redis with 300s TTL.
 * Enforces 60s cooldown via separate key. Returns raw OTP for email sending.
 */
const requestVerificationOtp = async (userId) => {
  const redis = getRedis();
  const cooldownKey = keyCooldown(userId);

  const onCooldown = await redis.get(cooldownKey);
  if (onCooldown) {
    const ttl = await redis.ttl(cooldownKey);
    throw new ApiError(
      `Please wait ${ttl > 0 ? ttl : 60}s before requesting another code`,
      429,
    );
  }

  const otp = generateOtp();
  const hashed = hashOtp(otp);

  await redis.set(keyOtp(userId), hashed, "EX", OTP_TTL_SECONDS);
  await redis.set(cooldownKey, "1", "EX", COOLDOWN_TTL_SECONDS);
  await redis.del(keyAttempts(userId));

  return otp;
};

/**
 * Atomically verifies OTP using Lua script (GET+DEL race-safe).
 * Tracks failed attempts, invalidates after MAX_ATTEMPTS.
 */
const verifyVerificationOtp = async (userId, otp) => {
  const redis = getRedis();
  const hashed = hashOtp(otp);

  const result = await redis.eval(
    VERIFY_LUA,
    2,
    keyOtp(userId),
    keyAttempts(userId),
    hashed,
    String(MAX_ATTEMPTS),
  );

  const [ok, reason] = result;

  if (ok === 1) {
    return true;
  }

  if (reason === "expired") {
    throw new ApiError(
      "OTP expired or not found. Please request a new code",
      400,
    );
  }

  if (reason === "max_attempts") {
    throw new ApiError(
      "Too many invalid attempts. OTP invalidated. Please request a new code",
      400,
    );
  }

  throw new ApiError("Invalid OTP", 400);
};

/**
 * Password-reset: same semantics as email verification but with isolated Redis namespace.
 * On successful verification a short-lived "verified" flag is set to gate resetPassword.
 */
const requestPasswordResetOtp = async (userId) => {
  const redis = getRedis();
  const cooldownKey = keyResetCooldown(userId);

  const onCooldown = await redis.get(cooldownKey);
  if (onCooldown) {
    const ttl = await redis.ttl(cooldownKey);
    throw new ApiError(
      `Please wait ${ttl > 0 ? ttl : 60}s before requesting another code`,
      429,
    );
  }

  const otp = generateOtp();
  const hashed = hashOtp(otp);

  await redis.set(keyResetOtp(userId), hashed, "EX", OTP_TTL_SECONDS);
  await redis.set(cooldownKey, "1", "EX", COOLDOWN_TTL_SECONDS);
  await redis.del(keyResetAttempts(userId));
  // Invalidate any prior verified flag when a new OTP is issued
  await redis.del(keyResetVerified(userId));

  return otp;
};

const verifyPasswordResetOtp = async (userId, otp) => {
  const redis = getRedis();
  const hashed = hashOtp(otp);

  const result = await redis.eval(
    VERIFY_LUA,
    2,
    keyResetOtp(userId),
    keyResetAttempts(userId),
    hashed,
    String(MAX_ATTEMPTS),
  );

  const [ok, reason] = result;

  if (ok === 1) {
    // Gate for resetPassword: presence = OTP was proven very recently
    await redis.set(
      keyResetVerified(userId),
      "1",
      "EX",
      PASSWORD_RESET_VERIFIED_TTL_SECONDS,
    );
    return true;
  }

  if (reason === "expired") {
    throw new ApiError(
      "OTP expired or not found. Please request a new code",
      400,
    );
  }

  if (reason === "max_attempts") {
    throw new ApiError(
      "Too many invalid attempts. OTP invalidated. Please request a new code",
      400,
    );
  }

  throw new ApiError("Invalid OTP", 400);
};

const isPasswordResetVerified = async (userId) => {
  const redis = getRedis();
  const val = await redis.get(keyResetVerified(userId));
  return val === "1";
};

const consumePasswordResetVerified = async (userId) => {
  const redis = getRedis();
  await redis.del(keyResetVerified(userId));
};

const clearPasswordResetOtp = async (userId) => {
  const redis = getRedis();
  await redis.del(keyResetOtp(userId));
  await redis.del(keyResetCooldown(userId));
  await redis.del(keyResetAttempts(userId));
  await redis.del(keyResetVerified(userId));
};

module.exports = {
  requestVerificationOtp,
  verifyVerificationOtp,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  isPasswordResetVerified,
  consumePasswordResetVerified,
  clearPasswordResetOtp,
};
