const LOCAL_ENV = "local";

export const isLocal = (): boolean => process.env.DEPLOY_ENV === LOCAL_ENV;

export const getGamesBucket = (): string => {
    const bucket = process.env.GAMES_BUCKET;

    if (!bucket) {
        throw new Error("GAMES_BUCKET is not set");
    }

    return bucket;
};
