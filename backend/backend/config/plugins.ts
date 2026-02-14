export default {
  'users-permissions': {
    config: {
      register: {
        allowedFields: ['fullname', 'phone', 'user_type'],
      },
      jwt: {
        expiresIn: '7d',
      },
    },
  },
  email: {
    config: {
      provider: 'nodemailer',
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
