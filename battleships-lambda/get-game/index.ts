import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
    GetGameResponse,
    IPlainGameState,
    getTokenCookie,
    transformGameStateToPlain,
    transformPlainGameStateToDomain,
} from "../../shared";
import { ActionResolver } from "../../shared/utils/action-handler/ActionResolver";

export const handler = async (event: any) => {
    try {
        const LOCAL_ENV = "local";
        const isLocal = process.env.DEPLOY_ENV === LOCAL_ENV;

        console.log("Get Game Event:", event);

        const userId = getTokenCookie(event.cookies || event.multiValueHeaders.Cookie);

        if (!userId) {
            return NotFoundError;
        }

        const gameCode = event.queryStringParameters?.code;

        let gameState: IPlainGameState;

        if (isLocal) {
            // we will only have body for local
            const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
            gameState = body?.gameState;
        } else {
            const s3 = new S3Client({ region: process.env.AWS_REGION }); // AWS_REGION is a reserved keyword for AWS, for now its okay to leave as is
            const BUCKET_NAME = process.env.GAMES_BUCKET!; // set in lambda, TODO: we should inject this value

            const { Body } = await s3.send(
                new GetObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: `games/${gameCode}.json`,
                }),
            );

            const bodyStr = await Body?.transformToString("utf-8");

            gameState = bodyStr ? JSON.parse(bodyStr) : null;
        }

        if (!gameState || gameState.code !== gameCode) {
            return NotFoundError;
        }

        if (!gameState.players?.find((p: { id: string }) => p.id === userId)) {
            return WrongGameError;
        }

        const { obscuredGameState } = new ActionResolver(
            userId,
            transformPlainGameStateToDomain(gameState),
        ).resolveVisibility();

        const responseBody: GetGameResponse = {
            gameState: transformGameStateToPlain(obscuredGameState),
        };

        // TODO: might not need this since we don't modify actual game state and don't need to save
        // the new actual gameState to sessionStorage
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Credentials": "true",
            },
            body: JSON.stringify(responseBody),
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

const NotFoundError = {
    statusCode: 404,
    body: JSON.stringify({
        message: "Game not found",
    }),
};

const WrongGameError = {
    statusCode: 403,
    body: JSON.stringify({
        message: "You are not authorised to join this game",
    }),
};

/**
Reference shape for event
{
  version: '2.0',
  routeKey: '$default',
  rawPath: '/api',
  rawQueryString: 'code=A4H0',
  cookies: [ 'fp-auth-token=8961d64b-c766-410a-ab42-920350bb2ca6' ],
  headers: {
    ...
  },
  queryStringParameters: { code: 'A4H0' },
  requestContext: {
    accountId: "some-string-id",
    apiId: <function-prefix>,
    authorizer: { iam: [Object] },
    domainName: '<function-prefix>.lambda-url.ap-southeast-1.on.aws',
    domainPrefix: <function-prefix>,
    http: {
      method: 'GET',
      path: '/api',
      ...
    },
    requestId: 'ff8dad3c-a9bc-4825-9cdb-7a33b5291fcb',
    routeKey: '$default',
    stage: '$default',
    time: '07/Nov/2025:07:17:28 +0000',
    timeEpoch: 1762499848335
  },
  isBase64Encoded: false
}
 */
