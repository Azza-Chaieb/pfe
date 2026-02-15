export default {
    routes: [
        {
            method: 'POST',
            path: '/coworking-spaces/:id/3d-model',
            handler: 'api::coworking-space.coworking-space.upload3DModel',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};
