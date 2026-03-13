export default {
  routes: [
    {
      method: "POST",
      path: "/enrollments/enroll",
      handler: "enrollment.enroll",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/enrollments/update-progress",
      handler: "api::enrollment.enrollment.updateProgress",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/enrollments/my-courses",
      handler: "enrollment.myCourses",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/enrollments",
      handler: "enrollment.find",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
