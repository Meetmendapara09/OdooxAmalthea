# Forgot Password Feature - Implementation Guide

## Overview
A complete, secure forgot password system has been implemented for ExpensEasy, allowing users to reset their passwords via email when they forget their credentials.

## Features Implemented

### 1. Database Schema
- **New Table**: `password_reset_tokens`
  - `id`: Unique identifier (TEXT, Primary Key)
  - `user_id`: Foreign key to users table
  - `token`: SHA-256 hashed token (UNIQUE)
  - `expires_at`: Token expiration timestamp (1 hour from creation)
  - `created_at`: Token creation timestamp
  - `used_at`: Timestamp when token was used (NULL if unused)

### 2. User Interface Pages

#### Forgot Password Page (`/forgot-password`)
- Clean, user-friendly form to request password reset
- Email input with validation
- Success/error message display
- Links to login and signup pages
- Loading states during API calls

#### Reset Password Page (`/reset-password`)
- Token validation on page load
- Password strength requirements (min 8 characters)
- Password confirmation field
- Real-time validation and error messages
- Automatic redirect to login after successful reset
- Expired/invalid token handling

### 3. API Endpoints

#### `POST /api/auth/forgot-password`
**Purpose**: Initiate password reset request

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Process**:
1. Validates email format
2. Looks up user by email
3. Generates secure 32-byte random token
4. Hashes token with SHA-256 before storage
5. Deletes any existing tokens for the user
6. Creates new token with 1-hour expiration
7. Sends password reset email with reset link
8. Returns success message (even if email doesn't exist - prevents enumeration)

**Response**:
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

#### `POST /api/auth/reset-password`
**Purpose**: Complete password reset with valid token

**Request Body**:
```json
{
  "token": "abc123...",
  "password": "newpassword123"
}
```

**Process**:
1. Validates password (min 8 characters)
2. Hashes provided token with SHA-256
3. Looks up token in database
4. Verifies token hasn't expired or been used
5. Hashes new password with bcrypt
6. Updates user password
7. Marks token as used
8. Returns success

**Response**:
```json
{
  "message": "Password successfully reset."
}
```

#### `GET /api/auth/reset-password?token=xxx`
**Purpose**: Verify token validity before showing reset form

**Response**:
```json
{
  "valid": true
}
```
or
```json
{
  "valid": false,
  "error": "This reset link is invalid or has expired."
}
```

### 4. Email Templates
Enhanced the mailer module with `sendPasswordResetEmail` function:

**Email Content**:
- Professional HTML template with ExpensEasy branding
- Clear call-to-action button
- Plain text fallback for email clients
- Expiration notice (1 hour)
- Security notice if user didn't request reset
- Fallback text link if button doesn't work

### 5. Security Features

#### Token Security
- **Random Generation**: 32 bytes of cryptographically secure random data
- **Hashing**: Tokens hashed with SHA-256 before database storage
- **Single-Use**: Tokens marked as used after successful password reset
- **Expiration**: 1-hour validity window
- **Cleanup**: Old tokens deleted when new reset requested

#### Email Enumeration Prevention
- Always returns success message regardless of whether email exists
- Prevents attackers from discovering valid email addresses

#### Password Requirements
- Minimum 8 characters enforced
- Client-side and server-side validation
- Bcrypt hashing (10 rounds) for storage

#### Rate Limiting Considerations
- Consider implementing rate limiting on forgot password endpoint
- Suggested: 3 requests per IP per hour

### 6. Login Page Enhancement
- Added "Forgot password?" link above the login button
- Styled consistently with existing design
- Directs users to `/forgot-password` page

## User Flow

### Forgot Password Flow
1. User clicks "Forgot password?" on login page
2. User enters email address on forgot password page
3. System generates secure token and sends email
4. User receives email with reset link
5. User clicks link (valid for 1 hour)
6. System validates token on reset password page
7. User enters new password (twice for confirmation)
8. System validates password and updates account
9. User automatically redirected to login page
10. User logs in with new password

## Configuration

### Environment Variables Required
```env
# SMTP Configuration (Optional - for email delivery)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_SECURE=false  # true for port 465
SMTP_FROM=noreply@expenseasy.com

# Application URLs (Required)
NEXT_PUBLIC_WEB_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
```

### Development Mode
If SMTP is not configured:
- Reset URLs are logged to server console
- Administrators can manually share links during development
- Useful for local testing without email setup

## Testing the Feature

### Manual Testing Steps

1. **Request Password Reset**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com"}'
   ```

2. **Check Server Logs** (if SMTP not configured):
   - Look for reset URL in terminal output
   - Format: `http://localhost:3000/reset-password?token=xxx`

3. **Verify Token**:
   ```bash
   curl http://localhost:3000/api/auth/reset-password?token=YOUR_TOKEN
   ```

4. **Reset Password**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{"token":"YOUR_TOKEN","password":"newpassword123"}'
   ```

5. **Login with New Password**:
   - Navigate to `/login`
   - Use email and new password

### Test Scenarios

✅ **Success Cases**:
- Valid email receives reset link
- Token validates correctly
- Password reset succeeds
- User can log in with new password

✅ **Error Cases**:
- Invalid/non-existent email (returns generic success)
- Expired token (1 hour+)
- Used token (second attempt fails)
- Malformed token
- Password too short (<8 chars)
- Passwords don't match

## Database Migration

The password reset tokens table needs to be created. If automated migrations fail:

### Manual Creation Script
A SQL script is provided at `/scripts/create_password_reset_table.sql`:

```sql
-- Run this if the table doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'password_reset_tokens') THEN
        CREATE TABLE "password_reset_tokens" (
            "id" TEXT NOT NULL,
            "user_id" TEXT NOT NULL,
            "token" TEXT NOT NULL,
            "expires_at" TIMESTAMP(3) NOT NULL,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "used_at" TIMESTAMP(3),
            CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
        );
        -- Indexes and foreign keys...
    END IF;
