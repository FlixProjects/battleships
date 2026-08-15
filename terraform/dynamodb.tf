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
    name            = "id-index"
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

# the role itself is created outside terraform (see data.aws_iam_role.lambda_to_s3
# in lambda.tf); this attaches table access to it
resource "aws_iam_role_policy" "lambda_to_dynamodb" {
  count  = local.create_dynamodb[terraform.workspace] ? 1 : 0
  name   = format("battleships-%s-lambda-to-dynamodb", terraform.workspace)
  role   = data.aws_iam_role.lambda_to_s3.id
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
}
