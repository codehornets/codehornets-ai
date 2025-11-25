# Docker Secrets Directory

This directory contains sensitive configuration files used by Docker Compose secrets.

## Required Secret Files

Create the following files in this directory before deploying to production:

### 1. postgres_password.txt
PostgreSQL database password.

```bash
# Generate a secure password
openssl rand -base64 32 > postgres_password.txt
```

### 2. database_url.txt
Full PostgreSQL connection string.

```bash
# Format: postgresql://USER:PASSWORD@postgres:5432/DATABASE
echo "postgresql://funnel_agents_prod:YOUR_POSTGRES_PASSWORD@postgres:5432/funnel_agents_prod" > database_url.txt
```

### 3. jwt_secret.txt
JWT signing secret for authentication.

```bash
# Generate a secure secret
openssl rand -base64 64 > jwt_secret.txt
```

### 4. n8n_encryption_key.txt
n8n workflow encryption key.

```bash
# Generate a secure key
openssl rand -base64 32 > n8n_encryption_key.txt
```

## Quick Setup

Run the following commands to generate all secrets:

```bash
# Generate random secrets
openssl rand -base64 32 > postgres_password.txt
openssl rand -base64 64 > jwt_secret.txt
openssl rand -base64 32 > n8n_encryption_key.txt

# Manually create database_url.txt
# Replace YOUR_POSTGRES_PASSWORD with the value from postgres_password.txt
echo "postgresql://funnel_agents_prod:$(cat postgres_password.txt)@postgres:5432/funnel_agents_prod" > database_url.txt
```

Or use the Makefile:

```bash
cd /home/anga/workspace/beta/codehornets-ai/funnel-agents/infrastructure/docker
make prod-secrets
```

## Security Notes

- Never commit these files to version control
- Use proper file permissions: `chmod 600 *.txt`
- Rotate secrets regularly
- Use a secrets manager for production (AWS Secrets Manager, HashiCorp Vault, etc.)
- Keep backups of these secrets in a secure location

## File Permissions

Set proper permissions after creating the files:

```bash
chmod 600 *.txt
chown root:root *.txt  # On production servers
```

## Backup

Create encrypted backups of secrets:

```bash
# Create encrypted archive
tar czf - *.txt | openssl enc -aes-256-cbc -salt -out secrets-backup-$(date +%Y%m%d).tar.gz.enc

# Restore from backup
openssl enc -d -aes-256-cbc -in secrets-backup-20250101.tar.gz.enc | tar xzf -
```

## Using External Secrets Managers

For production environments, consider using external secrets managers:

### AWS Secrets Manager
```bash
aws secretsmanager create-secret --name funnelagents/postgres_password --secret-string "$(openssl rand -base64 32)"
```

### HashiCorp Vault
```bash
vault kv put secret/funnelagents postgres_password=$(openssl rand -base64 32)
```

### Docker Swarm Secrets
```bash
echo "$(openssl rand -base64 32)" | docker secret create postgres_password -
```
