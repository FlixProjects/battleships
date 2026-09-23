import { verifyClientToken } from "../../shared/auth/auth-helper";
import { JwtHelper } from "../../shared/auth/jwt-helper";
import { ERROR_MESSAGES, FP_AUTH_TOKEN, FP_CLIENT_TOKEN } from "../../shared/constants";
import { ErrorCode } from "../../shared/types/response-types";
import { getAuthTokenSecret } from "./auth-secret";
import { getHeader, getRequestCookie, type ICookieCarrier } from "./cookie-helper";
import { ErrorApiResponse } from "./response/error-response";
import { type PlainApiResponse } from "./response/types";

export interface IAuthContext {
    /** the token's `sub` — the user id minted at sign-up, or a throwaway guest id */
    userId: string;
}

// TODO: Does jose export error interface?
export interface IVerifyTokenError {
    code?: string;
    claim?: string;
    reason?: string;
    payload?: any;
}

export type TAuthedHandler<TEvent, TResult> = (event: TEvent, auth: IAuthContext) => Promise<TResult>;

export const withAuth =
    <TEvent extends ICookieCarrier, TResult>(handler: TAuthedHandler<TEvent, TResult>) =>
    async (event: TEvent): Promise<TResult | PlainApiResponse> => {
        const token = getRequestCookie(event, FP_AUTH_TOKEN);

        const clientToken = getHeader(event, FP_CLIENT_TOKEN);

        if (!token || !clientToken) {
            return new ErrorApiResponse(ErrorCode.UNAUTHORISED)
                .setMessage(!clientToken ? ERROR_MESSAGES.MISSING_CLIENT_TOKEN : ERROR_MESSAGES.MISSING_TOKEN)
                .build();
        }

        let userId: string;

        try {
            const jwtHelper = new JwtHelper();
            // TODO: group this into verifyAuthToken
            const payload = await new JwtHelper().verify(token, await getAuthTokenSecret(), "HS256");

            if (typeof payload.sub !== "string" || payload.sub.length === 0) {
                throw new Error("auth token has no subject");
            }
            const authTokenJkt: string = (payload.cnf as any)?.["jkt"];
            if (!authTokenJkt) {
                throw new Error(ERROR_MESSAGES.MISSING_AUTH_TOKEN_JKT);
            }
            const headers = jwtHelper.decodeHeaders(clientToken);
            await verifyClientToken({ clientToken, authTokenJkt, publicJwk: headers.jwk! });

            userId = payload.sub;
        } catch (err) {
            if ((err as IVerifyTokenError).code === "ERR_JWT_EXPIRED") {
                return new ErrorApiResponse(ErrorCode.AUTHORIZATION_FAILED)
                    .setMessage(ERROR_MESSAGES.EXPIRED_TOKEN)
                    .build();
            }
            console.log("auth verification failed:", JSON.stringify(err));
            return new ErrorApiResponse(ErrorCode.UNAUTHORISED).setMessage(ERROR_MESSAGES.UNAUTHORISED).build();
        }

        return await handler(event, { userId });
    };