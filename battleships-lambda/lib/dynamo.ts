import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const LOCAL_ENV = "local";
const DEFAULT_REGION = "ap-southeast-1";
const DEFAULT_LOCAL_ENDPOINT = "http://dynamodb-local:8000";

export const USERS_TABLE = process.env.USERS_TABLE ?? "battleships-users";

export const isLocal = (): boolean => process.env.DEPLOY_ENV === LOCAL_ENV;

let docClient: DynamoDBDocumentClient | undefined;

export const getDocClient = (): DynamoDBDocumentClient => {
    if (docClient) {
        return docClient;
    }

    const config: DynamoDBClientConfig = { region: process.env.AWS_REGION ?? DEFAULT_REGION };

    if (isLocal()) {
        // DynamoDB Local ignores the credential values, but the SDK refuses to sign without them
        config.endpoint = process.env.DYNAMODB_ENDPOINT ?? DEFAULT_LOCAL_ENDPOINT;
        config.credentials = { accessKeyId: "local", secretAccessKey: "local" };
    }

    docClient = DynamoDBDocumentClient.from(new DynamoDBClient(config), {
        marshallOptions: { removeUndefinedValues: true },
    });

    return docClient;
};
