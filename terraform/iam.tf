locals {
  # every lambda built for this workspace gets its own execution role, so grants
  # compose per function instead of forcing a single-datastore choice on each one
  workspace_lambdas = {
    for lambda in try(local.lambda_functions[terraform.workspace], []) : lambda.name => lambda
    if lambda.create
  }
  create_lambda_logs_policy = length(local.workspace_lambdas) > 0 ? 1 : 0
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

resource "aws_iam_role" "lambda" {
  for_each           = local.workspace_lambdas
  name               = format("battleships-lambda-%s-%s", terraform.workspace, each.key)
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

data "aws_iam_policy_document" "lambda_logs" {
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
      for name in keys(local.workspace_lambdas) :
      format(
        "arn:aws:logs:%s:%s:log-group:/aws/lambda/%s:*",
        local.region,
        data.aws_caller_identity.current.account_id,
        name,
      )
    ]
  }
}

resource "aws_iam_policy" "lambda_logs" {
  count  = local.create_lambda_logs_policy
  name   = format("battleships-%s-lambda-logs", terraform.workspace)
  policy = data.aws_iam_policy_document.lambda_logs.json
}

# every function logs; the datastore grants below are opt-in per function flag
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  for_each   = local.workspace_lambdas
  role       = aws_iam_role.lambda[each.key].name
  policy_arn = aws_iam_policy.lambda_logs[0].arn
}

resource "aws_iam_role_policy_attachment" "lambda_to_dynamodb" {
  for_each   = toset(local.dynamodb_lambdas)
  role       = aws_iam_role.lambda[each.key].name
  policy_arn = aws_iam_policy.lambda_to_dynamodb[0].arn
}

resource "aws_iam_role_policy_attachment" "lambda_to_s3" {
  for_each   = toset(local.s3_lambdas)
  role       = aws_iam_role.lambda[each.key].name
  policy_arn = aws_iam_policy.lambda_to_s3[0].arn
}
