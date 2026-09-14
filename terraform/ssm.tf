locals {
  # lambdas that sign or verify auth tokens. They read the secret from Parameter
  # Store at cold start rather than taking it as an env var, so the value never
  # passes through the terraform state file in s3.
  auth_secret_lambdas = [
    for name, lambda in local.workspace_lambdas : name
    if try(lambda.needs_auth_secret, false)
  ]
  create_auth_secret = length(local.auth_secret_lambdas) > 0 ? 1 : 0

  # exported to the readers as an env var; the lambda resolves name -> value itself
  auth_token_secret_name = format("/battleships/%s/auth-token-secret", terraform.workspace)
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

# each reader gets the grant on its own role, so this no longer has to care
# which datastore the function happens to use
resource "aws_iam_role_policy_attachment" "lambda_read_auth_secret" {
  for_each   = toset(local.auth_secret_lambdas)
  role       = aws_iam_role.lambda[each.key].name
  policy_arn = aws_iam_policy.lambda_read_auth_secret[0].arn
}
