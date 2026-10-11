# Battleships - Setup Guide

Every command block says where to run it from:

- **repo root**: the directory containing `package.json`, `webpack.config.js` and `playwright.config.ts`
- **`battleships-lambda/`**: the backend package
- **`terraform/`**: infrastructure

## Prerequisites

| Tool | Version | Used for |
| --- | --- | --- |
| Node.js / npm | Node >= 22, npm >= 10 (`engines` in `package.json`) | frontend, lambdas, tests |
| Docker | Docker Desktop, or Docker Engine inside WSL | SAM lambda containers, DynamoDB Local |
| AWS SAM CLI | tested with 1.144 | local API ([install](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)) |
| `zip` | any | packaging lambdas for deployment (`scripts/build.sh`) |
| AWS CLI v2 | any | deployment only ([install](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)) |
| tfswitch | any | deployment only; installs the pinned Terraform 1.15.8 |
| Git | any | |

## First-time setup

### 1. Clone

```bash
git clone git@github.com:FlixProjects/battleships.git
cd battleships
```

### 2. Install dependencies

Run from: **repo root**

```bash
npm ci
```

Run from: **`battleships-lambda/`**

```bash
npm ci
```

### 3. Create `.env`

Run from: **repo root**. `.env` is not committed.

```bash
DEPLOY_ENV=local
BASE_API_URL=http://localhost:3000/api
```

The frontend reads these at build time through `dotenv-webpack`:

| Variable | Required | Meaning |
| --- | --- | --- |
| `DEPLOY_ENV` | yes | `local` switches the app to local mode: game state lives in the tab's sessionStorage instead of S3, and the Switch Player control is shown for hot-seat testing |
| `BASE_API_URL` | yes | backend base URL |
| `AWS_REGION` | no | defaults to `ap-southeast-1` |

The local lambdas do **not** read `.env`. Their environment comes from the `Environment` blocks in
`battleships-lambda/template.yaml`, and locally the auth-token secret falls back to `test-secret`
(`battleships-lambda/lib/auth-secret.ts`).

### 4. Install the Playwright browser (for e2e tests)

Run from: **repo root**

```bash
npx playwright install --with-deps chromium
```

## Running locally

Local development needs three things running: Docker, the backend on `:3000` and the frontend on
`:8080`.

| Service | URL |
| --- | --- |
| Frontend (webpack dev server) | http://localhost:8080 |
| Backend (SAM local API) | http://127.0.0.1:3000 |
| DynamoDB Local | http://localhost:8000 |
| DynamoDB admin UI | http://localhost:8001 |

### 1. Start Docker

Make sure the Docker daemon is running before starting the backend.

### 2. Start the backend (SAM + DynamoDB)

Run from: **`battleships-lambda/`**

```bash
npm run start
```

This runs, in order:

1. `npm run db:up`: starts DynamoDB Local and dynamodb-admin (`docker-compose.yml`)
2. `npm run db:init`: creates any missing tables
3. `npm run start:api`: `sam build`, then `sam local start-api` on `:3000`, attached to the
   `battleships-local` docker network

The individual scripts are also useful on their own. Run them from **`battleships-lambda/`**:

```bash
npm run db:up      # containers only
npm run db:init    # (re)create tables; needed after every db:up because tables are in-memory
npm run db:down    # stop and remove the containers
npm run start:api  # sam build + start-api; assumes DynamoDB is already up
```

**Backend code changes are not hot-reloaded.** `sam build` bundles each lambda with the `shared/`
code it imports into `battleships-lambda/.aws-sam/build`. After changing `battleships-lambda/` or
`shared/`, rebuild from **`battleships-lambda/`**:

```bash
sam build
```

Restart `npm run start` only if you change `template.yaml`, for example to add a function or a route.
The frontend picks up `shared/` changes immediately, so until you rebuild, the frontend and the
backend run different versions of `shared/`.

### 3. Start the frontend

Run from: **repo root**, in a separate terminal

```bash
npm run dev
```

The webpack dev server serves http://localhost:8080 and proxies `/api` to `localhost:3000`.

## Tests

### Unit tests (Jest)

Run from: **repo root**

```bash
npm test                                   # everything
npx jest shared/models/__tests__/GameStateManager.spec.ts   # a single file
```

### End-to-end tests (Playwright)

Run from: **repo root**. Docker must be running.

```bash
npm run test:e2e         # headless
npm run test:e2e:ui      # Playwright UI mode
npx playwright test e2e/game.spec.ts --workers=2   # one file, fewer parallel browsers
```

- **Servers start automatically if needed.** `playwright.config.ts` starts the backend (`npm --prefix battleships-lambda run start`) and the frontend (`npm run dev`) when nothing is answering on
  their URLs. A cold start can take a few minutes.
- **Running servers are reused, not restarted** (`reuseExistingServer: true`). After changing the
  backend or `shared/`, run `sam build` from **`battleships-lambda/`** before trusting a result.
