import { Router } from 'express';
import healthRoutes from './modules/health/health.routes';
import titlesRoutes from './modules/titles/titles.routes';
import availabilityRoutes from './modules/availability/availability.routes';
import podcastsRoutes from './modules/podcasts/podcasts.routes';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import streamingRoutes from './modules/streaming/streaming.routes';
import billingRoutes from './modules/billing/billing.routes';
import adminRoutes from './modules/admin/admin.routes';
import mediaRoutes from './modules/media/media.routes';

const apiRouter = Router();

apiRouter.use(healthRoutes);
apiRouter.use(titlesRoutes);
apiRouter.use(availabilityRoutes);
apiRouter.use(podcastsRoutes);
apiRouter.use(authRoutes);
apiRouter.use(usersRoutes);
apiRouter.use(streamingRoutes);
apiRouter.use(billingRoutes);
apiRouter.use(adminRoutes);
apiRouter.use(mediaRoutes);

export default apiRouter;
