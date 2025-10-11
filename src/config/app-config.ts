export const appConfig = {
  deployEnv: process.env.DEPLOY_ENV || 'prd',
  apiBaseUrl: process.env.BASE_API_URL || 'http://localhost:3000/api',
};
