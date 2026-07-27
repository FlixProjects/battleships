provider "aws" {
  region = "ap-southeast-1"
}

provider "aws" {
  alias  = "global"
  region = "us-east-1"
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.54.0"
    }
  }

  backend "s3" {
    region = "ap-southeast-1"
  }

  required_version = "1.15.8"
}

data "aws_caller_identity" "current" {}