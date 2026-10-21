import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { hashPassword } from '../src/modules/auth/auth.service.js';
import { Doctor } from '../src/modules/doctors/doctor.model.js';
import { Patient } from '../src/modules/patients/patient.model.js';
import { User } from '../src/modules/users/user.model.js';

const app = createApp();
const admin = request.agent(app);
const viewer = request.agent(app);

const doctorInput = {
  name: 'Grace Hopper',
  specialization: 'Cardiology',
  hospital: 'Riverside General Hospital',
  phone: '+1 (555) 010-2030',
  email: 'grace.hopper@riverside.example.com',
};

const patientInput = {
  name: 'Ada Lovelace',
  age: 36,
  gender: 'female',
  phone: '+1 (555) 444-1000',
  email: 'ada@example.com',
  diagnosis: 'Type 2 diabetes',
  condition: 'stable',
};

beforeAll(async () => {
  await connectDatabase();
  await mongoose.connection.dropDatabase();
  await Promise.all([User.init(), Doctor.init(), Patient.init()]);

  await User.create([
    { name: 'Admin', email: 'admin@test.dev', role: 'admin', passwordHash: await hashPassword('Admin@123') },
    { name: 'Viewer', email: 'viewer@test.dev', role: 'viewer', passwordHash: await hashPassword('Viewer@123') },
  ]);

  await admin.post('/api/v1/auth/login').send({ email: 'admin@test.dev', password: 'Admin@123' }).expect(200);
  await viewer.post('/api/v1/auth/login').send({ email: 'viewer@test.dev', password: 'Viewer@123' }).expect(200);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await disconnectDatabase();
});

