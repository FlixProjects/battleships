import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export const handler = async (event: any) => {
    try {
        const env = process.env.DEPLOY_ENV;
        const LOCAL_ENV = "local";
        const isLocal = env === LOCAL_ENV;
        console.log("Get Game Event:", event);

        const gameCode = event.queryStringParameters?.code;
        let gameState = null;

        const s3 = new S3Client({ region: process.env.AWS_REGION }); // AWS_REGION is a reserved keyword for AWS, for now its okay to leave as is
        const BUCKET_NAME = process.env.GAMES_BUCKET!; // set in lambda, TODO: we should inject this value

        if (!isLocal) {
            const { Body } = await s3.send(
                new GetObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: `games/${gameCode}.json`,
                }),
            );

            const bodyStr = await Body?.transformToString("utf-8");

            gameState = bodyStr ? JSON.parse(bodyStr) : null;

            if (!gameState || gameState.code !== gameCode) {
                return {
                    statusCode: 404,
                    body: JSON.stringify({
                        message: "Game not found",
                    }),
                };
            }

            // TODO: check header for player id and verify they are part of the game
        }

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // FIXME: restrict origins
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Credentials": "true",
            },
            body: JSON.stringify({ gameState }),
        };
    } catch (err: any) {
        return {
            statusCode: err.code ?? 500,
            message: err.message,
            name: err.name,
            fault: err.$fault,
        };
    }
};
