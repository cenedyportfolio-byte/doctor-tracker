import mongoose from 'mongoose';
import {
  PATIENT_CONDITIONS,
  SPECIALIZATIONS,
  type PatientCondition,
  type Specialization,
} from '../config/constants.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { env } from '../config/env.js';
import { hashPassword } from '../modules/auth/auth.service.js';
import { Doctor } from '../modules/doctors/doctor.model.js';
import { Patient } from '../modules/patients/patient.model.js';
import { User } from '../modules/users/user.model.js';

const DOCTOR_COUNT = 48;
const PATIENT_COUNT = 1800;
const HISTORY_DAYS = 760;
const DAY_MS = 24 * 60 * 60 * 1000;

const DEMO_USERS = [
  { name: 'Ava Admin', email: 'admin@doctortracker.dev', password: 'Admin@12345', role: 'admin' as const },
  { name: 'Victor Viewer', email: 'viewer@doctortracker.dev', password: 'Viewer@12345', role: 'viewer' as const },
];

function createRandom(seed: number) {
  let a = seed;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)] as T,
    weighted: <T>(entries: ReadonlyArray<readonly [T, number]>): T => {
      const total = entries.reduce((sum, [, w]) => sum + w, 0);
      let roll = next() * total;
      for (const [value, weight] of entries) {
        roll -= weight;
        if (roll <= 0) return value;
      }
      return entries[entries.length - 1]![0];
    },
  };
}

const random = createRandom(20251021);

const FEMALE_NAMES = [
  'Aisha', 'Amara', 'Anika', 'Beatriz', 'Chloe', 'Elena', 'Fatima', 'Grace', 'Hana', 'Ines', 'Isabel',
  'Julia', 'Laila', 'Leah', 'Lena', 'Maya', 'Mei', 'Nadia', 'Nora', 'Olivia', 'Priya', 'Rania', 'Ruby',
  'Sara', 'Sofia', 'Valentina', 'Yara', 'Zainab', 'Zoe', 'Amelia',
] as const;

const MALE_NAMES = [
  'Alejandro', 'Amir', 'Andre', 'Arjun', 'Benjamin', 'Chen', 'Daniel', 'Diego', 'Dmitri', 'Emeka',
  'Ethan', 'Felix', 'Hiroshi', 'Ibrahim', 'James', 'Jin', 'Kofi', 'Lucas', 'Marcus', 'Mateo', 'Noah',
  'Omar', 'Oscar', 'Rafael', 'Ravi', 'Samuel', 'Tariq', 'Thomas', 'Wei', 'Yusuf',
] as const;

const NEUTRAL_NAMES = ['Alex', 'Jordan', 'Kai', 'Riley', 'Sam', 'Taylor'] as const;

const LAST_NAMES = [
  'Adeyemi', 'Ahmed', 'Alvarez', 'Bennett', 'Chandra', 'Chen', 'Costa', 'Dubois', 'Edwards',
  'Fernandes', 'Fischer', 'Garcia', 'Hassan', 'Hughes', 'Ito', 'Jensen', 'Kapoor', 'Kim', 'Kowalski',
  'Larsen', 'Lopez', 'Mahmoud', 'Martin', 'Mensah', 'Moreau', 'Nakamura', 'Novak', 'Okafor',
  'Oliveira', 'Patel', 'Petrov', 'Quinn', 'Rahman', 'Reyes', 'Rossi', 'Santos', 'Schmidt', 'Singh',
  'Sullivan', 'Tanaka', 'Thompson', 'Usman', 'Vargas', 'Walker', 'Wang', 'Williams', 'Yilmaz', 'Zhang',
] as const;

const HOSPITALS = [
  { name: 'Riverside General Hospital', domain: 'riverside.example.com' },
  { name: "St. Mary's Medical Center", domain: 'stmarys.example.com' },
  { name: 'Lakeside Medical Institute', domain: 'lakeside.example.com' },
  { name: 'Summit Regional Hospital', domain: 'summit.example.com' },
  { name: 'Green Valley Hospital', domain: 'greenvalley.example.com' },
  { name: 'Northside Specialty Clinic', domain: 'northside.example.com' },
  { name: 'Harborview Health Center', domain: 'harborview.example.com' },
] as const;

