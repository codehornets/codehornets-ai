#!/bin/bash
# Create Terraform Backend Resources (S3 + DynamoDB)
# Company: Codehornets
# Usage: ./create-backend.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
AWS_PROFILE="codehornets"
AWS_REGION="ca-central-1"
S3_BUCKET="codehornets-terraform-state"
DYNAMODB_TABLE="codehornets-terraform-locks"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Codehornets Terraform Backend Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Verify AWS credentials
echo -e "${YELLOW}Verifying AWS credentials...${NC}"
if ! aws sts get-caller-identity --profile "$AWS_PROFILE" &> /dev/null; then
    echo -e "${RED}ERROR: AWS profile '$AWS_PROFILE' not configured or invalid credentials${NC}"
    echo ""
    echo "Please run: aws configure --profile $AWS_PROFILE"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --profile "$AWS_PROFILE" --query Account --output text)
echo -e "${GREEN}✓ Connected to AWS Account: $ACCOUNT_ID${NC}"
echo ""

# Check if S3 bucket already exists
echo -e "${YELLOW}Checking S3 bucket...${NC}"
if aws s3 ls "s3://$S3_BUCKET" --profile "$AWS_PROFILE" &> /dev/null; then
    echo -e "${YELLOW}⚠ S3 bucket '$S3_BUCKET' already exists${NC}"
else
    echo -e "${YELLOW}Creating S3 bucket '$S3_BUCKET'...${NC}"

    aws s3api create-bucket \
        --bucket "$S3_BUCKET" \
        --region "$AWS_REGION" \
        --create-bucket-configuration LocationConstraint="$AWS_REGION" \
        --profile "$AWS_PROFILE"

    echo -e "${GREEN}✓ S3 bucket created${NC}"
fi

# Enable versioning
echo -e "${YELLOW}Enabling versioning...${NC}"
aws s3api put-bucket-versioning \
    --bucket "$S3_BUCKET" \
    --versioning-configuration Status=Enabled \
    --profile "$AWS_PROFILE"
echo -e "${GREEN}✓ Versioning enabled${NC}"

# Enable encryption
echo -e "${YELLOW}Enabling encryption...${NC}"
aws s3api put-bucket-encryption \
    --bucket "$S3_BUCKET" \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            }
        }]
    }' \
    --profile "$AWS_PROFILE"
echo -e "${GREEN}✓ Encryption enabled${NC}"

# Block public access
echo -e "${YELLOW}Blocking public access...${NC}"
aws s3api put-public-access-block \
    --bucket "$S3_BUCKET" \
    --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
    --profile "$AWS_PROFILE"
echo -e "${GREEN}✓ Public access blocked${NC}"

# Add bucket policy for secure access
echo -e "${YELLOW}Adding bucket policy...${NC}"

# Create policy inline to avoid file path issues on Windows
BUCKET_POLICY=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "DenyInsecureTransport",
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::${S3_BUCKET}/*",
                "arn:aws:s3:::${S3_BUCKET}"
            ],
            "Condition": {
                "Bool": {
                    "aws:SecureTransport": "false"
                }
            }
        }
    ]
}
EOF
)

aws s3api put-bucket-policy \
    --bucket "$S3_BUCKET" \
    --policy "$BUCKET_POLICY" \
    --profile "$AWS_PROFILE"

echo -e "${GREEN}✓ Bucket policy added${NC}"

# Check if DynamoDB table exists
echo ""
echo -e "${YELLOW}Checking DynamoDB table...${NC}"
if aws dynamodb describe-table \
    --table-name "$DYNAMODB_TABLE" \
    --region "$AWS_REGION" \
    --profile "$AWS_PROFILE" &> /dev/null; then
    echo -e "${YELLOW}⚠ DynamoDB table '$DYNAMODB_TABLE' already exists${NC}"
else
    echo -e "${YELLOW}Creating DynamoDB table '$DYNAMODB_TABLE'...${NC}"

    aws dynamodb create-table \
        --table-name "$DYNAMODB_TABLE" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE"

    echo -e "${YELLOW}Waiting for table to be active...${NC}"
    aws dynamodb wait table-exists \
        --table-name "$DYNAMODB_TABLE" \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE"

    echo -e "${GREEN}✓ DynamoDB table created${NC}"
fi

# Enable point-in-time recovery
echo -e "${YELLOW}Enabling point-in-time recovery...${NC}"
aws dynamodb update-continuous-backups \
    --table-name "$DYNAMODB_TABLE" \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
    --region "$AWS_REGION" \
    --profile "$AWS_PROFILE" &> /dev/null || echo -e "${YELLOW}⚠ Point-in-time recovery already enabled${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Backend Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}Backend Configuration:${NC}"
echo -e "  S3 Bucket:      ${YELLOW}$S3_BUCKET${NC}"
echo -e "  DynamoDB Table: ${YELLOW}$DYNAMODB_TABLE${NC}"
echo -e "  AWS Region:     ${YELLOW}$AWS_REGION${NC}"
echo -e "  AWS Profile:    ${YELLOW}$AWS_PROFILE${NC}"
echo ""
echo -e "${GREEN}State File Structure:${NC}"
echo -e "  painterflow/crm/dev/terraform.tfstate"
echo -e "  painterflow/crm/staging/terraform.tfstate"
echo -e "  painterflow/crm/production/terraform.tfstate"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo -e "  1. cd infrastructure/terraform/environments/dev"
echo -e "  2. export TF_VAR_db_password='YourSecurePassword'"
echo -e "  3. terraform init"
echo -e "  4. terraform plan"
echo -e "  5. terraform apply"
echo ""
echo -e "${GREEN}For more information, see:${NC}"
echo -e "  infrastructure/terraform/DEPLOYMENT_GUIDE.md"
echo ""
