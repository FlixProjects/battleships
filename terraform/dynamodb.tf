
locals {
  dynamodb_lambdas = try(local.create_dynamodb[terraform.workspace], false) ? [
    for lambda in try(local.lambda_functions[terraform.workspace], []) : lambda.name
    if try(lambda.needs_dynamodb, false)
  ] : []
  create_lambda_to_dynamodb_role = length(local.dynamodb_lambdas) > 0 ? 1 : 0
}
resource "aws_dynamodb_table" "users" {
  count        = local.create_dynamodb[terraform.workspace] ? 1 : 0
  name         = format("battleships-%s-users", terraform.workspace)
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "username"
  region       = "ap-southeast-1"

  # only key and index attributes are declared; everything else (password,
  # publicJwk, createdAt) is schemaless
  attribute {
    name = "username"
    type = "S"
  }

  attribute {
    name = "id"
    type = "S"
  }

  # gameplay addresses players by id so the username is never put on the wire.
  # eventually consistent, so never read this immediately after the sign-up put.
  global_secondary_index {
    name = "id-index"
    key_schema {
      attribute_name = "id"
      key_type       = "HASH"
    }
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  # accounts are not reconstructible from anywhere else
  deletion_protection_enabled = true
}

resource "aws_iam_role" "lambda_to_dynamodb" {
  count              = local.create_lambda_to_dynamodb_role
  name               = format("battleships-%s-lambda-to-dynamodb", terraform.workspace)
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

# the role itself is created outside terraform (see data.aws_iam_role.lambda_to_s3
# in lambda.tf); this attaches table access to it
resource "aws_iam_role_policy" "lambda_to_dynamodb" {
  count  = local.create_lambda_to_dynamodb_role
  name   = format("battleships-%s-lambda-to-dynamodb", terraform.workspace)
  role   = aws_iam_role.lambda_to_dynamodb[0].id
  policy = data.aws_iam_policy_document.lambda_to_dynamodb.json
}

data "aws_iam_policy_document" "lambda_to_dynamodb" {
  statement {
    sid    = "AllowUserTableAccess"
    effect = "Allow"

    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
    ]

    # no Scan and no DeleteItem: nothing in the app enumerates or removes users
    resources = [
      aws_dynamodb_table.users[0].arn,
      format("%s/index/*", aws_dynamodb_table.users[0].arn),
    ]
  }

  statement {
    sid    = "AllowCreateLogGroup"
    effect = "Allow"

    actions   = ["logs:CreateLogGroup"]
    resources = [format("arn:aws:logs:%s:%s:*", local.region, data.aws_caller_identity.current.account_id)]
  }

  # scoped to the log groups declared in lambda.tf (logging_config.log_group),
  # which are keyed on the bare function name, not the battleships-<ws>- prefixed one
  statement {
    sid    = "AllowWriteLambdaLogs"
    effect = "Allow"

    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]

    resources = [
      for name in local.dynamodb_lambdas :
      format(
        "arn:aws:logs:%s:%s:log-group:/aws/lambda/%s:*",
        local.region,
        data.aws_caller_identity.current.account_id,
        name,
      )
    ]
  }
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    sid    = "AllowLambdaAssumeRole"
    effect = "Allow"

    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}
