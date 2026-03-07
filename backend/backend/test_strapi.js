const strapi = require('@strapi/strapi');

strapi().start().then(async (app) => {
    console.log("Strapi started!");
    try {
        const spaces = await app.entityService.findMany('api::space.space');
        const space = spaces[0];

        if (!space) {
            console.log("No spaces!");
            process.exit(0);
        }
        console.log("Testing with space:", space.documentId);

        // Test creating booking using EntityService, which mimics what happens when Document API creates it.
        // In Strapi v5, Document API accepts the same relations syntax.
        const newBooking = await app.documents('api::booking.booking').create({
            data: {
                start_time: new Date().toISOString(),
                end_time: new Date(Date.now() + 3600).toISOString(),
                status: 'pending',
                space: space.documentId, // Direct documentId format
                total_price: 100,
            }
        });

        console.log("Created successfully with Space:", newBooking.space);

        const fetched = await app.documents('api::booking.booking').findOne({
            documentId: newBooking.documentId,
            populate: ['space']
        });
        console.log("Fetched relation space:", fetched.space?.documentId);

    } catch (e) {
        console.error("Failed:", e);
    }
    process.exit(0);
});
