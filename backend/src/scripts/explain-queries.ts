/**
 * Prints the winning plan for the API's hot queries so index usage can be verified.
 *
 *   npm run explain
 *
 * Every query should be answered from an index (IXSCAN / COUNT_SCAN / DISTINCT_SCAN). Searches
 * are the one place an in-memory SORT is expected: the multikey index narrows the match to a
 * handful of documents first, and sorting those is cheaper than walking a sort index.
 */
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { buildSearchFilter } from '../lib/search.js';
import { Doctor } from '../modules/doctors/doctor.model.js';
import { Patient } from '../modules/patients/patient.model.js';

interface PlanStage {
  stage: string;
  indexName?: string;
  inputStage?: PlanStage;
  inputStages?: PlanStage[];
}

interface QueryExplain {
  queryPlanner: { winningPlan: PlanStage & { queryPlan?: PlanStage } };
  executionStats: { nReturned: number; totalKeysExamined: number; totalDocsExamined: number; executionTimeMillis: number };
}

// find() explains are flat; aggregate() explains nest the same data under stages[0].$cursor.
type ExplainOutput = QueryExplain | { stages: Array<{ $cursor: QueryExplain }> };

function describe(plan: PlanStage | undefined): string[] {
  if (!plan) return [];
  const self = plan.indexName ? `${plan.stage}(${plan.indexName})` : plan.stage;
  const children = [plan.inputStage, ...(plan.inputStages ?? [])].flatMap(describe);
  return [self, ...children];
}

async function report(label: string, explain: Promise<unknown>) {
  const output = (await explain) as ExplainOutput;
  const result = 'stages' in output ? output.stages[0]!.$cursor : output;
  const winning = result.queryPlanner.winningPlan;
  const stages = describe(winning.queryPlan ?? winning);
  const stats = result.executionStats;
  console.log(`\n${label}`);
  console.log(`  plan:      ${stages.join(' <- ')}`);
  console.log(
    `  examined:  ${stats.totalKeysExamined} keys, ${stats.totalDocsExamined} docs → ${stats.nReturned} returned in ${stats.executionTimeMillis}ms`,
  );
  if (stages.includes('COLLSCAN')) console.log('  WARNING: collection scan');
}

async function main() {
  await connectDatabase();
  const sample = await Patient.findOne().sort({ admissionDate: -1 }).select('name doctor').lean();
  if (!sample) throw new Error('No data. Run `npm run seed` first.');
  const [firstName = '', lastName = ''] = sample.name.split(' ');
  const patientSearch = `${firstName.toLowerCase()} ${lastName.slice(0, 3).toLowerCase()}`;
  const pageOfDoctors = await Doctor.find().sort({ createdAt: -1, _id: -1 }).limit(10).select('_id').lean();

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  await report(
    'Doctors: default list (newest first, page 3)',
    Doctor.find().sort({ createdAt: -1, _id: -1 }).skip(20).limit(10).explain('executionStats'),
  );
  await report(
    'Doctors: search "card" sorted by name',
    Doctor.find(buildSearchFilter('card')).sort({ name: 1, _id: 1 }).limit(10).explain('executionStats'),
  );
  await report(
    'Doctors: specialization filter + joined date range',
    Doctor.find({ specialization: { $in: ['Cardiology'] }, createdAt: { $gte: since } })
      .sort({ createdAt: -1, _id: -1 })
      .limit(10)
      .explain('executionStats'),
  );
  await report(
    "Patients: one doctor's patients (newest first)",
    Patient.find({ doctor: sample.doctor }).sort({ admissionDate: -1, _id: -1 }).limit(10).explain('executionStats'),
  );
  await report(
    'Patients: critical, admitted in last 90 days',
    Patient.find({ condition: { $in: ['critical'] }, admissionDate: { $gte: since } })
      .sort({ admissionDate: -1, _id: -1 })
      .limit(10)
      .explain('executionStats'),
  );
  await report(
    `Patients: multi-word prefix search "${patientSearch}"`,
    Patient.find(buildSearchFilter(patientSearch)).sort({ admissionDate: -1, _id: -1 }).limit(10).explain('executionStats'),
  );
  await report(
    'Patients: filtered count (what countDocuments runs)',
    Patient.aggregate([{ $match: { condition: 'critical' } }, { $group: { _id: null, n: { $sum: 1 } } }]).explain(
      'executionStats',
    ),
  );
  await report(
    'Patients: patient counts for one page of doctors',
    Patient.aggregate([
      { $match: { doctor: { $in: pageOfDoctors.map((d) => d._id) } } },
      { $group: { _id: '$doctor', count: { $sum: 1 } } },
    ]).explain('executionStats'),
  );

  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
