import type { Request, Response } from 'express';
import { idParams, parse } from '../../lib/validation.js';
import {
  createDoctorPatientBody,
  createPatientBody,
  doctorPatientParams,
  listPatientsQuery,
  updatePatientBody,
} from './patient.schema.js';
import {
  createPatient,
  deletePatient,
  getPatient,
  listPatients,
  updatePatient,
} from './patient.service.js';

export async function list(req: Request, res: Response) {
  const query = parse(listPatientsQuery, req.query);
  res.json(await listPatients(query));
}

export async function show(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await getPatient(id) });
}

export async function create(req: Request, res: Response) {
  const body = parse(createPatientBody, req.body);
  res.status(201).json({ data: await createPatient(body) });
}

export async function update(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  const body = parse(updatePatientBody, req.body);
  res.json({ data: await updatePatient(id, body) });
}

export async function remove(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  await deletePatient(id);
  res.status(204).end();
}

// Nested under /doctors/:id/patients

export async function listForDoctor(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  const query = parse(listPatientsQuery, req.query);
  res.json(await listPatients(query, { doctorId: id }));
}

export async function createForDoctor(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  const body = parse(createDoctorPatientBody, req.body);
  res.status(201).json({ data: await createPatient({ ...body, doctor: id }) });
}

export async function removeFromDoctor(req: Request, res: Response) {
  const { id, patientId } = parse(doctorPatientParams, req.params);
  await deletePatient(patientId, { doctorId: id });
  res.status(204).end();
}
