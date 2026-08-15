locals {
  s3_root_origin_id   = "origin"
  s3_public_origin_id = "assets-origin"
  # Path pattern routed to each lambda origin. get-game is the /api/* catch-all
  # and must have the lowest precedence, so it is ordered last below.
  lambda_path_patterns = {
    "submit-action" = { 
      path = "/api/submit"      
    }
    "create-game" = {
      path            = "/api/create"
      viewer-response = "auth-cf-edge-response"
    }
    "join-game" = {
      path            = "/api/join"
      viewer-response = "auth-cf-edge-response"
    }
    "sign-up"  = { 
      path = "/api/sign-up"
      viewer-response = "auth-cf-edge-response"
    }
    "get-game" = { path = "/api*" }
  }

  edge_function_names = toset([
    for name, cfg in local.lambda_path_patterns : lookup(cfg, "viewer-response", null)
    if lookup(cfg, "viewer-response", null) != null
  ])

  lambda_origins = {
    for name, furl in aws_lambda_function_url.battleship_function_url : name => {
      origin_id           = "lambda-${name}-origin"
      domain_name         = trimsuffix(trimprefix(furl.function_url, "https://"), "/")
      path_pattern        = local.lambda_path_patterns[name].path
      viewer_response_arn = try(data.aws_lambda_function.edge_response[local.lambda_path_patterns[name]["viewer-response"]].qualified_arn, null)
    }
  }

  # Ordered cache behaviours: specific /api/* paths first, the /api/* catch-all
  # (get-game) last so exact matches win precedence.
  lambda_behaviors_ordered = concat(
    [for name, o in local.lambda_origins : merge(o, { name = name }) if !strcontains(o.path_pattern, "*")],
    [for name, o in local.lambda_origins : merge(o, { name = name }) if strcontains(o.path_pattern, "*")],
  )
}


resource "aws_cloudfront_distribution" "battleships" {
  count               = local.create_cloudfront_distribution[terraform.workspace] ? 1 : 0
  enabled             = true
  default_root_object = "index.html"
  # ── S3 origin (static site) ──────────────────────────────────────────────
  dynamic "origin" {
    for_each = local.create_s3[terraform.workspace] ? [1] : []

    content {
      origin_id                = local.s3_root_origin_id
      domain_name              = aws_s3_bucket.battleships-s3[0].bucket_regional_domain_name
      origin_access_control_id = aws_cloudfront_origin_access_control.s3[0].id
    }
  }

  dynamic "origin" {
    for_each = local.create_s3[terraform.workspace] ? [1] : []

    content {
      origin_id                = local.s3_public_origin_id
      domain_name              = aws_s3_bucket.battleships-s3[0].bucket_regional_domain_name
      origin_access_control_id = aws_cloudfront_origin_access_control.s3[0].id
      origin_path              = "/public"

    }
  }

  # ── Lambda function-URL origins (one per created lambda) ──────────────────
  dynamic "origin" {
    for_each = local.lambda_origins

    content {
      origin_id                = origin.value.origin_id
      domain_name              = origin.value.domain_name
      origin_access_control_id = aws_cloudfront_origin_access_control.lambda[0].id

      custom_origin_config {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "https-only"
        origin_ssl_protocols   = ["TLSv1.2"]
      }
    }
  }

  # ── API behaviours → lambda origins ───────────────────────────────────────
  dynamic "ordered_cache_behavior" {
    for_each = local.lambda_behaviors_ordered

    content {
      path_pattern             = ordered_cache_behavior.value.path_pattern
      target_origin_id         = ordered_cache_behavior.value.origin_id
      allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
      cached_methods           = ["GET", "HEAD"]
      viewer_protocol_policy   = "redirect-to-https"
      cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
      origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id

      # Attach a Lambda@Edge viewer-response only for lambdas listed in
      # local.lambda_viewer_response_arns; others emit zero associations.
      dynamic "lambda_function_association" {
        for_each = ordered_cache_behavior.value.viewer_response_arn == null ? [] : [ordered_cache_behavior.value.viewer_response_arn]

        content {
          event_type   = "viewer-response"
          lambda_arn   = lambda_function_association.value
          include_body = false
        }
      }
    }
  }

  ordered_cache_behavior {
    path_pattern = "/favicon.ico"
    target_origin_id       = local.s3_public_origin_id
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    viewer_protocol_policy = "https-only"
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id
  }

  # ── Default behaviour → S3 static site ────────────────────────────────────
  default_cache_behavior {
    target_origin_id       = local.s3_public_origin_id
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["SG"]
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

resource "aws_cloudfront_origin_access_control" "s3" {
  count                             = local.create_cloudfront_distribution[terraform.workspace] ? 1 : 0
  name                              = format("battleships-%s-s3-oac", terraform.workspace)
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_origin_access_control" "lambda" {
  count                             = local.create_cloudfront_distribution[terraform.workspace] ? 1 : 0
  name                              = format("battleships-%s-lambda-oac", terraform.workspace)
  origin_access_control_origin_type = "lambda"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

data "aws_lambda_function" "edge_response" {
  for_each      = local.edge_function_names
  provider      = aws.global
  function_name = each.value
}

# Managed policies (referenced by name to avoid hard-coding AWS ids).
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}
