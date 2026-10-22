import { Router } from 'express';
import * as patients from './patient.controller.js';

export const patientRouter = Router();

patientRouter.get('/', patients.list);
patientRouter.post('/', patients.create);
patientRouter.get('/:id', patients.show);
patientRouter.patch('/:id', patients.update);
patientRouter.delete('/:id', patients.remove);
