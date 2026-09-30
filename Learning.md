# Learning Notes

Things I learned while building Battleships, mostly about AWS. Where the project has since moved
on, a **Now:** line says what it does today. For setup steps see [README-setup.md](./README-setup.md).

## Contents

- [Local backend (SAM)](#local-backend-sam)
- [GitHub Actions to AWS (OIDC)](#github-actions-to-aws-oidc)
- [Lambda permissions](#lambda-permissions)
- [CloudFront](#cloudfront)
- [Cookies](#cookies)
- [API Gateway (not used)](#api-gateway-not-used)
- [Auth design](#auth-design)
- [TypeScript gotchas](#typescript-gotchas)
- [Problems faced](#problems-faced)

## Local backend (SAM)

- Install the [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html).
  It needs **Docker**, because every lambda runs in its own container.
- `esbuild` must be in `dependencies`, not `devDependencies`. SAM runs a production `npm install`
  before bundling, so dev dependencies are missing:

    ```json
    "dependencies": {
        "esbuild": "^0.14.14"
    }
    ```

- `zip` must be installed to package the lambdas (`scripts/build.sh`).
- Each lambda used to need its own `package.json`.
  **Now:** every function in `template.yaml` uses `CodeUri: ../`, so SAM builds from the repo root,
  uses the root `package.json` and can see `shared/`. The function folders only hold `index.ts`.
- Inside a SAM container, `localhost` is the container itself, not your machine. To reach
  DynamoDB Local, both have to join the same Docker network (`--docker-network battleships-local`)
  and the lambda uses the container name (`http://dynamodb-local:8000`).
- The SAM local API emulates API Gateway and sends **payload v1** events, with cookies under
  `headers` / `multiValueHeaders`. Function URLs send **payload v2**, with a `cookies` array. Code
  has to handle both (`battleships-lambda/lib/cookie-helper.ts`).

## GitHub Actions to AWS (OIDC)

References:

- [aws-samples: CodeDeploy + GitHub Actions](https://github.com/aws-samples/aws-codedeploy-github-actions-deployment/tree/main/.github)
- [GitHub: requesting the OIDC token](https://docs.github.com/en/actions/reference/security/oidc#methods-for-requesting-the-oidc-token)
- [GitHub: OIDC in AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)

Steps:

1. Create an IAM OIDC identity provider for `token.actions.githubusercontent.com` (audience
   `sts.amazonaws.com`).
2. Create a role for GitHub Actions to assume. Every role has two policies:
    - **Trust policy**: *who* can assume the role (here, the GitHub OIDC provider, limited to one
      repo, branch and environment by the `sub` claim)
    - **Permissions policy**: *what* the role can do

Example permissions policy (the manual version):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "UploadFrontend",
            "Effect": "Allow",
            "Action": "s3:PutObject",
            "Resource": "*"
        },
        {
            "Sid": "DeployLambdas",
            "Effect": "Allow",
            "Action": [
                "lambda:GetFunctionConfiguration",
                "lambda:CreateFunction",
                "lambda:UpdateFunctionConfiguration",
                "lambda:UpdateFunctionCode",
                "lambda:PublishVersion"
            ],
            "Resource": [
                "arn:aws:lambda:ap-southeast-1:<AWS_ACCOUNT_NO>:function:create-game",
                "arn:aws:lambda:ap-southeast-1:<AWS_ACCOUNT_NO>:function:join-game",
                "arn:aws:lambda:ap-southeast-1:<AWS_ACCOUNT_NO>:function:get-game"
            ]
        },
        {
            "Sid": "PassRolesDefinition",
            "Effect": "Allow",
            "Action": ["iam:PassRole"],
            "Resource": ["arn:aws:iam::<AWS_ACCOUNT_NO>:role/lambda-to-s3"]
        }
    ]
}
```

- `PassRolesDefinition` lets the CI role create a lambda that uses another role. The lambda still
  needs resource-based policy statements before CloudFront can call it (see
  [Lambda permissions](#lambda-permissions)).
- Using a GitHub **environment** (`prd-deploy`) lets you require approval before a deploy. The
  trust policy then has to allow `repo:<org>/<repo>:environment:prd-deploy` in the `sub` claim.

**Now:** the CI role and its policies are in `terraform/github-iam.tf`. The OIDC provider is
still created by hand, once per account.

## Lambda permissions

- A lambda needs an **execution role** to reach other services. Manually: IAM → Create role →
  AWS service → `AWSLambdaExecute`, then Lambda → Configuration → Permissions → swap in the role.
- For CloudFront to call a function URL with **POST**, the lambda's resource policy needs **both**
  `lambda:InvokeFunctionUrl` **and** `lambda:InvokeFunction` for the `cloudfront.amazonaws.com`
  principal.

Adding a new lambda used to take these manual steps:

1. Add the lambda to the CI role
2. Create a function URL for it
3. Add it as a CloudFront origin and behaviour
4. Set its environment variables

**Now:** Terraform does all four. Each function gets its own execution role (`terraform/iam.tf`),
both invoke permissions (`terraform/lambda.tf`) and an origin with a behaviour
(`terraform/cloudfront.tf`), all driven by `locals.lambda_functions` in `terraform/main.tf`. The
new function still has to be added as a deploy step in `.github/workflows/.lambda-github-ci.yml`.

## CloudFront

- Serve S3 through its **REST API endpoint + Origin Access Control (OAC)**, not the website
  endpoint.
- The default behaviour alone wasn't enough. I needed a behaviour for `/` pointing at the S3
  origin.
- CloudFront can put a lambda (through its function URL) and S3 behind **one domain**. The
  frontend then calls `/api/...` on its own origin, which avoids CORS.

### POST to a function URL needs a body hash

With OAC, CloudFront signs the request to the lambda (SigV4), and for POST/PUT it can't hash the
body itself. The client must send the SHA-256 of the body in `x-Amz-Content-Sha256`:

```bash
curl --location 'https://<cf-id>.cloudfront.net/api/join' \
  --header 'x-Amz-Content-Sha256: <payload hash>' \
  --header 'Content-Type: application/json' \
  --data '{"code":"XXXX"}'
```

where `<payload hash>` is `createHash("sha256").update('{"code":"XXXX"}').digest("hex")`.

Without the header you get:

```json
{
    "message": "The request signature we calculated does not match the signature you provided. Check your AWS Secret Access Key and signing method. Consult the service documentation for details."
}
```

Ref: [re:Post: Lambda function URL behind CloudFront, InvalidSignatureException only on POST](https://repost.aws/ja/questions/QUbHCI9AfyRdaUPCCo_3XKMQ/lambda-function-url-behind-cloudfront-invalidsignatureexception-only-on-post)

**Now:** `src/apis/use-api.ts` adds this header to every request that has a body.

### CORS preflight

Adding custom headers to a `fetch` makes the browser send a preflight `OPTIONS` request, which was
getting blocked. This only happens for **cross-origin** requests.
**Now:** the frontend calls `/api` on its own origin (CloudFront in production, the webpack
dev-server proxy locally), so custom headers like `fp-client-token` and `x-Amz-Content-Sha256`
don't trigger a preflight.

### Lambda@Edge

1. Have the origin, the path to it and the CloudFront distribution ready first.
2. Create a function from a blueprint, search for "CloudFront", and pick **Modify HTTP response**.
   The blueprint sets up the roles and permissions.
3. Publish a version and attach it to the event (e.g. Viewer Response). The ARN must include the
   version number.

- Edge functions are created in `us-east-1`, but their **logs go to the region that ran them**
  (e.g. `ap-southeast-1`).
- Don't use Edge functions for auth: the region they run in isn't predictable, and they **can't
  have environment variables**.

**Now:** the `auth-edge-*` lambdas are deprecated. Auth runs in the regional lambdas (`withAuth`).

## Cookies

- Setting `Cache-Control: no-cache="Set-Cookie"` or `no-store, no-cache, must-revalidate` on the
  origin response did **not** get the cookie through. I moved cookie setting to a Lambda@Edge
  viewer response ([CloudFront cookie docs](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Cookies.html)).
- Browser error for a bad `Domain`: *"This attempt to set a cookie via Set-Cookie header was
  blocked because its Domain attribute was invalid with regards to the current host url"*. The
  cookie's `Domain` must match the host the browser sees (the CloudFront domain), not the
  function URL.

**Now:** lambdas set the cookie themselves (`ApiResponse.setCookie` in
`battleships-lambda/lib/response/response.ts`). It is a host-only cookie with no `Domain`
attribute (`HttpOnly; Secure; SameSite=Strict` when deployed), and the API behaviours use the
`Managed-CachingDisabled` cache policy with the `Managed-AllViewerExceptHostHeader` origin request
policy.

## API Gateway (not used)

API Gateway in front of the lambda removes the need to hash the payload.

- Create API → REST API → New API. Endpoint: Regional, IP type: IPv4.
- Name the stage after the service, not the environment (dev/stg/prd).
- The event the lambda receives is the whole request, so test events need a `body` key:
  `{ "body": <data-object> }`, not stringified.

I kept CloudFront → function URLs instead. Locally, `sam local start-api` emulates API Gateway.

## Auth design

First idea:

- Generate a key pair outside the app; the public key goes in the frontend, the private key in
  the lambda.
- With no user token, send the request with the public key; the lambda verifies it and creates a
  temporary token.
- Use the temporary token to call the lambda, which checks it and returns a `playerId` and
  `userToken`.
- Store `userToken` in a cookie; one game per `userToken`.

That didn't hold up, because a key shipped in the frontend is public to everyone.

**Now:** DPoP-style proof of possession (RFC 9449). Each browser generates its own non-extractable
RSA key pair (IndexedDB). Login/sign-up binds the `HttpOnly` auth cookie to that key's thumbprint
(`cnf.jkt`), and every request carries a fresh signed proof. Full rationale:
[docs/auth-replay-protection.md](./docs/auth-replay-protection.md).

## TypeScript gotchas

**Prototype methods vs arrow-function fields when a base constructor calls an overridable
method.**

- Prototype methods resolve through the prototype chain at call time. When the `GameState`
  constructor calls `this.toShip`, it correctly calls `FEGameState.prototype.toShip`.
- Arrow-function *instance fields* are assigned **after** `super()` returns. The base constructor
  calls `this.toShip` *inside* `super()`, so the subclass's arrow-function override doesn't exist
  yet and the base version runs.

Rule: methods that a base constructor calls should be prototype methods, not arrow-function fields.

## Problems faced

- **"Cannot find esbuild" during `sam build`.** esbuild was a dev dependency; see
  [Local backend](#local-backend-sam).
- **Lambdas couldn't reach DynamoDB Local.** `localhost` inside a container; fixed with a shared
  Docker network.
- **"Table not found" after restarting Docker.** DynamoDB Local runs `-inMemory`; `npm run db:init`
  recreates the tables.
- **The backend ignored my change.** `sam build` bundles `shared/` into `.aws-sam/build`, so
  backend and `shared/` changes need a rebuild.
- **POST through CloudFront failed with a signature error.** Missing `x-Amz-Content-Sha256`; see
  [CloudFront](#post-to-a-function-url-needs-a-body-hash).
- **Occasional `502`s in e2e tests.** Every API call starts a SAM container, so 4 Playwright
  workers can overload Docker; `--workers=2` helps.
- **Obscured (fog-of-war) game states threw in `toPlain()`.** A `lodash.clonedeep` copy left
  plain objects mixed in with domain entities. Projections have to be rebuilt with
  `new GameState(...)` so every entity is a domain object again.
