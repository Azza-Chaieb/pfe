export default {
  routes: [
    {
      method: "POST",
      path: "/auth-custom/verify-otp",
      handler: "auth-custom.verifyOtp",
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/auth-custom/resend-otp",
      handler: "auth-custom.resendOtp",
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/auth-custom/check-phone",
      handler: "auth-custom.checkPhone",
      config: {
        auth: false,
      },
    },
  ],
};
