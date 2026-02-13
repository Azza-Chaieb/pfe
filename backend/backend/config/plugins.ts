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
};
