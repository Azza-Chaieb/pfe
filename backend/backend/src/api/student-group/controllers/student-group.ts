import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::student-group.student-group', ({ strapi }) => ({
  async create(ctx) {
    const { user } = ctx.state;
    if (!user) return ctx.unauthorized("Vous devez être connecté");

    if (!ctx.request.body.data) {
      ctx.request.body.data = {};
    }
    ctx.request.body.data.teacher = user.id;

    return await super.create(ctx);
  },

  async find(ctx) {
    const { user } = ctx.state;
    if (!user) return ctx.unauthorized();

    const filters = ctx.query.filters || {};
    ctx.query.filters = {
      ...(typeof filters === 'object' ? filters : {}),
      teacher: { id: user.id }
    };

    return await super.find(ctx);
  },

  async update(ctx) {
    const { user } = ctx.state;
    const { id } = ctx.params;
    if (!user) return ctx.unauthorized();

    const group: any = await strapi.documents('api::student-group.student-group').findOne({
      documentId: id,
      populate: ['teacher']
    });

    if (!group) return ctx.notFound("Groupe introuvable");
    const trainerId = group.teacher?.id || group.teacher?.documentId;
    if (trainerId && trainerId !== user.id && trainerId !== user.documentId) {
      return ctx.forbidden("Vous n'êtes pas autorisé à modifier ce groupe");
    }

    return await super.update(ctx);
  },

  async delete(ctx) {
    const { user } = ctx.state;
    const { id } = ctx.params;
    if (!user) return ctx.unauthorized();

    const group: any = await strapi.documents('api::student-group.student-group').findOne({
      documentId: id,
      populate: ['teacher']
    });

    if (!group) return ctx.notFound("Groupe introuvable");
    const trainerId = group.teacher?.id || group.teacher?.documentId;
    if (trainerId && trainerId !== user.id && trainerId !== user.documentId) {
      return ctx.forbidden("Vous n'êtes pas autorisé à supprimer ce groupe");
    }

    return await super.delete(ctx);
  },

  async addMembers(ctx) {
    const { user } = ctx.state;
    const { id } = ctx.params;
    const { userIds } = ctx.request.body;

    if (!user) return ctx.unauthorized();
    if (!Array.isArray(userIds)) return ctx.badRequest("userIds doit être un tableau");

    const group: any = await strapi.documents('api::student-group.student-group').findOne({
      documentId: id,
      populate: ['teacher', 'students']
    });

    if (!group) return ctx.notFound("Groupe introuvable");
    
    // Check ownership
    const trainerId = group.teacher?.id || group.teacher?.documentId;
    if (trainerId && trainerId !== user.id && trainerId !== user.documentId) {
      return ctx.forbidden("Vous n'êtes pas autorisé à modifier ce groupe");
    }

    // Merge unique users
    const existingIds = (group.students || []).map(s => s.documentId || s.id);
    const newIds = [...new Set([...existingIds, ...userIds])];

    const updatedGroup = await strapi.documents('api::student-group.student-group').update({
      documentId: id,
      data: { students: newIds },
      status: 'published'
    });

    return updatedGroup;
  },

  async removeMember(ctx) {
    const { user } = ctx.state;
    const { id, userId } = ctx.params;

    if (!user) return ctx.unauthorized();

    const group: any = await strapi.documents('api::student-group.student-group').findOne({
      documentId: id,
      populate: ['teacher', 'students']
    });

    if (!group) return ctx.notFound("Groupe introuvable");

    // Check ownership
    const trainerId = group.teacher?.id || group.teacher?.documentId;
    if (trainerId && trainerId !== user.id && trainerId !== user.documentId) {
      return ctx.forbidden("Vous n'êtes pas autorisé à modifier ce groupe");
    }

    const currentIds = (group.students || []).map(s => s.documentId || s.id);
    const filteredIds = currentIds.filter(cid => String(cid) !== String(userId));

    const updatedGroup = await strapi.documents('api::student-group.student-group').update({
      documentId: id,
      data: { students: filteredIds },
      status: 'published'
    });

    return updatedGroup;
  }
}));
