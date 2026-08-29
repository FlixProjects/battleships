import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { LambdaFunctionURLEvent } from "aws-lambda";
import { ERROR_MESSAGES } from "../../shared/constants";
import { transformGameStateToPlain, transformPlainGameStateToDomain } from "../../shared/transformers";
import type { GetGameResponse } from "../../shared/types/domains";
import { ErrorCode } from "../../shared/types/response-types";
import type { IPlainGameState } from "../../shared/types/types";
import { ActionResolver } from "../../shared/utils/action-handler/ActionResolver";
import { getGamesBucket, isLocal } from "../lib/env";
import { ErrorApiResponse } from "../lib/response/error-response";
import { InternalServerErrorApiResponse } from "../lib/response/internal-server-error-response";
import { ApiResponse } from "../lib/response/response";
import { type PlainApiResponse } from "../lib/response/types";
import { withAuth } from "../lib/with-auth";

export const handler = withAuth(async (event: LambdaFunctionURLEvent, auth): Promise<PlainApiResponse> => {
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
            return new ErrorApiResponse(ErrorCode.NOT_FOUND).setMessage(ERROR_MESSAGES.GAME_NOT_FOUND).build();
        }

        // withAuth proves who the caller is; this proves they belong in this game
        if (!gameState.players?.some((player) => player.id === auth.userId)) {
            return new ErrorApiResponse(ErrorCode.AUTHORIZATION_FAILED)
                .setMessage(ERROR_MESSAGES.NOT_A_PLAYER_IN_GAME)
                .build();
        }

        const { obscuredGameState } = new ActionResolver(
            auth.userId,
            transformPlainGameStateToDomain(gameState),
        ).resolveVisibility();

        const responseBody: GetGameResponse = {
            gameState: transformGameStateToPlain(obscuredGameState),
        };

        return new ApiResponse().setBody(responseBody).build();
    } catch (err) {
        console.error("get-game failed", err);
        return new InternalServerErrorApiResponse().build();
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
