export const appConfig = {
    deployEnv: process.env.DEPLOY_ENV || "prd",
    apiBaseUrl: process.env.BASE_API_URL || "http://localhost:3000/api",
    awsRegion: process.env.AWS_REGION || "ap-southeast-1",
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "testKey",
};

export const isLocal = appConfig.deployEnv === "local";