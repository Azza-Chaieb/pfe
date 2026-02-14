export default (config, { strapi }) => {
    return async (ctx, next) => {
        try {
            await next();
        } catch (err) {
            if (err.status === 500 || !err.status) {
                strapi.log.error('❌ --- BUG 500 DETECTÉ ---');
                strapi.log.error(`📍 Chemin: ${ctx.path}`);
                strapi.log.error(`📥 Méthode: ${ctx.method}`);
                strapi.log.error(`📝 Message: ${err.message}`);
                strapi.log.error(`📁 Files: ${ctx.request.files ? Object.keys(ctx.request.files) : 'Aucun'}`);
                strapi.log.error(`🔍 Stack: ${err.stack}`);
                strapi.log.error('---------------------------');
            }
            throw err;
        }
    };
};
