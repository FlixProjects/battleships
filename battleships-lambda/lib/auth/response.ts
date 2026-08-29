import { FP_AUTH_TOKEN } from "../../../shared";
import { generateAuthToken } from "../../../shared/auth/auth-helper";
import { getAuthTokenSecret } from "../auth-secret";
import { isLocal } from "../env";
import { ApiResponse } from "../response/response";
import { PlainApiResponse } from "../response/types";

export const authTokenResponse = async (
    userId: string,
    body?: Record<string, string | boolean>,
): Promise<PlainApiResponse> => {
    const authToken = await generateAuthToken(userId, await getAuthTokenSecret());

    const response = new ApiResponse().setHeaders({ [FP_AUTH_TOKEN]: authToken });

    if (body) {
        response.setBody(body);
    }

    if (isLocal()) {
        response.setHeaders({ "Access-Control-Allow-Origin": "*" });
        response.setCookie(`${FP_AUTH_TOKEN}=${authToken}; Path=/; SameSite=Lax`);
    } else {
        response.setCookie(`${FP_AUTH_TOKEN}=${authToken}; Path=/; Secure; SameSite=Strict; HttpOnly;`);
    }

    return response.build();
};
