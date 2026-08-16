resource "aws_lambda_function" "battleship_lambda" {
  for_each      = { for lambda in local.lambda_functions[terraform.workspace] : lambda.name => lambda if lambda.create }
  function_name = format("battleships-%s-%s", terraform.workspace, each.value.name)
  filename      = format("${path.module}/../battleships-lambda/dist/%s.zip", each.value.name)
  role          = contains(local.dynamodb_lambdas, each.value.name) ? aws_iam_role.lambda_to_dynamodb[0].arn : data.aws_iam_role.lambda_to_s3.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  architectures = ["x86_64"]

  ephemeral_storage {
    size = 512
  }

  memory_size = coalesce(try(each.value.memory_size, null), 128)
  timeout     = coalesce(try(each.value.timeout, null), 3)

  logging_config {
    log_format = "Text"
    log_group  = format("/aws/lambda/%s", each.value.name)
  }
  tracing_config {
    mode = "PassThrough"
  }
  environment {
    variables = merge(
      { "GAMES_BUCKET" = aws_s3_bucket.battleships-s3[0].id },
      try(each.value.needs_dynamodb, false) ? {
        "USERS_TABLE" = one(aws_dynamodb_table.users[*].name)
      } : {},
    )
  }
}

resource "aws_lambda_permission" "allow_cf_invoke_function" {
  for_each      = { for lambda in local.lambda_functions[terraform.workspace] : lambda.name => lambda if lambda.create && local.create_cloudfront_distribution[terraform.workspace] }
  statement_id  = "AllowInvokeFunctionFromCloudfront"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.battleship_lambda[each.value.name].function_name
  principal     = "cloudfront.amazonaws.com"
  source_arn    = aws_cloudfront_distribution.battleships[0].arn
}

resource "aws_lambda_permission" "allow_cf_invoke_function_url" {
  for_each      = { for lambda in local.lambda_functions[terraform.workspace] : lambda.name => lambda if lambda.create && local.create_cloudfront_distribution[terraform.workspace] }
  statement_id  = "AllowInvokeFunctionUrlFromCloudfront"
  action        = "lambda:InvokeFunctionUrl"
  function_name = aws_lambda_function.battleship_lambda[each.value.name].function_name
  principal     = "cloudfront.amazonaws.com"
  source_arn    = aws_cloudfront_distribution.battleships[0].arn
}

resource "aws_lambda_function_url" "battleship_function_url" {
  for_each           = { for lambda in local.lambda_functions[terraform.workspace] : lambda.name => lambda if lambda.create }
  function_name      = aws_lambda_function.battleship_lambda[each.value.name].function_name
  authorization_type = "AWS_IAM"
  invoke_mode        = "BUFFERED"
}

data "aws_iam_role" "lambda_to_s3" {
  name = "lambda-to-s3"
}