END $$;
```

### Prisma Migration
Schema updated with PasswordResetToken model:
```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  usedAt    DateTime?

  @@index([userId])
  @@index([token])
  @@map("password_reset_tokens")
}
```

## Future Enhancements

### Recommended Additions
1. **Rate Limiting**: Prevent abuse by limiting reset requests per IP/email
2. **Token Cleanup**: Periodic job to delete expired tokens (older than 24 hours)
3. **Password Strength Meter**: Visual indicator on reset form
4. **Two-Factor Authentication**: Additional security layer for password resets
5. **Account Activity Log**: Track password changes and reset attempts
6. **Multiple Notification Channels**: SMS or app notification as alternative to email

### Monitoring
Consider adding:
- Metrics for password reset success/failure rates
- Alerting for unusual password reset patterns
- Audit logging for security compliance

## Files Modified/Created

### New Files
- `/src/app/forgot-password/page.tsx` - Forgot password UI
- `/src/app/reset-password/page.tsx` - Reset password UI
- `/src/app/api/auth/forgot-password/route.ts` - Forgot password API
- `/src/app/api/auth/reset-password/route.ts` - Reset password API
- `/src/app/api/auth/reset-password/verify/route.ts` - Token verification API
- `/scripts/create_password_reset_table.sql` - Manual migration script
- `/prisma/migrations/20251004_password_reset_tokens/migration.sql` - Schema migration

### Modified Files
- `/prisma/schema.prisma` - Added PasswordResetToken model
- `/src/lib/mailer.ts` - Added sendPasswordResetEmail function
- `/src/components/auth/login-form.tsx` - Added forgot password link
- `/README.md` - Updated documentation
- `/ARCHITECTURE.md` - Added security section for password reset

## Troubleshooting

### Issue: Email not received
**Solution**: 
- Check SMTP configuration in `.env`
- Check server logs for email delivery errors
- Use development mode (check console for reset URL)
- Verify SMTP credentials and port settings

### Issue: Token expired
**Solution**: 
- Request new reset link (tokens expire after 1 hour)
- Each email contains fresh 1-hour token

### Issue: Token invalid
**Solution**:
- Ensure full token from URL is used
- Check if token was already used
- Verify database table exists and is accessible

### Issue: Password reset succeeds but can't login
**Solution**:
- Clear browser cache and cookies
- Verify new password meets requirements
- Check if password was actually updated in database

## Summary

The forgot password feature is now fully functional and production-ready, providing:

✅ Secure token-based password reset
✅ Email delivery with professional templates
✅ Clean, intuitive user interface
✅ Comprehensive error handling
✅ Security best practices
✅ Development-friendly fallbacks

Users can now securely reset their passwords without administrator intervention, improving the overall user experience and reducing support burden.
