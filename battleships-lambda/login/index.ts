import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent } from "aws-lambda";
import { randomUUID } from "node:crypto";
import { JwtHelper } from "../../shared/auth/jwt-helper";
import { verifyPassword } from "../../shared/auth/password-helper";
import { ERROR_MESSAGES } from "../../shared/constants";
import type { LoginRequest } from "../../shared/types/domains";
import { ErrorCode } from "../../shared/types/response-types";
import { authTokenResponse } from "../lib/auth/response";
import { USERS_TABLE, getDocClient } from "../lib/dynamo";
import { ErrorApiResponse } from "../lib/response/error-response";
import { InternalServerErrorApiResponse } from "../lib/response/internal-server-error-response";
import type { PlainApiResponse } from "../lib/response/types";

/** Only the fields this route reads; the rest of the item is left alone. */
interface UserRecord {
    id: string;
    username: string;
    /** scrypt digest stored as `salt:derivedKey`, see shared/auth/password-helper */
    password: string;
}

interface ILoginHandlerParams {
    thumbprint: string;
}

interface IGuestLoginHandlerParams extends ILoginHandlerParams {}

interface IUserLoginHandlerParams extends ILoginHandlerParams {
    username: string;
    password: string;
    publicJwk: any;
    body?: any;
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

export const handler = async (event: APIGatewayProxyEvent): Promise<PlainApiResponse> => {
    if (!event.body) {
        return new ErrorApiResponse(ErrorCode.BAD_REQUEST).setMessage(ERROR_MESSAGES.MISSING_REQUEST_BODY).build();
    }

    const body = JSON.parse(event.body) as Partial<LoginRequest>;

    if (!body.publicJwk) {
        return new ErrorApiResponse(ErrorCode.UNAUTHORISED).setMessage(ERROR_MESSAGES.MISSING_CLIENT_JWKS).build();
    }

    const jkt = await new JwtHelper().getThumprint(body.publicJwk);

    try {
        if (isGuestLogin(event)) {
            return handleGuestLogin({ thumbprint: jkt });
        }
        const { username, password, publicJwk } = body;
        if (typeof username !== "string" || typeof password !== "string") {
            return new ErrorApiResponse(ErrorCode.BAD_REQUEST).setMessage(ERROR_MESSAGES.MISSING_CREDENTIALS).build();
        }
        return handleUserLogin({ username, password, thumbprint: jkt, publicJwk });
    } catch (err) {
        console.error("login failed", err);
        return new InternalServerErrorApiResponse().build();
    }
};

const handleGuestLogin = async (params: IGuestLoginHandlerParams) => {
    const { thumbprint } = params;

    const guestUserId = randomUUID();
    return await authTokenResponse({
        userId: guestUserId,
        thumbprint,
        body: {
            message: "Guest login successful",
            playerId: guestUserId,
            isGuest: true,
        },
    });
};

const handleUserLogin = async (params: IUserLoginHandlerParams) => {
    const { username, password, publicJwk, thumbprint } = params;

    const user = await getUser(username.trim().toLowerCase());
    const isValidPassword = await verifyPassword(password, user?.password ?? TIMING_EQUALISER_HASH);

    // TODO: use proper validator
    if (!user || !isValidPassword) {
        return new ErrorApiResponse(ErrorCode.UNAUTHORISED).setMessage(ERROR_MESSAGES.INVALID_CREDENTIALS).build();
    }

    await getDocClient().send(
        new UpdateCommand({
            TableName: USERS_TABLE,
            Key: { username },
            UpdateExpression: "SET publicJwk = :publicJwk, modifiedAt = :now",
            ConditionExpression: "attribute_exists(username)",
            ExpressionAttributeValues: {
                ":publicJwk": { ...publicJwk, jkt: thumbprint },
                ":now": new Date().toISOString(),
            }, // :<value> -> actual value
        }),
    );

    // the token is subject to the stored user id, never the username
    return await authTokenResponse({
        userId: user.id,
        thumbprint,
        body: {
            message: "Login successful",
            playerId: user.id,
            isGuest: false,
        },
    });
};
