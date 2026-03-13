import { factories } from "@strapi/strapi";

export default factories.createCoreService(
  "api::enrollment.enrollment",
  ({ strapi }) => ({
    async enroll(userId, courseId) {
      console.log(
        `[Enrollment] Attempting to enroll user ${userId} in course ${courseId}`,
      );

      // 1. Check if course exists
      const course = await (strapi as any)
        .documents("api::course.course")
        .findOne({
          documentId: courseId,
        });

      if (!course) {
        console.error(`[Enrollment] Course not found: ${courseId}`);
        throw new Error("Cours non trouvé.");
      }

      // 2. Check if already enrolled
      const existing = await (strapi as any)
        .documents("api::enrollment.enrollment")
        .findMany({
          filters: {
            student: { id: userId },
            course: { documentId: courseId },
          },
        });

      if (existing.length > 0) {
        throw new Error("Vous êtes déjà inscrit à ce cours.");
      }

      // 3. Check for active subscription
      // Bypass check in development mode to facilitate testing
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Enrollment] Skipping subscription check for user ${userId} in development mode`,
        );
      } else {
        const subscriptionService = strapi.service(
          "api::user-subscription.user-subscription",
        );
        const activeSub = await (subscriptionService as any).findActiveByUser(
          userId,
        );
  
        if (!activeSub) {
          console.warn(`[Enrollment] User ${userId} has no active subscription`);
          throw new Error(
            "Un abonnement actif est requis pour s'inscrire à une formation.",
          );
        }
      }

      // 4. Create enrollment
      const enrollment = await (strapi as any)
        .documents("api::enrollment.enrollment")
        .create({
          data: {
            student: userId,
            course: course.id, // Use numeric ID for relation creation if needed, or documentId
            enrolled_at: new Date(),
            status: "active",
            progress: 0,
          },
          status: "published",
        });

      console.log(
        `[Enrollment] Success: Enrollment created with ID ${enrollment.id}`,
      );
      return enrollment;
    },

    async getMyEnrolledCourses(userId) {
      console.log(`[Enrollment] Fetching courses for user ${userId}`);
      return await (strapi as any)
        .documents("api::enrollment.enrollment")
        .findMany({
          filters: { student: { id: userId } },
          populate: {
            course: {
              populate: ["cover", "trainer"],
            },
          },
        });
    },

    async updateProgress(userId, courseId, progress, lessonProgress) {
      console.log(`[Enrollment] Updating progress for user ${userId} in course ${courseId}`);
      
      const enrollments = await (strapi as any)
        .documents("api::enrollment.enrollment")
        .findMany({
          filters: {
            student: { id: userId },
            course: { documentId: courseId } // Or id depending on how frontend sends it
          }
        });

      if (!enrollments || enrollments.length === 0) {
        throw new Error("Inscription non trouvée pour ce cours");
      }

      const enrollmentId = enrollments[0].documentId;

      const updated = await (strapi as any)
        .documents("api::enrollment.enrollment")
        .update({
          documentId: enrollmentId,
          data: {
            progress: progress,
            lesson_progress: lessonProgress,
            status: progress === 100 ? 'completed' : 'active'
          }
        });

      return updated;
    }
  }),
);
