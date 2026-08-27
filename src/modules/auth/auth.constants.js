const OTP_PURPOSE = {
  email_verification: "email_verification",
  password_reset: "password_reset",
}

const EMAIL_SUBJECTS = {
  email_verification: "Verify your email address",
  password_reset: "Password reset code",
}

const OTP_TTL_SECONDS = 300;

const COOLDOWN_TTL_SECONDS = 60;

const MAX_ATTEMPTS = 5;

module.exports = {
  OTP_PURPOSE,
  EMAIL_SUBJECTS,
  OTP_TTL_SECONDS,
  COOLDOWN_TTL_SECONDS,
  MAX_ATTEMPTS,
}
