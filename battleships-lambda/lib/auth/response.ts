import { AuthResponseBody, FP_AUTH_TOKEN } from "../../../shared";
import { generateAuthToken } from "../../../shared/auth/auth-helper";
import { SuccessCode, THttpResponseCode } from "../../../shared/types/response-types";
import { getAuthTokenSecret } from "../auth-secret";
import { isLocal } from "../env";
import { ApiResponse } from "../response/response";
import { PlainApiResponse } from "../response/types";

interface IAuthTokenResponse {
    userId: string;
    thumbprint: string;
    statusCode?: THttpResponseCode;
    body?: AuthResponseBody;
}

export const authTokenResponse = async (params: IAuthTokenResponse): Promise<PlainApiResponse> => {
    const { userId, thumbprint, body, statusCode } = params;

    const authToken = await generateAuthToken({ userId, secret: await getAuthTokenSecret(), thumbprint });
    const response = new ApiResponse({ statusCode: statusCode ?? SuccessCode.SUCCESS }).setHeaders({
        [FP_AUTH_TOKEN]: authToken,
    });

    if (body) {
        response.setBody(body);
    }

    if (isLocal()) {
        response.setHeaders({ "Access-Control-Allow-Origin": "*" });
    }

    return response.setCookie(FP_AUTH_TOKEN, authToken).build();
};
