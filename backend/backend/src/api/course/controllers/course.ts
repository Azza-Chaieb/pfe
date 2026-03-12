/**
 * course controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::course.course', ({ strapi }) => ({
  async update(ctx) {
    const { id } = ctx.params;
    const { user } = ctx.state;

    if (!user) {
      return ctx.unauthorized("Vous devez être connecté.");
    }

    // Check ownership
    const course = await strapi.documents('api::course.course' as any).findOne({
      documentId: id,
      populate: ['trainer']
    } as any);

    if (!course) {
      return ctx.notFound("Cours non trouvé.");
    }

    if (course.trainer?.id !== user.id) {
      return ctx.forbidden("Vous n'êtes pas autorisé à modifier ce cours.");
    }

    return await super.update(ctx);
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const { user } = ctx.state;

    if (!user) {
      return ctx.unauthorized("Vous devez être connecté.");
    }

    // Check ownership
    const course = await strapi.documents('api::course.course' as any).findOne({
      documentId: id,
      populate: ['trainer']
    } as any);

    if (!course) {
      return ctx.notFound("Cours non trouvé.");
    }

    if (course.trainer?.id !== user.id) {
      return ctx.forbidden("Vous n'êtes pas autorisé à supprimer ce cours.");
    }

    return await super.delete(ctx);
  }
}));

