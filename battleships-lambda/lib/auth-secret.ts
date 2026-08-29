import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { isLocal } from "./env";

const PARAMETER_REGION = "ap-southeast-1";
const PLACEHOLDER_VALUE = "REPLACE_ME_VIA_PUT_PARAMETER";

let client: SSMClient | undefined;
let cachedSecret: string | undefined;

const getClient = (): SSMClient => {
    client ??= new SSMClient({ region: PARAMETER_REGION });
    return client;
};

const fetchSecret = async (): Promise<string> => {
    const parameterName = process.env.AUTH_TOKEN_SECRET_PARAM;

    if (!parameterName) {
        throw new Error("AUTH_TOKEN_SECRET_PARAM is not set");
    }

    const { Parameter } = await getClient().send(
        new GetParameterCommand({ Name: parameterName, WithDecryption: true }),
    );

    const value = Parameter?.Value;

    if (!value || value === PLACEHOLDER_VALUE) {
        throw new Error(`${parameterName} has not been seeded with a real secret`);
    }

    return value;
};

export const getAuthTokenSecret = async (): Promise<string> => {
    if (isLocal()) {
        // sam local has no parameter store to reach for
        return Promise.resolve(process.env.AUTH_TOKEN_SECRET ?? "test-secret");
    }

    cachedSecret ??= await fetchSecret();

    return cachedSecret;
};
