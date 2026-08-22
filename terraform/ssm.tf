locals {
  # lambdas that sign or verify auth tokens. They read the secret from Parameter
  # Store at cold start rather than taking it as an env var, so the value never
  # passes through the terraform state file in s3.
  auth_secret_lambdas = [
    for lambda in try(local.lambda_functions[terraform.workspace], []) : lambda.name
    if lambda.create && try(lambda.needs_auth_secret, false)
  ]
  create_auth_secret = length(local.auth_secret_lambdas) > 0 ? 1 : 0

  # exported to the readers as an env var; the lambda resolves name -> value itself
  auth_token_secret_name = format("/battleships/%s/auth-token-secret", terraform.workspace)

  # the grant has to land on whichever execution role lambda.tf picked for each
  # reader, so derive both rather than assuming every reader is a dynamodb one
  auth_secret_on_dynamodb_role = length([
    for name in local.auth_secret_lambdas : name if contains(local.dynamodb_lambdas, name)
  ]) > 0 ? 1 : 0

  auth_secret_on_s3_role = length([
    for name in local.auth_secret_lambdas : name if !contains(local.dynamodb_lambdas, name)
  ]) > 0 ? 1 : 0
}


resource "aws_ssm_parameter" "auth_token_secret" {
  count       = local.create_auth_secret
  name        = local.auth_token_secret_name
  description = "base64url secret used to sign and verify fp-auth-token"
  type        = "SecureString"
  # Standard is free and caps at 4KB
  tier  = "Standard"
  value = "REPLACE_ME_VIA_PUT_PARAMETER" # later replaced manually so secret is opaque

  lifecycle {
    ignore_changes = [value]
  }
}

# key_id is left unset on the parameter above, so it encrypts under this one
data "aws_kms_alias" "ssm" {
  name = "alias/aws/ssm"
}

data "aws_iam_policy_document" "lambda_read_auth_secret" {
  statement {
    sid    = "AllowReadAuthTokenSecret"
    effect = "Allow"

    # GetParameters as well as GetParameter: the sdk's getParameters batch call is
    # what most helpers reach for, and the two are separate actions
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
    ]

    resources = aws_ssm_parameter.auth_token_secret[*].arn
  }

  # redundant while the parameter sits on the aws/ssm managed key, whose own key
  # policy already lets account principals decrypt through ssm -- but required the
  # moment this moves to a customer-managed key, and harmless until then
  statement {
    sid    = "AllowDecryptAuthTokenSecret"
    effect = "Allow"

    actions   = ["kms:Decrypt"]
    resources = [data.aws_kms_alias.ssm.target_key_arn]

    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = [format("ssm.%s.amazonaws.com", local.region)]
    }
  }
}

resource "aws_iam_policy" "lambda_read_auth_secret" {
  count  = local.create_auth_secret
  name   = format("battleships-%s-lambda-read-auth-secret", terraform.workspace)
  policy = data.aws_iam_policy_document.lambda_read_auth_secret.json
}

# attaches policy to read secret from Parameter Store to lambda_to_dynamodb role
resource "aws_iam_role_policy_attachment" "lambda_to_dynamodb_auth_secret" {
  count      = local.auth_secret_on_dynamodb_role
  role       = aws_iam_role.lambda_to_dynamodb[0].name
  policy_arn = aws_iam_policy.lambda_read_auth_secret[0].arn
}

resource "aws_iam_role_policy_attachment" "lambda_to_s3_auth_secret" {
  count      = local.auth_secret_on_s3_role
  role       = aws_iam_role.lambda_to_s3[0].name
  policy_arn = aws_iam_policy.lambda_read_auth_secret[0].arn
}
