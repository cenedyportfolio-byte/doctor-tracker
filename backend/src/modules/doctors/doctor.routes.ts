import { Router } from 'express';
import { authorize } from '../../middleware/auth.js';
import * as patients from '../patients/patient.controller.js';
import * as doctors from './doctor.controller.js';

export const doctorRouter = Router();

doctorRouter.get('/', doctors.list);
doctorRouter.post('/', authorize('admin'), doctors.create);
doctorRouter.get('/facets', doctors.facets);
doctorRouter.get('/options', doctors.options);
doctorRouter.get('/:id', doctors.show);
doctorRouter.patch('/:id', authorize('admin'), doctors.update);
doctorRouter.delete('/:id', authorize('admin'), doctors.remove);

// A doctor's patients
doctorRouter.get('/:id/patients', patients.listForDoctor);
doctorRouter.post('/:id/patients', authorize('admin'), patients.createForDoctor);
doctorRouter.delete('/:id/patients/:patientId', authorize('admin'), patients.removeFromDoctor);
