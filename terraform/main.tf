locals {
  lambda_functions = {
    prd : [
      { name : "join-game", create : true, },
      { name : "get-game", create : true },
      # sample: Billed Duration: 986 ms    Memory Size: 1024 MB    Max Memory Used: 131 MB
      { name : "submit-action", create : true, memory_size : 1024, timeout : 10 },
      { name : "create-game", create : true },
      # scrypt is deliberately CPU-hard and lambda scales CPU with memory, so the
      # 128MB/3s default is the worst possible setting for password hashing
      { name : "sign-up", create : true, memory_size : 512, timeout : 10, needs_dynamodb : true },
    ] 
  }

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