- **The VS Code Playwright extension can start these servers too.** They stay up after tests finish,
  which is why the backend may already be running when you didn't start it. They stop when the
  extension's test server stops. DynamoDB keeps running until `npm run db:down`.
- **Occasional `502` responses under load.** Each API call starts a new SAM container, so running
  4 workers can overload Docker. If a test fails with a `502` it didn't cause, run with
  `--workers=2`.
- **Local mode runs both players in one tab.** With `DEPLOY_ENV=local` the game lives in the tab's
  sessionStorage, and the tests switch players with the Switch Player control
  (see `e2e/helpers/PageHelper.ts`).

## Local DynamoDB

`battleships-lambda/docker-compose.yml` runs DynamoDB Local plus a browser UI:

| Service | URL | Notes |
| --- | --- | --- |
| `dynamodb-local` | http://localhost:8000 | `-inMemory -sharedDb` |
| `dynamodb-admin` | http://localhost:8001 | table browser |

Two things make this work, and both are easy to break:

- **`--docker-network battleships-local`.** SAM runs each lambda in its own container, so
  `localhost:8000` inside a lambda is *not* the port published on your host. Both sides join the
  `battleships-local` network instead, and the lambdas address DynamoDB as
  `http://dynamodb-local:8000` (`DYNAMODB_ENDPOINT` in `template.yaml`). `npm run start:api` passes
  the flag for you.
- **`-inMemory` means tables disappear with the container.** `npm run db:init` recreates them. It is
  idempotent, and `npm run start` runs it on every boot. To keep data across restarts, replace
  `-inMemory` with `-dbPath ./data` in the compose `command` and uncomment the `volumes` /
  `working_dir` lines. `-dbPath` and `-inMemory` cannot be used together.

Tables (defined in `battleships-lambda/scripts/create-tables.mjs`, mirrored in `terraform/dynamodb.tf`):

| Table | Keys | Notes |
| --- | --- | --- |
| `battleships-users` | partition `username` (lowercased) | GSI `id-index` on `id`; stores the salted scrypt password hash |
| `battleships-games` | partition `userId`, sort `gameCode` | which games a user belongs to (the lobby list) |

The shared document client is `battleships-lambda/lib/dynamo.ts`. It points at the local endpoint
and injects dummy credentials only when `DEPLOY_ENV=local`, so deployed lambdas use the real
service and their IAM role as usual.

## Troubleshooting

- **`sam build` fails with "Cannot find esbuild".** Every function uses `CodeUri: ../`, so SAM
  copies the repo root and runs a *production* `npm install` there before bundling. That is why the
  root `package.json` lists `esbuild` under `dependencies`, not `devDependencies`. Keep it there.
- **Lambdas can't reach DynamoDB.** Check that `dynamodb-local` is running and that SAM was started
  with `--docker-network battleships-local`.
- **"Table not found" after restarting Docker.** Tables are in-memory. Run `npm run db:init` from
  **`battleships-lambda/`**.
- **The backend ignores your change.** Run `sam build` from **`battleships-lambda/`**.

## Deploying to AWS

Deployment is managed by Terraform with a single workspace, `prd`. Region is `ap-southeast-1`,
except for the CloudFront-related `global` provider in `us-east-1`.

### 1. AWS account structure (one-off)

1. Create the root account. It acts as the **management account** of an AWS Organization and is
   used only for billing and account management.
2. Create a separate member account in the Organization and give it administrator rights. Use it to
   run IAM Identity Center (IdC), so day-to-day work doesn't need the root account.
3. In IdC:
    1. Create a user and add it to a group.
    2. Create a permission set with the permissions the user needs.
    3. Assign the group to the target account with that permission set.
    4. Save the AWS access portal **start URL** (`https://<id>.awsapps.com/start/`).

### 2. Install the deployment tools

Run from: **anywhere**

```bash
# AWS CLI v2: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
curl -L https://raw.githubusercontent.com/warrensbox/terraform-switcher/master/install.sh | bash
```

Then, from **`terraform/`**, run `tfswitch`. It reads `required_version` (1.15.8) from `_setup.tf`
and installs that Terraform version.

### 3. Log in with SSO

Run from: **anywhere**

```bash
aws configure sso            # once: enter the start URL and pick the account and role; creates a profile
aws sso login --profile <profile>
export AWS_PROFILE=<profile> # the profile should be exported from where you intend to run terraform commands
```

SSO credentials are short-lived. When they expire, run `aws sso login` again.

### 4. Create the Terraform state bucket (one-off)

Create an S3 bucket for Terraform state manually, in the console or with the AWS CLI. It can be a
global or a regional bucket. For a regional bucket, include its suffix in the `bucket` value of
`terraform/.p.conf`.

`terraform/.p.conf` is the backend config for `prd`. It holds `bucket` and `key`, and is committed.

### 5. Build what Terraform uploads

Terraform deploys the lambda zips from `battleships-lambda/dist/`, so build them first.

Run from: **`battleships-lambda/`**

```bash
npm run build     # esbuild bundle + zip -> dist/<function>.zip
```

