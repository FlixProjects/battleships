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

