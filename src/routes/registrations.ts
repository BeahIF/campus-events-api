import { Router } from 'express';
import { makeRegisterForEvent } from '../controllers/registrations';
import { Queries } from '../database/queries';

export const makeRegistrationsRoutes = (
    queries: Queries,
): Router => {
    const router = Router();

    router.post(
        '/:eventId/registrations',
        makeRegisterForEvent(queries),
    );

    return router;
};