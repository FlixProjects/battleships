import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { LambdaFunctionURLEvent } from "aws-lambda";
import { transformGameStateToPlain, transformPlainGameStateToDomain } from "../../shared/transformers";
import { ActionResolver } from "../../shared/utils/action-handler/ActionResolver";
import { getGamesBucket, isLocal } from "../lib/env";
import { type LambdaResponse, corsHeaders, errorResponse } from "../lib/http";
import { withAuth } from "../lib/with-auth";
import type { GetGameResponse } from "../../shared/types/domains";
import type { IPlainGameState } from "../../shared/types/types";

export const handler = withAuth(async (event: LambdaFunctionURLEvent, auth): Promise<LambdaResponse> => {
    try {
        const gameCode = event.queryStringParameters?.code;
        let gameState: IPlainGameState | undefined;

        if (isLocal()) {
            // we will only have body for local
            const body = (event.body ? JSON.parse(event.body) : {}) as { gameState?: IPlainGameState };
            gameState = body.gameState;
        } else {
            const { Body } = await new S3Client({ region: process.env.AWS_REGION }).send(
                new GetObjectCommand({ Bucket: getGamesBucket(), Key: `games/${gameCode}.json` }),
            );

            const bodyStr = await Body?.transformToString("utf-8");
            gameState = bodyStr ? JSON.parse(bodyStr) : undefined;
        }

        if (!gameState || gameState.code !== gameCode) {
            return errorResponse(404, "Game not found");
        }

        // withAuth proves who the caller is; this proves they belong in this game
        if (!gameState.players?.some((player) => player.id === auth.userId)) {
            return errorResponse(403, "You are not authorised to join this game");
        }

        const { obscuredGameState } = new ActionResolver(
            auth.userId,
            transformPlainGameStateToDomain(gameState),
        ).resolveVisibility();

        const responseBody: GetGameResponse = {
            gameState: transformGameStateToPlain(obscuredGameState),
        };

        return {
            statusCode: 200,
            headers: corsHeaders(),
            body: JSON.stringify(responseBody),
        };
    } catch (err) {
        console.error("get-game failed", err);
        return errorResponse(500, "some error happened");
    }
});

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
