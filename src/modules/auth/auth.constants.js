const OTP_PURPOSE = {
  email_verification: "email_verification",
  password_reset: "password_reset",
}

const EMAIL_SUBJECTS = {
  email_verification: "Verify your email address",
  password_reset: "Password reset code",
}

const OTP_TTL_SECONDS = 300;

const COOLDOWN_TTL_SECONDS = 120;

const MAX_ATTEMPTS = 5;

// After successful password-reset OTP verification, allow password reset within this window.
const PASSWORD_RESET_VERIFIED_TTL_SECONDS = 600;

module.exports = {
  OTP_PURPOSE,
  EMAIL_SUBJECTS,
  OTP_TTL_SECONDS,
  COOLDOWN_TTL_SECONDS,
  MAX_ATTEMPTS,
  PASSWORD_RESET_VERIFIED_TTL_SECONDS,
}
