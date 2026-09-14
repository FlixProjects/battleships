locals {
  region = "ap-southeast-1"

  lambda_functions = {
    prd : [
      { name : "join-game", create : true, cf_path : "/api/join", needs_s3 : true, needs_dynamodb : true, needs_auth_secret : true },
      { name : "get-game", create : true, cf_path : "/api*", needs_s3 : true, needs_auth_secret : true },
      { name : "get-games", create : true, cf_path : "/api/games", needs_dynamodb : true, needs_auth_secret : true },
      # sample: Billed Duration: 986 ms    Memory Size: 1024 MB    Max Memory Used: 131 MB
      { name : "submit-action", create : true, cf_path : "/api/submit", memory_size : 1024, timeout : 10, needs_s3 : true, needs_auth_secret : true },
      { name : "create-game", create : true, cf_path : "/api/create", needs_s3 : true, needs_dynamodb : true, needs_auth_secret : true },
      # scrypt is deliberately CPU-hard and lambda scales CPU with memory, so the
      # 128MB/3s default is the worst possible setting for password hashing
      { name : "sign-up", create : true, cf_path : "/api/sign-up", memory_size : 512, timeout : 10, needs_dynamodb : true, needs_auth_secret : true },
      # verifying a password re-derives the same scrypt hash, so login is priced
      # exactly like sign-up
      { name : "login", create : true, cf_path : "/api/login", memory_size : 512, timeout : 10, needs_dynamodb : true, needs_auth_secret : true },
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