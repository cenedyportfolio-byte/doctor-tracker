import { Router } from 'express';
import * as patients from '../patients/patient.controller.js';
import * as doctors from './doctor.controller.js';

// Writes require the admin role; enforced for every non-GET request in app.ts.
export const doctorRouter = Router();

doctorRouter.get('/', doctors.list);
doctorRouter.post('/', doctors.create);
doctorRouter.get('/facets', doctors.facets);
doctorRouter.get('/options', doctors.options);
doctorRouter.get('/:id', doctors.show);
doctorRouter.patch('/:id', doctors.update);
doctorRouter.delete('/:id', doctors.remove);

// A doctor's patients
doctorRouter.get('/:id/patients', patients.listForDoctor);
doctorRouter.post('/:id/patients', patients.createForDoctor);
doctorRouter.delete('/:id/patients/:patientId', patients.removeFromDoctor);
