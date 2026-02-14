export default {
    routes: [
        {
            method: 'POST',
            path: '/email/send-test',
            handler: 'email.sendTest',
            config: { policies: [], auth: false },
        },
        {
            method: 'POST',
            path: '/email/send-welcome',
            handler: 'email.sendWelcome',
            config: { policies: [], auth: false },
        },
        {
            method: 'POST',
            path: '/email/send-password-reset',
            handler: 'email.sendPasswordReset',
            config: { policies: [], auth: false },
        },
        {
            method: 'POST',
            path: '/email/send-reservation',
            handler: 'email.sendReservation',
            config: { policies: [], auth: false },
        },
        {
            method: 'POST',
            path: '/email/send-session-reminder',
            handler: 'email.sendSessionReminder',
            config: { policies: [], auth: false },
        },
    ],
};