describe('auth', () => {
  it('rejects bad credentials with a generic message', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.dev', password: 'wrong' })
      .expect(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('sets an httpOnly session cookie on login', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ADMIN@test.dev', password: 'Admin@123' })
      .expect(200);
    const cookie = res.headers['set-cookie']?.[0] ?? '';
    expect(cookie).toMatch(/^dt_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(res.body.data.user).toMatchObject({ email: 'admin@test.dev', role: 'admin' });
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('requires a session for protected routes', async () => {
    await request(app).get('/api/v1/doctors').expect(401);
    await request(app).get('/api/v1/doctors').set('Cookie', 'dt_session=not-a-jwt').expect(401);
  });

  it('returns the current user', async () => {
    const res = await admin.get('/api/v1/auth/me').expect(200);
    expect(res.body.data.user.email).toBe('admin@test.dev');
  });

  it('clears the cookie on logout', async () => {
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/login').send({ email: 'viewer@test.dev', password: 'Viewer@123' });
    await agent.post('/api/v1/auth/logout').expect(204);
    await agent.get('/api/v1/auth/me').expect(401);
  });
});

describe('doctors', () => {
  let doctorId: string;

  it('validates input and reports field errors', async () => {
    const res = await admin
      .post('/api/v1/doctors')
      .send({ ...doctorInput, email: 'nope', specialization: 'Astrology' })
      .expect(400);
    const paths = res.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['email', 'specialization']));
  });

  it('rejects unknown fields', async () => {
    await admin.post('/api/v1/doctors').send({ ...doctorInput, searchKeywords: ['x'] }).expect(400);
  });

  it('forbids viewers from creating doctors', async () => {
    await viewer.post('/api/v1/doctors').send(doctorInput).expect(403);
  });

  it('blocks every write route for viewers before validation or lookups run', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const writes: Array<[method: 'post' | 'patch' | 'delete', path: string]> = [
      ['post', '/api/v1/doctors'],
      ['patch', `/api/v1/doctors/${id}`],
      ['delete', `/api/v1/doctors/${id}`],
      ['post', `/api/v1/doctors/${id}/patients`],
      ['delete', `/api/v1/doctors/${id}/patients/${id}`],
      ['post', '/api/v1/patients'],
      ['patch', `/api/v1/patients/${id}`],
      ['delete', `/api/v1/patients/${id}`],
    ];
    for (const [method, path] of writes) {
      const res = await viewer[method](path).send({});
      expect(res.status, `${method.toUpperCase()} ${path}`).toBe(403);
    }
  });

  it('creates a doctor', async () => {
    const res = await admin.post('/api/v1/doctors').send(doctorInput).expect(201);
    doctorId = res.body.data.id;
    expect(res.body.data).toMatchObject({ ...doctorInput, patientCount: 0 });
    expect(res.body.data.searchKeywords).toBeUndefined();
  });

  it('rejects duplicate emails with 409', async () => {
    const res = await admin.post('/api/v1/doctors').send({ ...doctorInput, name: 'Someone Else' }).expect(409);
    expect(res.body.error.details[0].path).toBe('email');
  });

  it('lists, paginates, searches and filters', async () => {
    await admin
      .post('/api/v1/doctors')
      .send({ ...doctorInput, name: 'Alan Turing', specialization: 'Neurology', email: 'alan@x.example.com' })
      .expect(201);

    const all = await viewer.get('/api/v1/doctors?limit=1').expect(200);
    expect(all.body.meta).toMatchObject({ page: 1, limit: 1, total: 2, totalPages: 2, hasNextPage: true });

    const search = await viewer.get('/api/v1/doctors?search=gra%20hop').expect(200);
    expect(search.body.data.map((d: { name: string }) => d.name)).toEqual(['Grace Hopper']);

    const filtered = await viewer.get('/api/v1/doctors?specialization=Neurology').expect(200);
    expect(filtered.body.data.map((d: { name: string }) => d.name)).toEqual(['Alan Turing']);

    const sorted = await viewer.get('/api/v1/doctors?sort=name_asc').expect(200);
    expect(sorted.body.data.map((d: { name: string }) => d.name)).toEqual(['Alan Turing', 'Grace Hopper']);

    const future = await viewer.get('/api/v1/doctors?from=2999-01-01').expect(200);
    expect(future.body.meta.total).toBe(0);
  });

  it('rebuilds search keywords on update', async () => {
    await admin.patch(`/api/v1/doctors/${doctorId}`).send({ hospital: 'Lakeside Medical' }).expect(200);
    const res = await viewer.get('/api/v1/doctors?search=lakeside').expect(200);
    expect(res.body.meta.total).toBe(1);
  });

  it('returns 400 for malformed ids and 404 for unknown ones', async () => {
    await viewer.get('/api/v1/doctors/not-an-id').expect(400);
    await viewer.get(`/api/v1/doctors/${new mongoose.Types.ObjectId()}`).expect(404);
  });

  describe("a doctor's patients", () => {
    let patientId: string;

    it('adds a patient under the doctor', async () => {
      const res = await admin.post(`/api/v1/doctors/${doctorId}/patients`).send(patientInput).expect(201);
      patientId = res.body.data.id;
      expect(res.body.data.doctor).toMatchObject({ id: doctorId, name: 'Grace Hopper' });
    });

    it('lists only that doctor’s patients and reports counts', async () => {
      const list = await viewer.get(`/api/v1/doctors/${doctorId}/patients`).expect(200);
      expect(list.body.meta.total).toBe(1);

      const detail = await viewer.get(`/api/v1/doctors/${doctorId}`).expect(200);
      expect(detail.body.data.patientCount).toBe(1);
      expect(detail.body.data.patientsByCondition.stable).toBe(1);
    });

    it('refuses to delete a doctor who still has patients', async () => {
      await admin.delete(`/api/v1/doctors/${doctorId}`).expect(409);
    });

    it('will not delete a patient through a different doctor', async () => {
      const other = await viewer.get('/api/v1/doctors?search=alan').expect(200);
      await admin.delete(`/api/v1/doctors/${other.body.data[0].id}/patients/${patientId}`).expect(404);
    });

    it('removes the patient from the doctor', async () => {
      await admin.delete(`/api/v1/doctors/${doctorId}/patients/${patientId}`).expect(204);
      await viewer.get(`/api/v1/patients/${patientId}`).expect(404);
      await admin.delete(`/api/v1/doctors/${doctorId}`).expect(204);
    });
  });
});

describe('patients', () => {
  let doctorId: string;
  let patientId: string;

  beforeAll(async () => {
    const res = await admin
      .post('/api/v1/doctors')
      .send({ ...doctorInput, email: 'patients-suite@x.example.com', specialization: 'Endocrinology' })
      .expect(201);
    doctorId = res.body.data.id;
  });

  it('creates a patient and verifies the doctor exists', async () => {
    await admin
      .post('/api/v1/patients')
      .send({ ...patientInput, doctor: new mongoose.Types.ObjectId().toString() })
      .expect(404);

    const res = await admin.post('/api/v1/patients').send({ ...patientInput, doctor: doctorId }).expect(201);
    patientId = res.body.data.id;
  });

  it('rejects admission dates in the future', async () => {
    const res = await admin
      .post('/api/v1/patients')
      .send({ ...patientInput, doctor: doctorId, admissionDate: '2999-01-01' })
      .expect(400);
    expect(res.body.error.details[0].path).toBe('admissionDate');
  });

  it('updates fields and clears optional ones with an empty string', async () => {
    const res = await admin
      .patch(`/api/v1/patients/${patientId}`)
      .send({ email: '', condition: 'critical', name: 'Ada King' })
      .expect(200);
    expect(res.body.data).toMatchObject({ email: null, condition: 'critical', name: 'Ada King' });
  });

  it('searches by name prefix and diagnosis, and filters by condition, age and date', async () => {
    expect((await viewer.get('/api/v1/patients?search=ada%20ki').expect(200)).body.meta.total).toBe(1);
    expect((await viewer.get('/api/v1/patients?search=diab').expect(200)).body.meta.total).toBe(1);
    expect((await viewer.get('/api/v1/patients?condition=critical,stable').expect(200)).body.meta.total).toBe(1);
    expect((await viewer.get('/api/v1/patients?condition=discharged').expect(200)).body.meta.total).toBe(0);
    expect((await viewer.get('/api/v1/patients?minAge=40').expect(200)).body.meta.total).toBe(0);
    expect((await viewer.get('/api/v1/patients?to=2000-01-01').expect(200)).body.meta.total).toBe(0);
    await viewer.get('/api/v1/patients?minAge=50&maxAge=10').expect(400);
  });

  it('forbids viewers from editing or deleting', async () => {
    await viewer.patch(`/api/v1/patients/${patientId}`).send({ age: 40 }).expect(403);
    await viewer.delete(`/api/v1/patients/${patientId}`).expect(403);
  });

  it('reflects writes in dashboard stats immediately', async () => {
    const before = await viewer.get('/api/v1/stats/overview?range=30d').expect(200);
    expect(before.body.data.totals.patients).toBe(1);
    expect(before.body.data.totals.critical).toBe(1);

    await admin.delete(`/api/v1/patients/${patientId}`).expect(204);

    const after = await viewer.get('/api/v1/stats/overview?range=30d').expect(200);
    expect(after.body.data.totals.patients).toBe(0);
    expect(after.body.data.admissionsTrend).toHaveLength(30);
  });
});
