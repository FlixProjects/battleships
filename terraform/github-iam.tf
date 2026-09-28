resource "aws_iam_role" "github_ci_agent" {
  count              = local.github_ci_agent[terraform.workspace] ? 1 : 0
  name               = format("battleships-%s-github-ci-agent", terraform.workspace)
  assume_role_policy = data.aws_iam_policy_document.github_ci_agent_assume_role.json
}

data "aws_iam_policy_document" "github_ci_agent_assume_role" {
  statement {
    sid    = "AllowAgentAssumeRole"
    effect = "Allow"

    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [format("arn:aws:iam::%s:oidc-provider/token.actions.githubusercontent.com", data.aws_caller_identity.current.account_id)]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:FlixProjects/battleships:ref:refs/heads/main",
        format("repo:FlixProjects/battleships:environment:%s-deploy", terraform.workspace)
      ]
    }
  }
}


resource "aws_iam_policy" "github_ci_agent" {
  count  = local.github_ci_agent[terraform.workspace] ? 1 : 0
  name   = format("battleships-%s-github-ci-agent", terraform.workspace)
  policy = data.aws_iam_policy_document.github_ci_agent.json
}

resource "aws_iam_role_policy_attachment" "github_ci_agent" {
  count      = local.github_ci_agent[terraform.workspace] ? 1 : 0
  role       = aws_iam_role.github_ci_agent[0].name
  policy_arn = aws_iam_policy.github_ci_agent[0].arn
}

data "aws_iam_policy_document" "github_ci_agent" {
  statement {
    sid     = "AllowS3Put"
    effect  = "Allow"
    actions = ["s3:PutObject"]

    resources = [format("%s/*", aws_s3_bucket.battleships-s3[0].arn)]
  }

  statement {
    sid       = "PassRole"
    effect    = "Allow"
    actions   = ["iam:PassRole"]
    resources = [aws_cloudfront_distribution.battleships[0].arn]
  }

  statement {
    sid    = "AllowUpdateLambda"
    effect = "Allow"

    actions = [
      "lambda:GetFunctionConfiguration",
      "lambda:CreateFunction",
      "lambda:UpdateFunctionConfiguration",
      "lambda:UpdateFunctionCode",
      "lambda:PublishVersion"
    ]

    resources = values(aws_lambda_function.battleship_lambda)[*].arn
  }

  statement {
    sid     = "InvalidateCF"
    effect  = "Allow"
    actions = ["cloudfront:CreateInvalidation"]

    resources = [aws_cloudfront_distribution.battleships[0].arn]
  }
}