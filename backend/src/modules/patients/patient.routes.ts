import { Router } from 'express';
import { authorize } from '../../middleware/auth.js';
import * as patients from './patient.controller.js';

export const patientRouter = Router();

patientRouter.get('/', patients.list);
patientRouter.post('/', authorize('admin'), patients.create);
patientRouter.get('/:id', patients.show);
patientRouter.patch('/:id', authorize('admin'), patients.update);
patientRouter.delete('/:id', authorize('admin'), patients.remove);
