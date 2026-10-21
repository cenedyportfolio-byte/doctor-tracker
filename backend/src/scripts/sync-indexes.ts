/**
 * Makes the database's indexes match the ones declared on the Mongoose schemas: creates
 * missing indexes and drops ones no longer declared. Data is untouched.
 *
 *   npm run db:sync-indexes          # development (tsx)
 *   npm run db:sync-indexes:prod     # compiled build
 *
 * Mongoose builds missing indexes when the API starts, but never drops old ones, so run this
 * after changing an index definition.
 */
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { Doctor } from '../modules/doctors/doctor.model.js';
import { Patient } from '../modules/patients/patient.model.js';
import { User } from '../modules/users/user.model.js';

async function main() {
  await connectDatabase();
  console.log(`Syncing indexes on ${mongoose.connection.name}...`);
  for (const model of [User, Doctor, Patient]) {
    const dropped = await model.syncIndexes();
    const current = (await model.listIndexes()).map((index) => index.name);
    console.log(`  ${model.collection.name}: ${current.join(', ')}${dropped.length ? `  (dropped: ${dropped.join(', ')})` : ''}`);
  }
  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