### 6. Apply

Run from: **`terraform/`**

```bash
terraform init -backend-config=.p.conf
terraform workspace select -or-create prd
terraform plan
terraform apply
```

This creates the lambdas with their function URLs and IAM roles, the S3 bucket, the CloudFront
distribution, the DynamoDB tables, the SSM auth-secret parameter and the GitHub CI role.

The site is served from `battleships.<domain>` (`local.domain_name` in `main.tf`). The domain's DNS
is on Cloudflare, not Route 53, so its two records are added by hand:

1. `terraform apply -target=aws_acm_certificate.site`, then add the CNAME from the
   `acm_validation_records` output as **DNS only** (grey cloud). The full `terraform apply` waits on
   this record until ACM issues the certificate.
2. After the full apply, point a `battleships` CNAME at the `cloudfront_domain_name` output,
   **proxied** (orange cloud).

Because Cloudflare proxies the site, CloudFront only ever sees Cloudflare's servers. That is why the
distribution has no geo restriction (country rules go in Cloudflare) and why Cloudflare needs a cache
rule that bypasses its cache for this hostname — otherwise a deploy stays stale behind it, since the
workflows only invalidate CloudFront. Cloudflare's SSL/TLS mode must be **Full (strict)**.

### 7. Manual steps after the first apply

1. **Set the auth-token secret.** Terraform creates the SSM parameter with a placeholder value and
   ignores later changes to it, so the secret never goes through Terraform state. Run from
   **anywhere**:

    ```bash
    aws ssm put-parameter --overwrite --type SecureString \
      --name /battleships/prd/auth-token-secret \
      --value "$(openssl rand -base64 48 | tr '+/' '-_' | tr -d '=')"
    ```

2. **Create the GitHub OIDC provider** (once per AWS account). The CI role trusts
   `token.actions.githubusercontent.com`, but Terraform doesn't create that provider. Run from
   **anywhere**:

    ```bash
    aws iam create-open-id-connect-provider \
      --url https://token.actions.githubusercontent.com \
      --client-id-list sts.amazonaws.com
    ```

## CI/CD (GitHub Actions)

Two workflows in `.github/workflows/` run on every push to `main`. There is no test job, so run
`npm test` and `npm run test:e2e` before pushing.

| Workflow | What it does |
| --- | --- |
| `.s3-github-ci.yml` | `npm run build`, copies `public/` to the `battleships-prd` bucket, invalidates `/index.html`, `/bundle.js` and `/styles.css` |
| `.lambda-github-ci.yml` | `npm run build` in `battleships-lambda/`, updates the code of each existing `battleships-<DEPLOY_ENV>-<function>` lambda, invalidates `/api*` |

The lambda workflow should only be used to update code as the Terraform setup creates the functions but it is also possible to create via the action.

Both jobs run in the `prd-deploy` environment and authenticate through OIDC by assuming
`battleships-prd-github-ci-agent`. That role trusts only the `main` branch and the `prd-deploy`
environment of `FlixProjects/battleships`, and it needs the OIDC provider from step 7. In the repo
settings, create the `prd-deploy` environment and add:

| Name | Kind | Value |
| --- | --- | --- |
| `IAMROLE_GITHUB` | secret | ARN of `battleships-prd-github-ci-agent` (IAM console) |
| `CLOUDFRONT_DISTRIBUTION_ID` | secret | ID of the CloudFront distribution |
| `BASE_API_URL` | secret | the deployed API URL, `https://battleships.<domain>/api` |
| `DEPLOY_ENV` | secret and variable | the deployed environment name (not `local`) |

## TypeScript configuration decisions

### `moduleResolution: "bundler"` (not `"node16"`)

`node16` resolution is designed for the native Node.js runtime. It enforces strict `exports` map
checking and requires explicit file extensions in ESM imports. This project uses webpack as its
bundler, not Node.js module resolution at runtime. `bundler` (available since TS 5.0) is the
option built for this case: it respects `exports` fields without the strict Node.js ESM
requirements, and allows extensionless imports the way bundlers expect.

### `module: "ESNext"` (not `"node20"`)

`module: "node20"` implies Node.js 20 ESM semantics and is only valid with `moduleResolution:
"node16"` or `"node20"`. Since we use `moduleResolution: "bundler"`, the compatible pairing is
`module: "ESNext"`. TypeScript's `module` setting mainly affects what syntax the type checker
allows; webpack's `ts-loader` handles the actual bundling.

### `skipLibCheck: true`

The `.d.ts` files of `@sinclair/typebox` (v0.34, a Jest transitive dependency) and `uuid` (v13)
import internal subpaths that aren't listed in their `exports` maps. Both `node16` and `bundler`
resolution check the exports map for package imports, so these files produce errors we can't fix
in our code. `skipLibCheck: true` is the standard answer for bundler projects (it's on by default
in CRA and Vite templates). It skips type-checking `.d.ts` files in `node_modules` without
affecting type-checking of our own source.
