# CloudFront only accepts certificates from us-east-1.
resource "aws_acm_certificate" "site" {
  count             = local.create_cloudfront_distribution[terraform.workspace] ? 1 : 0
  provider          = aws.global
  domain_name       = local.domain_name[terraform.workspace]
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# domain is hosted on Cloudflare, so the validation CNAME is added there by
# hand; this blocks until ACM sees it.
resource "aws_acm_certificate_validation" "site" {
  count           = local.create_cloudfront_distribution[terraform.workspace] ? 1 : 0
  provider        = aws.global
  certificate_arn = aws_acm_certificate.site[0].arn
}

output "acm_validation_records" {
  description = "CNAME to add in Cloudflare (DNS only) to validate the certificate"
  value = [
    for o in one(aws_acm_certificate.site[*].domain_validation_options) : {
      name  = o.resource_record_name
      type  = o.resource_record_type
      value = o.resource_record_value
    }
  ]
}

output "cloudfront_domain_name" {
  description = "CNAME target for the site's subdomain in Cloudflare (proxied)"
  value       = one(aws_cloudfront_distribution.battleships[*].domain_name)
}
