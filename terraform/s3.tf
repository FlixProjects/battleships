locals {
  s3_lambdas = try(local.create_s3[terraform.workspace], false) ? [
    for lambda in try(local.lambda_functions[terraform.workspace], []) : lambda.name
    if lambda.create && !try(lambda.needs_dynamodb, false)
  ] : []
  create_lambda_to_s3_role = length(local.s3_lambdas) > 0 ? 1 : 0
}

resource "aws_s3_bucket" "battleships-s3" {
  count  = local.create_s3[terraform.workspace] ? 1 : 0
  bucket = format("battleships-%s", terraform.workspace)
}

resource "aws_s3_bucket_policy" "battleships-s3-policy" {
  count  = local.create_s3[terraform.workspace] ? 1 : 0
  bucket = aws_s3_bucket.battleships-s3[0].bucket
  policy = data.aws_iam_policy_document.origin_bucket_policy.json
}

data "aws_iam_policy_document" "origin_bucket_policy" {
  statement {
    sid    = "AllowCloudFrontServicePrincipalReadWrite"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ]

    resources = [
      "${aws_s3_bucket.battleships-s3[0].arn}/*",
    ]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.battleships[0].arn]
    }
  }
}

resource "aws_iam_role" "lambda_to_s3" {
  count              = local.create_lambda_to_s3_role
  name               = format("battleships-%s-lambda-to-s3", terraform.workspace)
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy" "lambda_to_s3" {
  count  = local.create_lambda_to_s3_role
  name   = format("battleships-%s-lambda-to-s3", terraform.workspace)
  role   = aws_iam_role.lambda_to_s3[0].id
  policy = data.aws_iam_policy_document.lambda_to_s3.json
}

data "aws_iam_policy_document" "lambda_to_s3" {
  statement {
    sid    = "AllowGameObjectAccess"
    effect = "Allow"

    # the handlers only Get/Put a single game object by key, so there is no
    # s3:ListBucket (a bucket-level action) and no s3:DeleteObject
    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ]

    resources = [format("%s/*", aws_s3_bucket.battleships-s3[0].arn)]
  }
}

