import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::enrollment.enrollment",
  ({ strapi }) => ({
    async enroll(ctx) {
      const { user } = ctx.state;
      const { courseId } = ctx.request.body;

      if (!user) {
        return ctx.unauthorized("You must be logged in to enroll");
      }

      if (!courseId) {
        return ctx.badRequest("Course ID is required");
      }

      try {
        const enrollment = await strapi
          .service("api::enrollment.enrollment")
          .enroll(user.id, courseId);
        return ctx.send({ data: enrollment });
      } catch (error) {
        return ctx.badRequest(error.message);
      }
    },

    async myCourses(ctx) {
      const { user } = ctx.state;

      if (!user) {
        return ctx.unauthorized("You must be logged in");
      }

      const enrollments = await strapi
        .service("api::enrollment.enrollment")
        .getMyEnrolledCourses(user.id);
      return ctx.send({ data: enrollments });
    },

    async updateProgress(ctx) {
      const { user } = ctx.state;
      const { courseId, progress, lesson_progress } = ctx.request.body;

      if (!user) {
        return ctx.unauthorized("You must be logged in");
      }
      if (!courseId) {
        return ctx.badRequest("Course ID is required");
      }

      try {
        const updated = await strapi
          .service("api::enrollment.enrollment")
          .updateProgress(user.id, courseId, progress, lesson_progress);
        
        return ctx.send({ data: updated });
      } catch (error) {
        return ctx.badRequest(error.message);
      }
    }
  }),
);
