# AWS Rekognition Setup Guide

This guide helps you configure AWS Rekognition for SafeTrade's identity verification system.

## 🚀 Quick Setup Steps

### 1. Create AWS IAM User

1. **Go to AWS Console** → https://console.aws.amazon.com/iam/
2. **Navigate to Users** → Create user
3. **User Details:**
   - Username: `safetrade-rekognition-user`
   - Access type: ✅ Programmatic access
   - AWS Management Console access: ❌ (not needed)

### 2. Attach Rekognition Permissions

**Option A: Full Access (Easiest)**
- Attach existing policy: `AmazonRekognitionFullAccess`

**Option B: Minimal Permissions (Recommended for Production)**
Create a custom policy with this JSON:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "rekognition:DetectFaces",
                "rekognition:CompareFaces"
            ],
            "Resource": "*"
        }
    ]
}
```

### 3. Get Access Keys

1. After creating the user, **download the CSV** with credentials
2. Copy the **Access Key ID** and **Secret Access Key**

### 4. Update Environment Variables

Replace the placeholder values in `.env.local`:

```bash
# AWS Rekognition Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...your_actual_key_here
AWS_SECRET_ACCESS_KEY=your_actual_secret_here

# Enable AWS Rekognition (set to production)
NODE_ENV=production
```

### 5. Test the Setup

1. Restart your development server: `npm run dev`
2. Try the identity verification flow
3. Check for AWS permission errors in console

## 🛠 Troubleshooting

### Permission Denied Error
```
User: arn:aws:sts::123456789:assumed-role/... is not authorized to perform: rekognition:DetectFaces
```
**Solution:** The IAM user needs `rekognition:DetectFaces` and `rekognition:CompareFaces` permissions.

### Invalid Credentials Error
```
The security token included in the request is invalid
```
**Solution:** Check that your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are correct.

### Development Mode
If you want to test without AWS credentials, keep:
```bash
NODE_ENV=development
```
This will use mock verification responses.

## 💰 AWS Costs

AWS Rekognition pricing (as of 2025):
- **Face Detection:** $0.001 per image
- **Face Comparison:** $0.001 per image pair
- **Example:** 1,000 verifications = ~$2.00

## 🔒 Security Best Practices

1. **Use IAM roles** in production instead of access keys
2. **Rotate credentials** regularly
3. **Monitor usage** in AWS CloudWatch
4. **Set up billing alerts** to track costs
5. **Use minimal permissions** - only DetectFaces and CompareFaces

## 📞 Support

If you encounter issues:
1. Check AWS CloudTrail logs for detailed error messages
2. Verify your AWS account has Rekognition enabled in your region
3. Contact AWS support for account-specific issues