const DIAGNOSES: Record<Specialization, readonly string[]> = {
  Cardiology: ['Hypertension', 'Coronary artery disease', 'Atrial fibrillation', 'Heart failure', 'Arrhythmia'],
  Dermatology: ['Psoriasis', 'Atopic dermatitis', 'Acne vulgaris', 'Melanoma screening', 'Urticaria'],
  Endocrinology: ['Type 2 diabetes', 'Type 1 diabetes', 'Hypothyroidism', 'Hyperthyroidism', 'PCOS'],
  Gastroenterology: ['GERD', "Crohn's disease", 'Ulcerative colitis', 'Irritable bowel syndrome', 'Gallstones'],
  'General Medicine': ['Influenza', 'Pneumonia', 'Dehydration', 'Anemia', 'Viral fever'],
  Neurology: ['Migraine', 'Epilepsy', 'Stroke recovery', "Parkinson's disease", 'Multiple sclerosis'],
  Oncology: ['Breast cancer', 'Lung cancer', 'Lymphoma', 'Colorectal cancer', 'Leukemia'],
  Orthopedics: ['Fractured femur', 'ACL tear', 'Osteoarthritis', 'Lumbar disc herniation', 'Rotator cuff tear'],
  Pediatrics: ['Asthma', 'Bronchiolitis', 'Otitis media', 'Gastroenteritis', 'Chickenpox'],
  Psychiatry: ['Major depressive disorder', 'Generalized anxiety disorder', 'Bipolar disorder', 'PTSD', 'Insomnia'],
  Pulmonology: ['COPD', 'Asthma', 'Pulmonary fibrosis', 'Sleep apnea', 'Bronchitis'],
  Radiology: ['Imaging follow-up', 'Suspected fracture', 'Abdominal mass evaluation', 'Chest X-ray review', 'MRI review'],
};

const SPECIALIZATION_WEIGHTS: Record<Specialization, number> = {
  Cardiology: 7, Dermatology: 3, Endocrinology: 4, Gastroenterology: 4, 'General Medicine': 8, Neurology: 5,
  Oncology: 4, Orthopedics: 6, Pediatrics: 6, Psychiatry: 3, Pulmonology: 4, Radiology: 2,
};

const NOTES = [
  'Follow-up scheduled in two weeks.',
  'Responding well to current treatment.',
  'Allergic to penicillin.',
  'Requires dietary consultation.',
  'Family history of the condition.',
  'Monitor vitals every 4 hours.',
];

function phoneNumber(): string {
  return `+1 (555) ${random.int(100, 999)}-${String(random.int(0, 9999)).padStart(4, '0')}`;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z]+/g, '');
}

function admissionDate(notBefore: Date, now: Date): Date {
  const span = now.getTime() - notBefore.getTime();
  for (;;) {
    const t = Math.pow(random.next(), 0.75);
    const date = new Date(notBefore.getTime() + t * span);
    const month = date.getUTCMonth();
    const winterBoost = month === 11 || month <= 1 ? 1 : 0.8;
    if (random.next() < winterBoost) {
      date.setUTCHours(random.int(6, 21), random.int(0, 59), 0, 0);
      return date > now ? now : date;
    }
  }
}

function conditionFor(admittedDaysAgo: number): PatientCondition {
  if (admittedDaysAgo < 14) {
    return random.weighted([['critical', 18], ['under_observation', 34], ['stable', 30], ['recovering', 18]] as const);
  }
  if (admittedDaysAgo < 90) {
    return random.weighted([['critical', 7], ['under_observation', 15], ['stable', 33], ['recovering', 30], ['discharged', 15]] as const);
  }
  return random.weighted([['critical', 3], ['under_observation', 6], ['stable', 30], ['recovering', 21], ['discharged', 40]] as const);
}

function ageFor(specialization: Specialization): number {
  if (specialization === 'Pediatrics') return random.int(0, 17);
  const group = random.weighted([[[18, 29], 18], [[30, 44], 26], [[45, 59], 26], [[60, 74], 20], [[75, 92], 10]] as const);
  return random.int(group[0], group[1]);
}

