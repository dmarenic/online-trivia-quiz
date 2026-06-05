export function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'FRONTEND_URL'];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}