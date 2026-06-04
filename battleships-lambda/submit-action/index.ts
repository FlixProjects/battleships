import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
    Action,
    FP_AUTH_TOKEN,
    getTokenCookie,
    IPlainGameState,
    IPlayerAction,
    SubmitActionResponse as ISubmitActionResponse,
    transformGameStateToPlain,
    transformPlainGameStateToDomain,
} from "../../shared";
import { handleActions } from "../../shared/utils/action-handler";

interface SubmitActionResponse {
    statusCode: number;
    headers: {
        "fp-auth-token": string;
        "Access-Control-Allow-Headers": string;
        "Access-Control-Allow-Credentials": string;
        "Access-Control-Allow-Origin": string;
    };
    body: string;
    multiValueHeaders?: Record<string, Array<string>>;
}

export const handler = async (event: any) => {
    try {
        const env = process.env.DEPLOY_ENV;
        const LOCAL_ENV = "local";
        const isLocal = env === LOCAL_ENV;

        const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

        const playerId = getTokenCookie(event.cookies || event.multiValueHeaders.Cookie);

        if (!playerId) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    message: "No Player id found",
                }),
            };
        }

        const gameCode = body.gameCode;
        const actions = body.actions as IPlayerAction[];

        let gameState: IPlainGameState = body.gameState; // will only be present for local
        console.log(`Request Body for ${playerId}:`, JSON.stringify(body));

        if (!gameCode) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: "Bad request: missing game code",
                    body,
                }),
            };
        }

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
            console.log("Fetched Game State", gameState);
        }

        if (!gameState || gameState.code !== gameCode) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    message: "Game not found",
                }),
            };
        }

        const { results, newGameState, obscuredGameState } = handleActions(
            playerId!,
            transformPlainGameStateToDomain(gameState),
            actions.map((a) => Action.toDomain(a)),
        );

        gameState = transformGameStateToPlain(newGameState);

        if (!isLocal) {
            await s3.send(
                new PutObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: `games/${gameCode}.json`,
                    Body: JSON.stringify(gameState),
                    ContentType: "application/json",
                }),
            );
        }

        const responseBody: ISubmitActionResponse = {
            gameState: obscuredGameState ? transformGameStateToPlain(obscuredGameState) : gameState,
            results,
        };

        if (isLocal) {
            responseBody.gameStateForLocal = gameState;
        }

        const response: SubmitActionResponse = {
            statusCode: 200,
            headers: {
                [FP_AUTH_TOKEN]: playerId,
                "Access-Control-Allow-Origin": "*", // FIXME: restrict origins
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Credentials": "true",
            },
            body: JSON.stringify(responseBody),
        };

        return response;
    } catch (err: any) {
        /**
         * error shape
         * {
         *  code: string;
         *  message: string;
         *  name: string;
         *  $fault: "client" | "server";
         * }
         */
        return {
            statusCode: err.code ?? 500,
            message: err.message,
            name: err.name,
            fault: err.$fault,
        };
    }
};
