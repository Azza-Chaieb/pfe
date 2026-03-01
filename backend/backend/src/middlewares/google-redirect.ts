export default (config, { strapi }) => {
    return async (ctx, next) => {
        // 1. Let Strapi's default controller run first.
        await next();

        // 2. Intercept the redirect to the frontend.
        if (ctx.path.includes('/api/connect/google/callback') && ctx.status === 302) {
            const location = ctx.response.get('location');
            if (!location) return;

            try {
                const url = new URL(location, 'http://localhost');
                const googleIdToken = url.searchParams.get('id_token') || url.searchParams.get('access_token');

                // If we have a Google token but NO Strapi user attached.
                if (googleIdToken && !url.searchParams.has('user')) {
                    strapi.log.info('🎟️ [Middleware] Google Token detected for swap...');

                    // 3. Decode email from Google ID Token
                    const parts = googleIdToken.split('.');
                    if (parts.length !== 3) return;
                    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                    const email = payload.email?.toLowerCase();

                    if (email) {
                        strapi.log.info(`🔍 [Middleware] Looking for user: ${email}`);

                        // 4. Robust Lookup Strategy with Retries
                        let user = null;
                        for (let attempt = 1; attempt <= 3; attempt++) {
                            user = await strapi.db.query('plugin::users-permissions.user').findOne({
                                where: {
                                    $or: [
                                        { email: email },
                                        { username: email }
                                    ]
                                },
                                populate: ['role']
                            });

                            if (user) break;

                            strapi.log.info(`⏳ [Middleware] User ${email} not found yet (Attempt ${attempt}/3). Waiting 1s...`);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }

                        // 5. MANUAL CREATION FALLBACK (New User Case)
                        if (!user) {
                            strapi.log.info(`🐣 [Middleware] User ${email} ABSOLUTELY NOT FOUND. Forcing manual registration...`);
                            try {
                                const advancedSettings = await strapi.store({ type: 'plugin', name: 'users-permissions', key: 'advanced' }).get();
                                const defaultRole = await strapi.db.query('plugin::users-permissions.role').findOne({
                                    where: { type: advancedSettings.default_role }
                                });

                                if (!defaultRole) throw new Error("Could not find default role in Strapi settings.");

                                user = await strapi.entityService.create('plugin::users-permissions.user', {
                                    data: {
                                        username: email,
                                        email: email,
                                        provider: 'google',
                                        confirmed: true,
                                        role: defaultRole.id,
                                        user_type: null,
                                        phone: Date.now() + Math.floor(Math.random() * 1000000), // Generate unique phone to avoid DB conflict
                                        password: Math.random().toString(36).slice(-15)
                                    }
                                });
                                strapi.log.info(`✅ [Middleware] Manually created user ${email} (ID: ${user.id})`);
                            } catch (createErr) {
                                strapi.log.error(`❌ [Middleware] Manual creation failed: ${createErr.message}`);
                            }
                        }

                        if (user) {
                            // 6. Issue a REAL Strapi JWT.
                            const jwtService = strapi.plugin('users-permissions').service('jwt');
                            const strapiToken = jwtService.issue({ id: user.id });

                            // 7. Redirect to frontend with CORRECT credentials.
                            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                            const safeUser = {
                                id: user.id,
                                email: user.email,
                                username: user.username,
                                user_type: user.user_type
                            };

                            const finalRedirect = `${frontendUrl}/connect/google/redirect?id_token=${strapiToken}&user=${encodeURIComponent(JSON.stringify(safeUser))}`;

                            strapi.log.info(`🚀 [Middleware] SUCCESS! Swapped token for ${email}. (User ID: ${user.id})`);
                            return ctx.redirect(finalRedirect);
                        } else {
                            strapi.log.warn(`❌ [Middleware] User ${email} could not be resolved or created.`);
                        }
                    }
                }
            } catch (err) {
                strapi.log.error(`❌ [Middleware] Pipeline Error: ${err.message}`);
            }
        }
    };
};
