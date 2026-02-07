# Membership Service API Integration Guide

## Overview

This document provides comprehensive instructions for integrating external services with the Membership Service API. The API implements OAuth 2.0 Resource Owner Password Flow, allowing your service to authenticate users and retrieve their profile information securely.

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Getting Started](#getting-started)
3. [API Endpoints](#api-endpoints)
4. [Code Examples](#code-examples)
5. [Error Handling](#error-handling)
6. [Security Best Practices](#security-best-practices)
7. [Rate Limiting](#rate-limiting)
8. [Support](#support)

---

## Authentication Flow

The Membership Service uses **OAuth 2.0 Resource Owner Password Flow** with client credentials validation. This ensures both your service and the user are authenticated.

### Flow Diagram

```
┌──────────┐                                   ┌─────────────────┐
│  User    │                                   │ Your Service    │
│          │                                   │  (Chatbot/App)  │
└────┬─────┘                                   └────────┬────────┘
     │                                                  │
     │  1. Enters username + password                  │
     │─────────────────────────────────────────────────▶│
     │                                                  │
     │                                                  │  2. Send credentials
     │                                         POST /api/oauth/token
     │                                         ┌────────┼─────────┐
     │                                         │ Body:            │
     │                                         │ - grant_type     │
     │                                         │ - client_id      │
     │                                         │ - client_secret  │
     │                                         │ - username       │
     │                                         │ - password       │
     │                                         └────────┼─────────┘
     │                                                  │
     │                                                  ▼
     │                                         ┌─────────────────┐
     │                                         │  Membership API │
     │                                         │                 │
     │                                         │ 1. Verify       │
     │                                         │    Service      │
     │                                         │ 2. Verify       │
     │                                         │    User         │
     │                                         │ 3. Issue Token  │
     │                                         └────────┬────────┘
     │                                                  │
     │                                         3. Access token
     │                                         ◀────────┤
     │                                                  │
     │                                                  │  4. Request user info
     │                                         GET /api/oauth/user-info
     │                                         Authorization: Bearer {token}
     │                                                  │
     │                                                  ▼
     │                                         ┌─────────────────┐
     │                                         │  Membership API │
     │                                         │                 │
     │                                         │ Verify Token    │
     │                                         │ Return Profile  │
     │                                         └────────┬────────┘
     │                                                  │
     │                                         5. User profile data
     │                                         ◀────────┤
     │                                                  │
     │  6. Display/Use user information                │
     │◀─────────────────────────────────────────────────┤
     │                                                  │
```

### Key Points

- **Service Authentication**: Your service authenticates using `client_id` and `client_secret`
- **User Authentication**: User credentials are verified by the Membership Service
- **Token Caching**: Access tokens are valid for 1 hour and should be cached per session
- **Security**: User passwords never leave the authentication flow

---

## Getting Started

### Step 1: Register Your Service

Contact the administrator to create an OAuth client for your service. You will receive:

- `client_id`: Unique identifier for your service (e.g., `client_abc123def456...`)
- `client_secret`: Secret key for authentication (e.g., `secret_xyz789...`)

**⚠️ IMPORTANT**: Store the `client_secret` securely. It will only be shown once!

### Step 2: Store Credentials Securely

```bash
# Environment variables (recommended)
MEMBERSHIP_API_URL=https://your-membership-service.com
MEMBERSHIP_CLIENT_ID=client_abc123def456...
MEMBERSHIP_CLIENT_SECRET=secret_xyz789...
```

### Step 3: Implement Authentication

See [Code Examples](#code-examples) below for implementation in various languages.

---

## API Endpoints

### Base URL

```
https://your-membership-service.com/api
```

### 1. Token Endpoint

**Endpoint**: `POST /oauth/token`

**Description**: Obtain an access token by providing service and user credentials.

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "grant_type": "password",
  "client_id": "client_abc123def456...",
  "client_secret": "secret_xyz789...",
  "username": "user@example.com",
  "password": "user_password",
  "scope": "user_info"
}
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `grant_type` | string | Yes | Must be `"password"` |
| `client_id` | string | Yes | Your service's client ID |
| `client_secret` | string | Yes | Your service's client secret |
| `username` | string | Yes | User's email or membership number |
| `password` | string | Yes | User's password |
| `scope` | string | No | Requested scope (default: `"user_info"`) |

**Success Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "user_info"
}
```

**Error Responses**:

- **400 Bad Request**: Invalid request format
```json
{
  "error": "invalid_request",
  "error_description": "username and password are required"
}
```

- **401 Unauthorized**: Invalid credentials
```json
{
  "error": "invalid_client",
  "error_description": "Invalid client credentials"
}
```

```json
{
  "error": "invalid_grant",
  "error_description": "Invalid user credentials"
}
```

---

### 2. User Info Endpoint

**Endpoint**: `GET /oauth/user-info`

**Description**: Retrieve full user profile information using a valid access token.

**Request Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "membership_number": "MEM123456",
    "ar_name": "اسم العضو",
    "latin_name": "Member Name",
    "whatsapp": "+1234567890",
    "email": "user@example.com",
    "sex": "Male",
    "birth_date": "1990-01-01",
    "country": "Country",
    "city": "City",
    "district": "District",
    "university": "University Name",
    "major": "Computer Science",
    "graduation_year": "2024",
    "blood_type": "O+",
    "phone": "+1234567890"
  }
}
```

**Error Responses**:

- **401 Unauthorized**: Missing or invalid token
```json
{
  "error": "invalid_token",
  "error_description": "Token is invalid or expired"
}
```

- **404 Not Found**: User not found
```json
{
  "error": "invalid_token",
  "error_description": "User not found"
}
```

---

### 3. Token Introspection Endpoint (Optional)

**Endpoint**: `POST /oauth/introspect`

**Description**: Check if an access token is valid (useful for debugging).

**Request Body**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "client_id": "client_abc123def456...",
  "client_secret": "secret_xyz789..."
}
```

**Success Response** (200 OK):
```json
{
  "active": true,
  "client_id": "client_abc123def456...",
  "username": "MEM123456",
  "scope": "user_info",
  "exp": 1738886400,
  "iat": 1738882800
}
```

**Inactive Token Response**:
```json
{
  "active": false
}
```

---

## Code Examples

### Node.js / TypeScript

```typescript
import axios from 'axios';

interface MembershipConfig {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
}

interface UserProfile {
  membership_number: string;
  email: string;
  latin_name: string;
  ar_name: string;
  phone: string;
  whatsapp: string;
  // ... other fields
}

class MembershipAPIClient {
  private config: MembershipConfig;
  private tokenCache: Map<string, { token: string; expiresAt: number }> = new Map();

  constructor(config: MembershipConfig) {
    this.config = config;
  }

  /**
   * Authenticate user and get access token
   */
  async authenticateUser(username: string, password: string): Promise<string> {
    try {
      const response = await axios.post(`${this.config.apiUrl}/oauth/token`, {
        grant_type: 'password',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        username: username,
        password: password,
        scope: 'user_info',
      });

      const { access_token, expires_in } = response.data;
      
      // Cache token with expiration
      const expiresAt = Date.now() + (expires_in * 1000);
      this.tokenCache.set(username, { token: access_token, expiresAt });

      return access_token;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Authentication failed: ${error.response.data.error_description || error.response.data.error}`
        );
      }
      throw error;
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(accessToken: string): Promise<UserProfile> {
    try {
      const response = await axios.get(`${this.config.apiUrl}/oauth/user-info`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data.user;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Access token is invalid or expired');
      }
      throw error;
    }
  }

  /**
   * Complete login flow: authenticate and get profile
   */
  async loginUser(username: string, password: string): Promise<UserProfile> {
    // Check cache first
    const cached = this.tokenCache.get(username);
    if (cached && cached.expiresAt > Date.now()) {
      return await this.getUserProfile(cached.token);
    }

    // Authenticate and get new token
    const token = await this.authenticateUser(username, password);
    return await this.getUserProfile(token);
  }
}

// Usage Example
const client = new MembershipAPIClient({
  apiUrl: process.env.MEMBERSHIP_API_URL!,
  clientId: process.env.MEMBERSHIP_CLIENT_ID!,
  clientSecret: process.env.MEMBERSHIP_CLIENT_SECRET!,
});

// In your login handler
async function handleUserLogin(username: string, password: string) {
  try {
    const userProfile = await client.loginUser(username, password);
    console.log('User logged in:', userProfile.latin_name);
    console.log('Email:', userProfile.email);
    // Store user session...
  } catch (error) {
    console.error('Login failed:', error.message);
  }
}
```

---

### Python

```python
import requests
from typing import Dict, Optional
from datetime import datetime, timedelta

class MembershipAPIClient:
    def __init__(self, api_url: str, client_id: str, client_secret: str):
        self.api_url = api_url
        self.client_id = client_id
        self.client_secret = client_secret
        self.token_cache: Dict[str, Dict] = {}

    def authenticate_user(self, username: str, password: str) -> str:
        """Authenticate user and get access token"""
        try:
            response = requests.post(
                f"{self.api_url}/oauth/token",
                json={
                    "grant_type": "password",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "username": username,
                    "password": password,
                    "scope": "user_info"
                },
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            
            data = response.json()
            access_token = data["access_token"]
            expires_in = data["expires_in"]
            
            # Cache token
            expires_at = datetime.now() + timedelta(seconds=expires_in)
            self.token_cache[username] = {
                "token": access_token,
                "expires_at": expires_at
            }
            
            return access_token
            
        except requests.exceptions.HTTPError as e:
            error_data = e.response.json()
            raise Exception(f"Authentication failed: {error_data.get('error_description', error_data.get('error'))}")

    def get_user_profile(self, access_token: str) -> Dict:
        """Get user profile information"""
        try:
            response = requests.get(
                f"{self.api_url}/oauth/user-info",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            response.raise_for_status()
            
            return response.json()["user"]
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                raise Exception("Access token is invalid or expired")
            raise

    def login_user(self, username: str, password: str) -> Dict:
        """Complete login flow: authenticate and get profile"""
        # Check cache
        cached = self.token_cache.get(username)
        if cached and cached["expires_at"] > datetime.now():
            return self.get_user_profile(cached["token"])
        
        # Authenticate and get new token
        token = self.authenticate_user(username, password)
        return self.get_user_profile(token)


# Usage Example
import os

client = MembershipAPIClient(
    api_url=os.getenv("MEMBERSHIP_API_URL"),
    client_id=os.getenv("MEMBERSHIP_CLIENT_ID"),
    client_secret=os.getenv("MEMBERSHIP_CLIENT_SECRET")
)

# In your login handler
def handle_user_login(username: str, password: str):
    try:
        user_profile = client.login_user(username, password)
        print(f"User logged in: {user_profile['latin_name']}")
        print(f"Email: {user_profile['email']}")
        # Store user session...
    except Exception as e:
        print(f"Login failed: {str(e)}")
```

---

### PHP

```php
<?php

class MembershipAPIClient {
    private $apiUrl;
    private $clientId;
    private $clientSecret;
    private $tokenCache = [];

    public function __construct($apiUrl, $clientId, $clientSecret) {
        $this->apiUrl = $apiUrl;
        $this->clientId = $clientId;
        $this->clientSecret = $clientSecret;
    }

    /**
     * Authenticate user and get access token
     */
    public function authenticateUser($username, $password) {
        $data = [
            'grant_type' => 'password',
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'username' => $username,
            'password' => $password,
            'scope' => 'user_info'
        ];

        $ch = curl_init("{$this->apiUrl}/oauth/token");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            $error = json_decode($response, true);
            throw new Exception("Authentication failed: " . ($error['error_description'] ?? $error['error']));
        }

        $result = json_decode($response, true);
        $accessToken = $result['access_token'];
        $expiresIn = $result['expires_in'];

        // Cache token
        $this->tokenCache[$username] = [
            'token' => $accessToken,
            'expires_at' => time() + $expiresIn
        ];

        return $accessToken;
    }

    /**
     * Get user profile information
     */
    public function getUserProfile($accessToken) {
        $ch = curl_init("{$this->apiUrl}/oauth/user-info");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer {$accessToken}"
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 401) {
            throw new Exception("Access token is invalid or expired");
        }

        if ($httpCode !== 200) {
            throw new Exception("Failed to get user profile");
        }

        $result = json_decode($response, true);
        return $result['user'];
    }

    /**
     * Complete login flow: authenticate and get profile
     */
    public function loginUser($username, $password) {
        // Check cache
        if (isset($this->tokenCache[$username]) && 
            $this->tokenCache[$username]['expires_at'] > time()) {
            return $this->getUserProfile($this->tokenCache[$username]['token']);
        }

        // Authenticate and get new token
        $token = $this->authenticateUser($username, $password);
        return $this->getUserProfile($token);
    }
}

// Usage Example
$client = new MembershipAPIClient(
    getenv('MEMBERSHIP_API_URL'),
    getenv('MEMBERSHIP_CLIENT_ID'),
    getenv('MEMBERSHIP_CLIENT_SECRET')
);

// In your login handler
function handleUserLogin($username, $password) {
    global $client;
    
    try {
        $userProfile = $client->loginUser($username, $password);
        echo "User logged in: " . $userProfile['latin_name'] . "\n";
        echo "Email: " . $userProfile['email'] . "\n";
        // Store user session...
    } catch (Exception $e) {
        echo "Login failed: " . $e->getMessage() . "\n";
    }
}
```

---

### cURL Example

```bash
# Step 1: Get Access Token
curl -X POST https://your-membership-service.com/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "password",
    "client_id": "client_abc123def456...",
    "client_secret": "secret_xyz789...",
    "username": "user@example.com",
    "password": "user_password",
    "scope": "user_info"
  }'

# Response:
# {
#   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "token_type": "Bearer",
#   "expires_in": 3600,
#   "scope": "user_info"
# }

# Step 2: Get User Profile
curl -X GET https://your-membership-service.com/api/oauth/user-info \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Response:
# {
#   "success": true,
#   "user": {
#     "membership_number": "MEM123456",
#     "email": "user@example.com",
#     ...
#   }
# }
```

---

## Error Handling

### Error Response Format

All error responses follow this format:

```json
{
  "error": "error_code",
  "error_description": "Human-readable description"
}
```

### Common Error Codes

| Error Code | HTTP Status | Description | Solution |
|------------|-------------|-------------|----------|
| `invalid_request` | 400 | Missing or invalid parameters | Check request body format |
| `unsupported_grant_type` | 400 | Grant type is not "password" | Use `grant_type: "password"` |
| `invalid_client` | 401 | Invalid client credentials | Verify `client_id` and `client_secret` |
| `invalid_grant` | 401 | Invalid user credentials | User's username or password is incorrect |
| `invalid_token` | 401 | Token is invalid or expired | Request a new access token |
| `server_error` | 500 | Internal server error | Contact support if persists |

### Retry Logic

Implement exponential backoff for server errors:

```typescript
async function authenticateWithRetry(
  client: MembershipAPIClient,
  username: string,
  password: string,
  maxRetries = 3
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.authenticateUser(username, password);
    } catch (error: any) {
      // Don't retry on authentication failures
      if (error.message.includes('invalid_grant') || error.message.includes('invalid_client')) {
        throw error;
      }
      
      // Retry on server errors
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## Security Best Practices

### 1. Secure Credential Storage

**✅ DO:**
- Store `client_secret` in environment variables or secure vaults
- Use secrets management services (AWS Secrets Manager, Azure Key Vault, etc.)
- Never commit credentials to version control

**❌ DON'T:**
- Hardcode credentials in source code
- Store credentials in plain text files
- Expose credentials in logs or error messages

### 2. Token Management

**✅ DO:**
- Cache access tokens per user session
- Implement token expiration checking
- Clear tokens when user logs out
- Use secure storage for tokens (encrypted database, secure cookies)

**❌ DON'T:**
- Request new tokens for every API call
- Store tokens in localStorage or sessionStorage (XSS risk)
- Share tokens between different users

### 3. HTTPS Only

**⚠️ CRITICAL**: Always use HTTPS for all API calls. Never send credentials over HTTP.

### 4. Input Validation

```typescript
function validateUsername(username: string): boolean {
  // Basic email or membership number validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const membershipRegex = /^[A-Z0-9]+$/;
  
  return emailRegex.test(username) || membershipRegex.test(username);
}

function sanitizeInput(input: string): string {
  // Remove any potential injection characters
  return input.trim().replace(/[<>\"']/g, '');
}
```

### 5. Rate Limiting

Implement client-side rate limiting to prevent abuse:

```typescript
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindow: number;

  constructor(maxRequests: number = 10, timeWindowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  async checkLimit(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    this.requests.push(now);
  }
}
```

### 6. Logging and Monitoring

**✅ DO:**
- Log authentication attempts (success and failure)
- Monitor unusual patterns (multiple failures, high request rates)
- Alert on repeated authentication failures

**❌ DON'T:**
- Log passwords or tokens
- Log full request/response bodies containing sensitive data

---

## Rate Limiting

### Current Limits

- **Token Endpoint**: No strict limit currently, but implement client-side throttling
- **User Info Endpoint**: No strict limit for authenticated requests

### Recommended Client-Side Limits

- Max 10 authentication attempts per minute per user
- Max 100 user info requests per minute per service

### Future Considerations

The API may implement server-side rate limiting in the future. Monitor API responses for `429 Too Many Requests` status codes.

---

## Support

### Getting Help

- **Technical Issues**: Contact the system administrator
- **API Questions**: Refer to this documentation
- **Service Registration**: Request OAuth client credentials from admin

### Changelog

- **2026-02-05**: Initial OAuth 2.0 implementation
  - Resource Owner Password Flow
  - Token introspection endpoint
  - Full user profile access

---

## Appendix: User Profile Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `membership_number` | string | Unique member identifier | `"MEM123456"` |
| `ar_name` | string | Arabic name | `"اسم العضو"` |
| `latin_name` | string | Latin/English name | `"Member Name"` |
| `whatsapp` | string | WhatsApp number | `"+1234567890"` |
| `email` | string | Email address | `"user@example.com"` |
| `sex` | string | Gender | `"Male"` or `"Female"` |
| `birth_date` | string | Date of birth (ISO format) | `"1990-01-01"` |
| `country` | string | Country | `"Saudi Arabia"` |
| `city` | string | City | `"Riyadh"` |
| `district` | string | District/neighborhood | `"Al Olaya"` |
| `university` | string | University name | `"King Saud University"` |
| `major` | string | Field of study | `"Computer Science"` |
| `graduation_year` | string | Graduation year | `"2024"` |
| `blood_type` | string | Blood type | `"O+"`, `"A-"`, etc. |
| `phone` | string | Phone number | `"+1234567890"` |

---

**Document Version**: 1.0  
**Last Updated**: February 5, 2026  
**API Version**: v1
