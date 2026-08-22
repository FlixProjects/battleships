import { verifyAuthToken } from "../../shared/auth/auth-helper";
import { FP_AUTH_TOKEN } from "../../shared/constants";
import { getAuthTokenSecret } from "./auth-secret";
import { getRequestCookie, type ICookieCarrier } from "./cookie-helper";
import { type LambdaResponse, errorResponse } from "./http";

export interface IAuthContext {
    /** the token's `sub` — the user id minted at sign-up, or a throwaway guest id */
    userId: string;
}

export type TAuthedHandler<TEvent, TResult> = (event: TEvent, auth: IAuthContext) => Promise<TResult>;

const UNAUTHORISED = "authentication required";

export const withAuth =
    <TEvent extends ICookieCarrier, TResult>(handler: TAuthedHandler<TEvent, TResult>) =>
    async (event: TEvent): Promise<TResult | LambdaResponse> => {
        const token = getRequestCookie(event, FP_AUTH_TOKEN);

        if (!token) {
            return errorResponse(401, UNAUTHORISED);
        }

        let userId: string;

        try {
            userId = await verifyAuthToken(token, await getAuthTokenSecret());
        } catch (err) {
            console.log("auth verification failed:", err);
            return errorResponse(401, UNAUTHORISED);
        }

        return await handler(event, { userId });
    };
