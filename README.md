# Canvas Backend Server

A production-ready authentication and user management backend API built with **Node.js, Express, MongoDB, and JWT**.

---

## 🚀 Overview

This server provides a complete authentication system with user registration, email verification, password management, and protected endpoints. It implements industry best practices including:

- ✅ JWT-based authentication (Access & Refresh tokens)
- ✅ Email verification with nodemailer
- ✅ Password reset functionality
- ✅ Input validation & strong password requirements
- ✅ Rate limiting on sensitive endpoints
- ✅ Token blacklisting on logout
- ✅ Protected routes with middleware authentication

---

## 📋 Table of Contents

1. [Installation](#installation)
2. [Environment Setup](#environment-setup)
3. [Features](#features)
4. [API Endpoints](#api-endpoints)
5. [Authentication Flow](#authentication-flow)
6. [Project Structure](#project-structure)

---

## 🔧 Installation

### Prerequisites
- Node.js (v14+)
- MongoDB (local or MongoDB Atlas)
- Gmail account (for email verification)

### Steps

1. **Clone and navigate to backend**
   ```bash
   cd canvas/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file** in the root directory
   ```env
   JWT_SECRET=your-secret-key-here
   JWT_REFRESH_SECRET=your-refresh-secret-key-here
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   MONGODB_URI=mongodb://localhost:27017/canvas
   ```

4. **Start the server**
   ```bash
   node server.js
   ```

   The server will run on `http://localhost:3000`

---

## 📝 Environment Setup

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for access token signing | `mysecret123` |
| `JWT_REFRESH_SECRET` | Secret key for refresh token signing | `myrefreshsecret123` |
| `EMAIL_USER` | Gmail address for sending emails | `your.email@gmail.com` |
| `EMAIL_PASS` | Gmail app password (not your normal password) | `xxxx xxxx xxxx xxxx` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/canvas` |

### Gmail App Password Setup

1. Enable 2-factor authentication on your Gmail account
2. Go to [Google Account Security](https://myaccount.google.com/security)
3. Find "App passwords" and generate one for this application
4. Copy the 16-character password to `.env` as `EMAIL_PASS`

---

## ✨ Features

### 1. User Registration & Email Verification
- Sign up with name, email, and password
- Password strength validation (8+ chars, 1 uppercase, 1 number, 1 special char)
- Email verification token sent to user's inbox
- User cannot login until email is verified

### 2. Authentication & Tokens
- **Access Token** (15 minutes): Used for API requests
- **Refresh Token** (7 days): Used to get new access tokens
- Automatic token refresh without re-login

### 3. Password Management
- **Password Reset**: Via email link with 1-hour expiration
- **Change Password**: For authenticated users
- All passwords are hashed with bcrypt

### 4. Protected Routes
- Middleware-based authentication
- User data attached to requests
- Token blacklist checking

### 5. Rate Limiting
- Signup: 5 requests per 15 minutes
- Login: 10 requests per 15 minutes
- Forgot Password: 5 requests per hour

### 6. Security Features
- Input validation on all fields
- Email format validation
- Password strength requirements
- Token blacklisting on logout
- Secure password comparison

### 7. User Management
- View current user profile
- Update name and/or email
- Delete account (with password confirmation)
- Resend verification emails

---

## 📡 API Endpoints

### Base URL
```
http://localhost:3000/api/auth
```

---

### 1. **Register User**
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /register` |
| **Authentication** | ❌ Not required |
| **Rate Limit** | 5 requests per 15 minutes |

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password@123"
}
```

**Response (201):**
```json
{
  "message": "Registered! Please check your email to verify account."
}
```

**Validation Rules:**
- All fields required
- Email must be valid format
- Password must be 8+ characters with 1 uppercase, 1 number, 1 special char (@$!%*?&)

---

### 2. **Verify Email**
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /verify-email/:token` |
| **Authentication** | ❌ Not required |

**Response (200):**
```json
{
  "message": "Email verified successfully. You can now login."
}
```

**Note:** Token is sent in the verification email link. Click the link directly in your email.

---

### 3. **Login/Sign In**
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /login` |
| **Authentication** | ❌ Not required |
| **Rate Limit** | 10 requests per 15 minutes |

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password@123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Requirements:**
- Email must be verified to login
- Both accessToken and refreshToken are returned

---

### 4. **Get Current User Profile**
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /me` |
| **Authentication** | ✅ **Required** (Bearer Token) |

**Request Header:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "isVerified": true,
  "createdAt": "2026-02-14T10:30:00.000Z",
  "updatedAt": "2026-02-14T10:30:00.000Z"
}
```

---

### 5. **Change Password**
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /change-password` |
| **Authentication** | ✅ **Required** (Bearer Token) |

**Request Header:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@456"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Validation:**
- Current password must be correct
- New password must meet strength requirements

---

### 6. **Forgot Password**
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /forgot-password` |
| **Authentication** | ❌ Not required |
| **Rate Limit** | 5 requests per hour |

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset link sent to email"
}
```

**Note:** User receives an email with a reset link (valid for 1 hour)

---

### 7. **Reset Password (GET Form)**
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /reset-password/:token` |
| **Authentication** | ❌ Not required |

**Response:** HTML form for entering new password

**Note:** Token comes from the email link

---

### 8. **Reset Password (POST)**
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /reset-password/:token` |
| **Authentication** | ❌ Not required |

**Request Body:**
```json
{
  "password": "NewPassword@789"
}
```

**Response (200):**
```json
{
  "message": "Password reset successful"
}
```

---

### 9. **Refresh Access Token**
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /refresh-token` |
| **Authentication** | ❌ Not required |

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Use Case:** When your access token expires after 15 minutes

---

### 10. **Resend Verification Email**
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /resend-verification-email` |
| **Authentication** | ❌ Not required |

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "Verification email sent. Please check your inbox."
}
```

**Error:** Returns 400 if email is already verified

---

### 11. **Update User Profile**
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /update-profile` |
| **Authentication** | ✅ **Required** (Bearer Token) |

**Request Header:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Response (200):**
```json
{
  "message": "Profile updated. Please verify your new email.",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

**Note:** If email is changed, user must verify the new email before next login

---

### 12. **Delete Account**
| Property | Value |
|----------|-------|
| **Endpoint** | `DELETE /delete-account` |
| **Authentication** | ✅ **Required** (Bearer Token) |

**Request Header:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "password": "CurrentPassword@123"
}
```

**Response (200):**
```json
{
  "message": "Account deleted successfully"
}
```

**Security:** Password confirmation is required

---

### 13. **Logout**
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /logout` |
| **Authentication** | ✅ **Required** (Bearer Token) |

**Request Header:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**What happens:**
- Refresh token is cleared from database
- Access token is added to blacklist
- User cannot use old tokens after logout

---

## 🔐 Authentication Flow

### Complete Login & Usage Flow

```
1. USER REGISTERS
   POST /register
   ↓
   Email verification email sent
   ↓
   User clicks verification link
   ↓
   GET /verify-email/:token

2. USER LOGS IN
   POST /login
   ↓
   Receives: accessToken (15 min) + refreshToken (7 days)

3. USER MAKES API REQUESTS
   GET /me
   Header: Authorization: Bearer accessToken
   ↓
   Server validates token & returns user data

4. ACCESS TOKEN EXPIRES (after 15 min)
   POST /refresh-token
   Body: { refreshToken }
   ↓
   Receives new accessToken
   ↓
   Continue using new accessToken

5. USER LOGS OUT
   POST /logout
   Header: Authorization: Bearer accessToken
   ↓
   Refresh token cleared
   ↓
   Access token blacklisted
   ↓
   User cannot use old tokens
```

---

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   └── authController.js     # All auth logic
├── middleware/
│   └── authMiddleware.js     # JWT verification
├── models/
│   └── User.js               # User schema
├── routes/
│   └── authroutes.js         # All endpoints
├── .env                      # Environment variables
├── server.js                 # Main server file
├── package.json              # Dependencies
├── Dockerfile                # Docker setup
└── README.md                 # This file
```

---

## 🔑 Key Technologies

| Technology | Purpose |
|-----------|---------|
| **Express.js** | Web framework |
| **MongoDB** | Database |
| **Mongoose** | ODM for MongoDB |
| **JWT** | Token-based authentication |
| **bcrypt** | Password hashing |
| **nodemailer** | Email sending |
| **express-rate-limit** | API rate limiting |

---

## 📊 Password Requirements

Passwords must contain:
- ✅ Minimum 8 characters
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 number (0-9)
- ✅ At least 1 special character (@$!%*?&)

**Example:** `Password@123` ✅

---

## ⏱️ Token Expiration

| Token Type | Expiration | Use Case |
|-----------|-----------|----------|
| **Access Token** | 15 minutes | API requests |
| **Refresh Token** | 7 days | Get new access token |
| **Verification Token** | No expiration | Email verification |
| **Reset Token** | 1 hour | Password reset |

---

## 🛡️ Security Features

1. **Password Hashing**: bcrypt with 10 salt rounds
2. **Input Validation**: Email format & password strength
3. **Rate Limiting**: Protects against brute force attacks
4. **Token Blacklist**: Prevents token reuse after logout
5. **Secure Headers**: Authorization bearer token scheme
6. **Email Verification**: Required before login
7. **Password Confirmation**: Required for account deletion

---

## 🐛 Error Handling

All errors return appropriate HTTP status codes:

| Status | Meaning |
|--------|---------|
| **200** | Success |
| **201** | Created (signup success) |
| **400** | Bad request (validation error) |
| **401** | Unauthorized (auth failed) |
| **404** | Not found (user not found) |
| **500** | Server error |

**Error Response Format:**
```json
{
  "message": "Error description",
  "error": "error details"
}
```

---

## 🎯 Best Practices for Frontend

### 1. Store Tokens Securely
```javascript
// Good: localStorage (simple)
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);

// Better: httpOnly cookie (secure)
// Server sets cookie automatically
```

### 2. Send Token in Requests
```javascript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};
```

### 3. Handle Token Expiration
```javascript
// When you get 401 response:
1. Call POST /refresh-token
2. Get new accessToken
3. Retry original request
4. If refresh fails, redirect to login
```

### 4. Logout Properly
```javascript
// 1. Call logout endpoint
POST /logout with accessToken

// 2. Clear tokens from storage
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');

// 3. Redirect to login
```

---

## 📞 Support & Troubleshooting

### Email Not Sending?
- Check EMAIL_USER and EMAIL_PASS in `.env`
- Verify app password is set in Gmail
- Check inbox spam folder

### MongoDB Connection Error?
- Verify MONGODB_URI is correct
- Check MongoDB is running
- Check network connection

### Rate Limit Hit?
- Wait for the time window to reset
- Adjust limits in `authroutes.js` if needed

### Token Validation Failed?
- Ensure token format is correct: `Bearer <token>`
- Check token hasn't expired
- Verify JWT_SECRET matches in .env

---

## 📄 License

MIT License - Feel free to use this code

---

## ✅ Checklist for Deployment

- [ ] Set all environment variables in `.env`
- [ ] Test all endpoints in Postman
- [ ] Setup MongoDB (Atlas or local)
- [ ] Setup Gmail app password
- [ ] Run `npm install` successfully
- [ ] No console errors on startup
- [ ] Email verification works
- [ ] Token refresh works
- [ ] Rate limiting works
- [ ] Protected routes require token

---

**Created:** February 15, 2026  
**Backend Framework:** Express.js + MongoDB  
**Version:** 1.0.0
