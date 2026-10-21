import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

export async function connectDatabase(uri: string = env.MONGODB_URI): Promise<typeof mongoose> {
  const connection = await mongoose.connect(uri, {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 10_000,
  });
  return connection;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