async function buildDoctors(now: Date) {
  const usedEmails = new Set<string>();
  const specializationEntries = SPECIALIZATIONS.map((s) => [s, SPECIALIZATION_WEIGHTS[s]] as const);

  const doctors = [];
  for (let i = 0; i < DOCTOR_COUNT; i++) {
    const first = random.pick(random.next() < 0.5 ? FEMALE_NAMES : MALE_NAMES);
    const last = random.pick(LAST_NAMES);
    const hospital = random.pick(HOSPITALS);
    const specialization = i < SPECIALIZATIONS.length ? SPECIALIZATIONS[i]! : random.weighted(specializationEntries);

    let email = `${slug(first)}.${slug(last)}@${hospital.domain}`;
    for (let n = 2; usedEmails.has(email); n++) email = `${slug(first)}.${slug(last)}${n}@${hospital.domain}`;
    usedEmails.add(email);

    const daysAgo = i % 12 === 0 ? random.int(3, 45) : random.int(120, HISTORY_DAYS + 300);
    const createdAt = new Date(now.getTime() - daysAgo * DAY_MS);

    const doctor = new Doctor({
      name: `${first} ${last}`,
      specialization,
      hospital: hospital.name,
      phone: phoneNumber(),
      email,
    });
    await doctor.validate();
    doctors.push({
      doc: { ...doctor.toObject(), createdAt, updatedAt: createdAt },
      weight: 0.25 + random.next() * random.next() * 3,
      specialization,
    });
  }
  return doctors;
}

async function buildPatients(doctors: Awaited<ReturnType<typeof buildDoctors>>, now: Date) {
  const historyStart = new Date(now.getTime() - HISTORY_DAYS * DAY_MS);
  const patients = [];

  for (let i = 0; i < PATIENT_COUNT; i++) {
    const admittedAt = admissionDate(historyStart, now);
    const eligible = doctors.filter((d) => d.doc.createdAt <= admittedAt);
    const doctor = random.weighted((eligible.length ? eligible : doctors).map((d) => [d, d.weight] as const));
    const daysAgo = (now.getTime() - admittedAt.getTime()) / DAY_MS;

    const gender = random.weighted([['female', 50], ['male', 47], ['other', 3]] as const);
    const first = random.pick(gender === 'female' ? FEMALE_NAMES : gender === 'male' ? MALE_NAMES : NEUTRAL_NAMES);
    const last = random.pick(LAST_NAMES);

    const patient = new Patient({
      name: `${first} ${last}`,
      age: ageFor(doctor.specialization),
      gender,
      phone: phoneNumber(),
      email: random.next() < 0.75 ? `${slug(first)}.${slug(last)}${random.int(1, 99)}@example.com` : undefined,
      diagnosis: random.pick(DIAGNOSES[doctor.specialization]),
      condition: conditionFor(daysAgo),
      admissionDate: admittedAt,
      notes: random.next() < 0.3 ? random.pick(NOTES) : undefined,
      doctor: doctor.doc._id,
    });
    await patient.validate();
    patients.push({ ...patient.toObject(), createdAt: admittedAt, updatedAt: admittedAt });
  }
  return patients;
}

async function main() {
  if (env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
    console.error('Refusing to seed in production without --force (this wipes all data).');
    process.exit(1);
  }

  await connectDatabase();
  console.log(`Seeding ${mongoose.connection.name}...`);

  await Promise.all([User.deleteMany({}), Doctor.deleteMany({}), Patient.deleteMany({})]);
  await Promise.all([User.syncIndexes(), Doctor.syncIndexes(), Patient.syncIndexes()]);

  const now = new Date();
  const users = await Promise.all(
    DEMO_USERS.map(async ({ password, ...user }) => ({ ...user, passwordHash: await hashPassword(password) })),
  );
  await User.insertMany(users);

  const doctors = await buildDoctors(now);
  await Doctor.collection.insertMany(doctors.map((d) => d.doc));

  const patients = await buildPatients(doctors, now);
  await Patient.collection.insertMany(patients);

  const conditionCounts = Object.fromEntries(PATIENT_CONDITIONS.map((c) => [c, 0]));
  for (const p of patients) conditionCounts[p.condition]! += 1;

  console.log(`Inserted ${users.length} users, ${doctors.length} doctors, ${patients.length} patients`);
  console.log('Patients by condition:', conditionCounts);
  console.log('\nDemo accounts:');
  for (const u of DEMO_USERS) console.log(`  ${u.role.padEnd(6)}  ${u.email}  /  ${u.password}`);

  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
