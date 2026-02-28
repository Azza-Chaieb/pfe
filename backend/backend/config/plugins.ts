export default {
  "users-permissions": {
    config: {
      register: {
        allowedFields: [
          "fullname",
          "phone",
          "user_type",
          "confirmed",
          "otp_code",
        ],
      },
      jwt: {
        expiresIn: "7d",
      },
      passwordResetToken: {
        url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password`,
      },
      providers: {
        google: {
          enabled: true,
          icon: "google",
          key: process.env.GOOGLE_CLIENT_ID,
          secret: process.env.GOOGLE_CLIENT_SECRET,
          callback: `${process.env.BACKEND_URL || "http://localhost:1337"}/api/connect/google/callback`,
        },
      },
    },
  },
  email: {
    config: {
      provider: "nodemailer",
      providerOptions: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      settings: {
        defaultFrom: process.env.SMTP_FROM,
        defaultReplyTo: process.env.SMTP_REPLY_TO,
      },
    },
  },
  upload: {
    config: {
      responsiveDimensions: false,
      breakpoints: false,
    },
  },
};
