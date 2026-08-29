import { GetCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent } from "aws-lambda";
import { randomUUID } from "node:crypto";
import { generateAuthToken } from "../../shared/auth/auth-helper";
import { verifyPassword } from "../../shared/auth/password-helper";
import { ERROR_MESSAGES, FP_AUTH_TOKEN } from "../../shared/constants";
import type { LoginRequest } from "../../shared/types/domains";
import { ErrorCode } from "../../shared/types/response-types";
import { getAuthTokenSecret } from "../lib/auth-secret";
import { USERS_TABLE, getDocClient } from "../lib/dynamo";
import { isLocal } from "../lib/env";
import { ErrorApiResponse } from "../lib/response/error-response";
import { InternalServerErrorApiResponse } from "../lib/response/internal-server-error-response";
import { ApiResponse } from "../lib/response/response";
import { type PlainApiResponse } from "../lib/response/types";

/** Only the fields this route reads; the rest of the item is left alone. */
interface UserRecord {
    id: string;
    username: string;
    /** scrypt digest stored as `salt:derivedKey`, see shared/auth/password-helper */
    password: string;
}

// A well-formed but unmatchable hash (16-byte salt, 64-byte key) so the
// "no such user" path still pays for one scrypt derivation. Without it the
// response time alone tells an attacker which usernames exist.
const TIMING_EQUALISER_HASH = `${"0".repeat(32)}:${"0".repeat(128)}`;

const isGuestLogin = (event: APIGatewayProxyEvent): boolean => event.queryStringParameters?.guest === "true";

const getUser = async (username: string): Promise<UserRecord | undefined> => {
    // the table is keyed on username, so this is a point read rather than a query
    const result = await getDocClient().send(new GetCommand({ TableName: USERS_TABLE, Key: { username } }));

    return result.Item as UserRecord | undefined;
};

/**
 * Same token hand-off as sign-up: the JWT rides a response *header*, which the
 * Lambda@Edge viewer-response strips and re-emits as an HttpOnly cookie.
 * Locally there is no edge function, so the cookie is set here instead.
 */
const authTokenResponse = async (userId: string, body: Record<string, string | boolean>): Promise<PlainApiResponse> => {
    const authToken = await generateAuthToken(userId, await getAuthTokenSecret());

    const response = new ApiResponse().setHeaders({ [FP_AUTH_TOKEN]: authToken }).setBody(body);

    if (isLocal()) {
        response.setHeaders({ "Access-Control-Allow-Origin": "*" });
        response.setCookie(`${FP_AUTH_TOKEN}=${authToken}; Path=/; SameSite=Lax`);
    }

    return response.build();
};

export const handler = async (event: APIGatewayProxyEvent): Promise<PlainApiResponse> => {
    try {
        if (isGuestLogin(event)) {
            // guests are never persisted — the uuid exists only inside the token,
            // so a new one is minted on every guest login and dies with it
            return await authTokenResponse(randomUUID(), { message: "Guest login successful", isGuest: true });
        }

        if (!event.body) {
            return new ErrorApiResponse(ErrorCode.BAD_REQUEST).setMessage(ERROR_MESSAGES.MISSING_REQUEST_BODY).build();
        }

        const body = JSON.parse(event.body) as Partial<LoginRequest>;

        // no min-length rules here: an under-length password is simply a failed
        // login, and enforcing sign-up's policy would just advertise it
        if (typeof body.username !== "string" || typeof body.password !== "string") {
            return new ErrorApiResponse(ErrorCode.BAD_REQUEST).setMessage(ERROR_MESSAGES.MISSING_CREDENTIALS).build();
        }

        const username = body.username.trim().toLowerCase();
        const user = await getUser(username);
        const isValidPassword = await verifyPassword(body.password, user?.password ?? TIMING_EQUALISER_HASH);

        if (!user || !isValidPassword) {
            return new ErrorApiResponse(ErrorCode.UNAUTHORISED).setMessage(ERROR_MESSAGES.INVALID_CREDENTIALS).build();
        }

        // the token is subject to the stored user id, never the username
        return await authTokenResponse(user.id, {
            message: "Login successful",
            userId: user.id,
            username: user.username,
            isGuest: false,
        });
    } catch (err) {
        console.error("login failed", err);
        return new InternalServerErrorApiResponse().build();
    }
};
