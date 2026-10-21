import type { Request, Response } from 'express';
import { idParams, parse } from '../../lib/validation.js';
import {
  createDoctor,
  deleteDoctor,
  getDoctor,
  getDoctorFacets,
  listDoctorOptions,
  listDoctors,
  updateDoctor,
} from './doctor.service.js';
import {
  createDoctorBody,
  doctorOptionsQuery,
  listDoctorsQuery,
  updateDoctorBody,
} from './doctor.schema.js';

export async function list(req: Request, res: Response) {
  const query = parse(listDoctorsQuery, req.query);
  res.json(await listDoctors(query));
}

export async function facets(_req: Request, res: Response) {
  res.json({ data: await getDoctorFacets() });
}

export async function options(req: Request, res: Response) {
  const query = parse(doctorOptionsQuery, req.query);
  res.json({ data: await listDoctorOptions(query) });
}

export async function show(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await getDoctor(id) });
}

export async function create(req: Request, res: Response) {
  const body = parse(createDoctorBody, req.body);
  res.status(201).json({ data: await createDoctor(body) });
}

export async function update(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  const body = parse(updateDoctorBody, req.body);
  res.json({ data: await updateDoctor(id, body) });
}

export async function remove(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  await deleteDoctor(id);
  res.status(204).end();
}
