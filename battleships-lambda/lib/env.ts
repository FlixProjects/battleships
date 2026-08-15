const LOCAL_ENV = "local";

export const isLocal = (): boolean => process.env.DEPLOY_ENV === LOCAL_ENV;
