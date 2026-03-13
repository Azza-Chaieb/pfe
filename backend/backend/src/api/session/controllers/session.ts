import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::session.session', ({ strapi }) => ({
  async createLive(ctx) {
    const { user } = ctx.state;
    if (!user) return ctx.unauthorized("Vous devez être connecté");

    try {
      const { title, date, time, duration, sessionType, meetingUrl, maxCapacity, course } = ctx.request.body;
      
      const newSession = await strapi.documents('api::session.session').create({
        data: {
          title,
          date,
          time,
          duration,
          sessionType,
          meetingUrl,
          maxCapacity: maxCapacity || 100,
          course: course,
          trainer: user.id,
        },
        status: 'published'
      });
      return ctx.send({ data: newSession });
    } catch (err) {
      return ctx.badRequest("Erreur création session", err);
    }
  },

  async mySessions(ctx) {
    const { user } = ctx.state;
    if (!user) return ctx.unauthorized();

    try {
      // Find sessions where user is either student or trainer
      const sessions = await strapi.documents('api::session.session').findMany({
        filters: {
          $or: [
            { trainer: { id: user.id } },
            { students: { id: user.id } }
          ]
        },
        populate: ['course', 'trainer', 'students']
      });
      return ctx.send({ data: sessions });
    } catch (err) {
      return ctx.badRequest(err.message);
    }
  },

  async register(ctx) {
    const { user } = ctx.state;
    const { id } = ctx.params;
    if (!user) return ctx.unauthorized();

    try {
      const session = await strapi.documents('api::session.session').findOne({
        documentId: id,
        populate: ['students']
      });

      if (!session) return ctx.notFound("Session introuvable");

      const currentStudents = session.students || [];
      const isAlreadyRegistered = currentStudents.some(s => s.id === user.id);

      if (isAlreadyRegistered) {
        return ctx.badRequest("Vous êtes déjà inscrit");
      }

      if (currentStudents.length >= (session.maxCapacity || 100)) {
        return ctx.badRequest("La session a atteint sa capacité maximale");
      }

      const updated = await strapi.documents('api::session.session').update({
        documentId: id,
        data: {
          students: [...currentStudents.map(s => s.id), user.id]
        }
      });

      return ctx.send({ data: updated });
    } catch (err) {
      return ctx.badRequest(err.message);
    }
  },

  async attendance(ctx) {
    const { user } = ctx.state;
    const { id } = ctx.params;
    const { attendance } = ctx.request.body; // array or object of user ids

    if (!user) return ctx.unauthorized();

    try {
      const updated = await strapi.documents('api::session.session').update({
        documentId: id,
        data: {
          attendance: attendance
        }
      });

      return ctx.send({ data: updated });
    } catch (err) {
      return ctx.badRequest(err.message);
    }
  }
}));
