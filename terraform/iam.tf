locals {
  # every lambda built for this workspace gets its own log group, and both
  # execution roles need the same grant, so the logging policy is shared
  logging_lambdas = [
    for lambda in try(local.lambda_functions[terraform.workspace], []) : lambda.name
    if lambda.create
  ]
  create_lambda_logs_policy = length(local.logging_lambdas) > 0 ? 1 : 0
}

# shared by lambda_to_s3 and lambda_to_dynamodb; the edge functions assume
# data.aws_iam_role.auth_cf_edge instead and are not covered here
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
      for name in local.logging_lambdas :
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

resource "aws_iam_role_policy_attachment" "lambda_to_s3_logs" {
  count      = local.create_lambda_to_s3_role
  role       = aws_iam_role.lambda_to_s3[0].name
  policy_arn = aws_iam_policy.lambda_logs[0].arn
}

resource "aws_iam_role_policy_attachment" "lambda_to_dynamodb_logs" {
  count      = local.create_lambda_to_dynamodb_role
  role       = aws_iam_role.lambda_to_dynamodb[0].name
  policy_arn = aws_iam_policy.lambda_logs[0].arn
}
