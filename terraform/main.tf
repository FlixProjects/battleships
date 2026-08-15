locals {
  lambda_functions = {
    prd : [
      { name : "join-game", create : true, },
      { name : "get-game", create : true },
      # sample: Billed Duration: 986 ms    Memory Size: 1024 MB    Max Memory Used: 131 MB
      { name : "submit-action", create : true, memory_size: 1024, timeout: 10 },
      { name : "create-game", create : true },
      { name : "sign-up", create : false },
  ] }
  create_s3 = {
    prd : true,
  }
  create_cloudfront_distribution = {
    prd : true,
  }
  create_dynamodb = {
    prd : true,
  }
}