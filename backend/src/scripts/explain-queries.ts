/**
 * Prints MongoDB query plans for the API's hot queries as a markdown table.
 *
 *   npm run explain
 *
 * The queries are built with the same functions the services use (filter builders, sort
 * specs, aggregation pipelines), so the numbers describe what the API actually runs.
 * Look for: index scans (IXSCAN / COUNT_SCAN) instead of COLLSCAN, and docsExamined close to
 * nReturned. "docsExamined 0" means the query was answered from the index alone.
 */
import type { Aggregate, Query } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { Doctor } from '../modules/doctors/doctor.model.js';
import { listDoctorsQuery } from '../modules/doctors/doctor.schema.js';
import { buildDoctorFilter, DOCTOR_SORT_SPECS, doctorPatientMixPipeline } from '../modules/doctors/doctor.service.js';
import { Patient } from '../modules/patients/patient.model.js';
import { listPatientsQuery } from '../modules/patients/patient.schema.js';
import { buildPatientFilter, PATIENT_SORT_SPECS } from '../modules/patients/patient.service.js';
import * as stats from '../modules/stats/stats.service.js';

interface PlanStage {
  stage: string;
  indexName?: string;
  inputStage?: PlanStage;
  inputStages?: PlanStage[];
  queryPlan?: PlanStage;
}

interface CursorExplain {
  queryPlanner: { winningPlan: PlanStage };
  executionStats: { nReturned: number; totalKeysExamined: number; totalDocsExamined: number; executionTimeMillis: number };
}

// find() explains are flat; aggregate() explains nest the cursor under stages[0].$cursor.
type ExplainOutput = CursorExplain | { stages: Array<{ $cursor?: CursorExplain; nReturned?: number }> };

function planStages(plan: PlanStage | undefined): string[] {
  if (!plan) return [];
  const self = plan.indexName ? `${plan.stage}(${plan.indexName})` : plan.stage;
  return [self, ...[plan.inputStage, ...(plan.inputStages ?? [])].flatMap(planStages)];
}

async function row(label: string, explainable: Query<unknown, unknown> | Aggregate<unknown>) {
  const output = (await explainable.explain('executionStats')) as unknown as ExplainOutput;
  const cursor = 'stages' in output ? output.stages[0]?.$cursor : output;
  if (!cursor) throw new Error(`No cursor stage in explain output for ${label}`);
  const winning = cursor.queryPlanner.winningPlan;
  const stages = planStages(winning.queryPlan ?? winning);
  const scans = stages.filter((s) => s.includes('SCAN'));
  const covered = stages.includes('PROJECTION_COVERED') || (scans.length > 0 && !stages.includes('FETCH') && !scans.some((s) => s.startsWith('COLLSCAN')));
  const { totalKeysExamined, totalDocsExamined, nReturned, executionTimeMillis } = cursor.executionStats;
  const finalRows = 'stages' in output ? output.stages.at(-1)?.nReturned : undefined;
  console.log(
    `| ${label} | ${scans.join(', ')}${covered ? ' (index only)' : ''} | ${totalKeysExamined} | ${totalDocsExamined} | ${nReturned}${finalRows !== undefined && finalRows !== nReturned ? ` → ${finalRows}` : ''} | ${executionTimeMillis} |`,
  );
}

async function main() {
  await connectDatabase();
  const sample = await Patient.findOne().sort({ admissionDate: -1 }).select('doctor').lean();
  if (!sample) throw new Error('No data. Run `npm run seed` first.');
  const pageOfDoctors = await Doctor.find().sort(DOCTOR_SORT_SPECS.newest).limit(10).select('_id').lean();
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  console.log('| Query | Plan | keysExamined | docsExamined | nReturned | ms |');
  console.log('|---|---|---|---|---|---|');

  // Doctors list (GET /doctors)
  for (const [label, input] of [
    ['Doctors: default list, page 1', {}],
    ['Doctors: default list, page 3', { page: '3' }],
    ['Doctors: search "car" + specialization + joined date', { search: 'car', specialization: 'Cardiology,Neurology', from: '2025-01-01' }],
    ['Doctors: hospital filter, sorted by name', { hospital: 'Riverside General Hospital', sort: 'name_asc' }],
  ] as const) {
    const q = listDoctorsQuery.parse(input);
    await row(label, Doctor.find(buildDoctorFilter(q)).sort(DOCTOR_SORT_SPECS[q.sort]).skip((q.page - 1) * q.limit).limit(q.limit).lean());
  }
  await row(
    'Doctors: patient counts for one page',
    Patient.aggregate([
      { $match: { doctor: { $in: pageOfDoctors.map((d) => d._id) } } },
      { $group: { _id: '$doctor', count: { $sum: 1 } } },
    ]),
  );

  // Patients list (GET /patients)
  for (const [label, input] of [
    ['Patients: default list, page 1', {}],
    ['Patients: search "a" + condition + date + gender + age', { search: 'a', condition: 'stable,recovering', from: since, gender: 'female', minAge: '30', maxAge: '70' }],
    ['Patients: search "ar" + condition + date + gender + age', { search: 'ar', condition: 'stable,recovering', from: since, gender: 'female', minAge: '30', maxAge: '70' }],
    ['Patients: condition + admission date', { condition: 'critical', from: since }],
    ['Patients: gender + age only', { gender: 'female', minAge: '60' }],
  ] as const) {
    const q = listPatientsQuery.parse(input);
    await row(label, Patient.find(buildPatientFilter(q)).sort(PATIENT_SORT_SPECS[q.sort]).limit(q.limit).lean());
  }
  {
    const q = listPatientsQuery.parse({ condition: 'critical', from: since });
    await row('Patients: count for condition + date', Patient.aggregate([{ $match: buildPatientFilter(q) }, { $count: 'n' }]));
    const own = listPatientsQuery.parse({});
    await row("Patients: one doctor's list", Patient.find(buildPatientFilter(own, String(sample.doctor))).sort(PATIENT_SORT_SPECS.newest).limit(10).lean());
  }

  // Dashboard (GET /stats/overview) and doctor profile (GET /doctors/:id)
  const { unit, start, previousStart, now } = stats.resolvePeriod('12m');
  await row('Dashboard: admissions trend (12m)', Patient.aggregate(stats.admissionsPipeline(unit, start, previousStart, now)));
  await row('Dashboard: patient breakdowns', Patient.aggregate(stats.patientBreakdownPipeline()));
  await row('Dashboard: doctor breakdowns', Doctor.aggregate(stats.doctorBreakdownPipeline(start, previousStart)));
  await row('Dashboard: recent admissions', stats.recentAdmissionsQuery());
  await row('Doctor profile: patient mix', Patient.aggregate(doctorPatientMixPipeline(sample.doctor)));

  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
