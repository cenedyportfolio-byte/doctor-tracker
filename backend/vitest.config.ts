import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Integration tests share one database, so files run one at a time.
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 30_000,
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: process.env.MONGODB_URI_TEST ?? 'mongodb://localhost:27017/doctor_tracker_test',
      JWT_SECRET: 'test-secret-that-is-definitely-longer-than-32-chars',
      STATS_CACHE_TTL_SECONDS: '60',
    },
  },
});
