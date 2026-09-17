import { PutCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent } from "aws-lambda";
import { randomUUID } from "node:crypto";
import { validateAuthRequest } from "../../shared/auth/auth-request-validator";
import { JwtHelper } from "../../shared/auth/jwt-helper";
import { hashPassword } from "../../shared/auth/password-helper";
import { ERROR_MESSAGES } from "../../shared/constants";
import type { SignUpRequest } from "../../shared/types/domains";
import { ErrorCode, SuccessCode } from "../../shared/types/response-types";
import { ResultType } from "../../shared/types/result-types";
import { authTokenResponse } from "../lib/auth/response";
import { USERS_TABLE, getDocClient } from "../lib/dynamo";
import { ErrorApiResponse } from "../lib/response/error-response";
import { InternalServerErrorApiResponse } from "../lib/response/internal-server-error-response";
import { type PlainApiResponse } from "../lib/response/types";

export const handler = async (event: APIGatewayProxyEvent): Promise<PlainApiResponse> => {
    try {
        if (!event.body) {
            return new ErrorApiResponse(ErrorCode.BAD_REQUEST).setMessage(ERROR_MESSAGES.MISSING_REQUEST_BODY).build();
        }

        const body = JSON.parse(event.body) as Partial<SignUpRequest>;

        const result = await validateAuthRequest(body);
        if (result.type === ResultType.ERROR) {
            return new ErrorApiResponse(ErrorCode.BAD_REQUEST).setMessage(result.message).build();
        }

        const username = String(body.username).trim().toLowerCase();
        const userId = randomUUID();
        const jkt = await new JwtHelper().getThumprint(result.body.publicJwk);
        const now = new Date().toISOString();
        await getDocClient().send(
            new PutCommand({
                TableName: USERS_TABLE,
                Item: {
                    id: userId,
                    username,
                    password: await hashPassword(String(body.password)),
                    publicJwk: { ...body.publicJwk, jkt },
                    createdAt: now,
                    modifiedAt: now,
                },
                // the table is keyed on username, so this is what enforces uniqueness
                ConditionExpression: "attribute_not_exists(username)",
            }),
        );

        return authTokenResponse({
            userId,
            thumbprint: jkt,
            statusCode: SuccessCode.CREATED,
            body: { message: "Sign up successful", playerId: userId },
        });
    } catch (err) {
        if (err instanceof Error && err.name === "ConditionalCheckFailedException") {
            return new ErrorApiResponse(ErrorCode.CONFLICT).setMessage(ERROR_MESSAGES.USERNAME_TAKEN).build();
        }

        console.error("sign-up failed", err);
        return new InternalServerErrorApiResponse().build();
    }
};
