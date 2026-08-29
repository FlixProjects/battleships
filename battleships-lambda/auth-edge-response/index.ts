// https://github.com/aws/aws-lambda-nodejs-runtime-interface-client/issues/137

import { CloudFrontResponseEvent } from "aws-lambda";

// DEPRECATED
export const handler = async (event: CloudFrontResponseEvent) => {
    const FP_AUTH_TOKEN = "fp-auth-token";

    const response = event.Records?.[0]?.cf?.response;

    let headers = response?.headers;

    const authToken = headers[FP_AUTH_TOKEN]?.[0]?.value;

    if (authToken) {
        const { [FP_AUTH_TOKEN]: _removedAuthToken, ...otherHeaders } = headers;
        response.headers = otherHeaders;
        response.headers["set-cookie"] = [
            { key: "Set-Cookie", value: `${FP_AUTH_TOKEN}=${authToken}; Path=/; Secure; SameSite=Strict; HttpOnly;` },
        ];
    }

    return response;
};
