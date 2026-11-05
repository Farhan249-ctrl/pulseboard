const zod = require('zod');

const envSchema = zod.object({
  NODE_ENV: zod.enum(['development', 'production', 'test']).default('development'),
  API_PORT: zod.string().transform(Number).pipe(zod.number().int().positive()),
  MONGO_DEV_PORT: zod.string().transform(Number).pipe(zod.number().int().positive()).optional(),
  MONGO_INITDB_ROOT_USERNAME: zod.string().optional(),
  MONGO_INITDB_ROOT_PASSWORD: zod.string().optional(),
  MONGO_APP_DB: zod.string().min(1),
  MONGO_APP_USER: zod.string().min(1),
  MONGO_APP_PASSWORD: zod.string().min(1),
  MONGO_HOST: zod.string().min(1),
  MONGO_PORT: zod.string().transform(Number).pipe(zod.number().int().positive()),
  MONGO_URI: zod.string().url().optional(),
  JWT_SECRET: zod.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: zod.string().default('2h'),
  ADMIN_EMAIL: zod.string().email(),
  ADMIN_PASSWORD: zod.string().min(8),
  SEED_DEMO_PASSWORD: zod.string().min(8).default('demo123456'),
  CORS_NOTE: zod.string().optional()
});

function loadConfig() {
  const rawEnv = { ...process.env };

  const parsed = envSchema.safeParse(rawEnv);

  if (!parsed.success) {
    console.error('Configuration validation failed:');
    parsed.error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }

  const env = parsed.data;

  const mongoUri = env.MONGO_URI || `mongodb://${env.MONGO_APP_USER}:${encodeURIComponent(env.MONGO_APP_PASSWORD)}@${env.MONGO_HOST}:${env.MONGO_PORT}/${env.MONGO_APP_DB}?authSource=${env.MONGO_APP_DB}`;

  const isTest = env.NODE_ENV === 'test';

  return {
    nodeEnv: env.NODE_ENV,
    port: env.API_PORT,
    mongoUri,
    mongoDbName: env.MONGO_APP_DB,
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    adminEmail: env.ADMIN_EMAIL,
    adminPassword: env.ADMIN_PASSWORD,
    seedDemoPassword: env.SEED_DEMO_PASSWORD,
    isTest,
    disableRateLimit: isTest
  };
}

const config = loadConfig();

module.exports = config;
