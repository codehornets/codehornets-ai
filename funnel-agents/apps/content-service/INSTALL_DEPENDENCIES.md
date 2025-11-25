# Installing Content Service Dependencies

The content service requires two additional dependencies that are not currently in package.json:

## Required Dependencies

### 1. diff - For version comparison
Used by the version service to generate text diffs between content versions.

### 2. sharp - For image processing
Used by the storage service to generate thumbnails for uploaded images.

## Installation

Run the following command from the monorepo root:

```bash
cd /home/anga/workspace/beta/codehornets-ai/funnel-agents
npm install diff sharp
npm install -D @types/diff
```

Or add them to the `dependencies` section in package.json:

```json
{
  "dependencies": {
    "diff": "^5.1.0",
    "sharp": "^0.33.0"
  },
  "devDependencies": {
    "@types/diff": "^5.0.9"
  }
}
```

Then run:
```bash
npm install
```

## Verification

After installation, verify the dependencies:

```bash
npm list diff sharp
```

You should see output similar to:
```
funnelagents@0.0.1 /path/to/funnel-agents
├── diff@5.1.0
└── sharp@0.33.0
```

## Optional: AWS SDK for S3 Storage

If you plan to use S3 storage instead of local storage, also install:

```bash
npm install @aws-sdk/client-s3
```

Then uncomment the S3StorageProvider code in:
- `/apps/content-service/src/files/services/storage.service.ts`

And set the environment variable:
```bash
STORAGE_TYPE=s3
```

## Testing

After installing dependencies, run the tests to ensure everything works:

```bash
npm run test content-service
```

If you encounter any issues with sharp (common on some Linux distributions), you may need to install system dependencies:

```bash
# Ubuntu/Debian
sudo apt-get install libvips-dev

# CentOS/RHEL
sudo yum install vips-devel

# macOS
brew install vips
```

## Ready to Use

Once dependencies are installed, the content service will have full functionality:
- ✅ Content versioning with diff comparison
- ✅ Image thumbnail generation
- ✅ All other features (approvals, publishing, templates, analytics)
