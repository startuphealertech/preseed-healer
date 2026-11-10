import { Router } from "express";
import { requireAdmin, requireAuth } from "./middleware/auth";
import { authRouter } from "./modules/auth/auth.routes";
import { adminDashboardRouter } from "./modules/dashboard/dashboard.routes";
import {
  adminFaqsRouter,
  adminPagesRouter,
  adminPartnersRouter,
  faqsRouter,
  pagesRouter,
  partnersRouter,
} from "./modules/directory/directory.routes";
import { healthRouter } from "./modules/health/health.routes";
import { adminMediaRouter, uploadsStatic } from "./modules/media/media.routes";
import {
  adminCategoriesRouter,
  adminPostsRouter,
  categoriesRouter,
  postsRouter,
} from "./modules/posts/posts.routes";
import { adminSettingsRouter, settingsRouter } from "./modules/settings/settings.routes";
import {
  adminApplicationsRouter,
  adminInvestorInterestsRouter,
  adminMessagesRouter,
  submissionsRouter,
} from "./modules/submissions/submissions.routes";

export const apiRouter = Router();

/* Public */
apiRouter.use("/health", healthRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/posts", postsRouter);
apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/partners", partnersRouter);
apiRouter.use("/faqs", faqsRouter);
apiRouter.use("/pages", pagesRouter);
apiRouter.use("/uploads", uploadsStatic);
apiRouter.use("/", submissionsRouter); // POST /applications, /investor-interests, /contact
apiRouter.use("/auth", authRouter);

/* Admin (signed-in users) */
const admin = Router();
admin.use(requireAuth);
admin.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
admin.use("/dashboard", adminDashboardRouter);
admin.use("/posts", adminPostsRouter);
admin.use("/categories", adminCategoriesRouter);
admin.use("/partners", adminPartnersRouter);
admin.use("/faqs", adminFaqsRouter);
admin.use("/pages", adminPagesRouter);
admin.use("/media", adminMediaRouter);
admin.use("/settings", adminSettingsRouter);
// Personal data: admins only.
admin.use("/applications", requireAdmin, adminApplicationsRouter);
admin.use("/investor-interests", requireAdmin, adminInvestorInterestsRouter);
admin.use("/messages", requireAdmin, adminMessagesRouter);

apiRouter.use("/admin", admin);
