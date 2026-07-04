import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { publicRouter } from './public.routes.js';
import { reservationsRouter } from './reservations.routes.js';
import { walletRouter } from './wallet.routes.js';
import { supportRouter } from './support.routes.js';
import { adminRouter } from './admin.routes.js';
import { layoutRouter } from './layout.routes.js';
import { profileRouter } from './profile.routes.js';

export const apiRouter = Router();
apiRouter.use('/auth', authRouter);
apiRouter.use('/', publicRouter);
apiRouter.use('/reservations', reservationsRouter);
apiRouter.use('/wallet', walletRouter);
apiRouter.use('/support', supportRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/admin/layout', layoutRouter);
apiRouter.use('/profile', profileRouter);