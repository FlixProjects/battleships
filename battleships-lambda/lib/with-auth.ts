import { verifyAuthToken } from "../../shared/auth/auth-helper";
import { ERROR_MESSAGES, FP_AUTH_TOKEN } from "../../shared/constants";
import { ErrorCode } from "../../shared/types/response-types";
import { getAuthTokenSecret } from "./auth-secret";
import { getRequestCookie, type ICookieCarrier } from "./cookie-helper";
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

        if (!token) {
            return new ErrorApiResponse(ErrorCode.UNAUTHORISED).setMessage(ERROR_MESSAGES.MISSING_TOKEN).build();
        }

        let userId: string;

        try {
            userId = await verifyAuthToken(token, await getAuthTokenSecret());
        } catch (err) {
            if ((err as IVerifyTokenError).code === "ERR_JWT_EXPIRED") {
                return new ErrorApiResponse(ErrorCode.UNAUTHORISED).setMessage(ERROR_MESSAGES.EXPIRED_TOKEN).build();
            }
            console.log("auth verification failed:", JSON.stringify(err));
            return new ErrorApiResponse(ErrorCode.UNAUTHORISED).setMessage(ERROR_MESSAGES.UNAUTHORISED).build();
        }

        return await handler(event, { userId });
    };