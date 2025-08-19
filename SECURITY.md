# Security Hardening Implementation

This document outlines the security measures implemented in the Orenna API to protect against common web vulnerabilities.

## Security Features Implemented

### 1. Content Security Policy (CSP)
- **Location**: `apps/api/src/plugins/security.ts`
- **Features**:
  - Strict CSP headers to prevent XSS attacks
  - Whitelisted sources for scripts, styles, and other resources
  - Blocks inline scripts and styles (except where necessary for Swagger UI)
  - Upgrade insecure requests in production

### 2. Rate Limiting
- **Location**: `apps/api/src/plugins/security.ts`
- **Features**:
  - 100 requests per minute per IP
  - Configurable time window
  - Custom error responses with retry information

### 3. Security Headers
- **Helmet Integration**: Comprehensive security header management
- **Custom Headers**:
  - `X-Content-Type-Options: nosniff`
  - `X-Download-Options: noopen`
  - `X-Permitted-Cross-Domain-Policies: none`
  - Cache control for sensitive endpoints
  - Server header obfuscation

### 4. Input Validation & Sanitization
- **Location**: `apps/api/src/plugins/validation.ts`
- **Features**:
  - Zod schema validation for all inputs
  - XSS prevention through input sanitization
  - Ethereum address format validation
  - Transaction hash validation
  - Safe string validation (removes dangerous characters)

### 5. XSS Protection
- **Location**: `apps/api/src/utils/security.ts`
- **Features**:
  - HTML entity encoding for output
  - JSON response sanitization
  - Script injection prevention
  - Event handler removal

### 6. Enhanced Authentication Security
- **Location**: `apps/api/src/routes/auth.ts`
- **Features**:
  - Strict input validation for SIWE messages
  - Signature format validation
  - Domain and origin validation
  - Secure cookie configuration

## Security Utilities

### HTML Encoding
```typescript
htmlEncode(str: string): string
```
Encodes dangerous HTML characters to prevent XSS.

### JSON Response Sanitization
```typescript
sanitizeJsonResponse(data: any): any
secureJsonResponse(reply: FastifyReply, data: any, statusCode?: number)
```
Sanitizes JSON responses and sets secure headers.

### URL Validation
```typescript
isValidUrl(url: string): boolean
```
Validates URLs and blocks dangerous protocols and private networks in production.

### Email Validation
```typescript
isValidEmail(email: string): boolean
```
Validates email format with additional security checks.

## Configuration

### Environment Variables
Security features are configured through environment variables:
- `NODE_ENV`: Enables production-specific security measures
- `API_CORS_ORIGIN`: Configures CORS allowed origins
- `SIWE_DOMAIN`: Validates SIWE message domains
- `SIWE_ORIGIN`: Validates SIWE message origins

### CSP Configuration
The CSP policy can be customized in `apps/api/src/plugins/security.ts`:
- Modify `contentSecurityPolicy.directives` for different source allowlists
- Adjust based on frontend requirements

## Testing
Security features are tested in `apps/api/tests/security.test.ts`:
- HTML encoding validation
- JSON sanitization
- Input validation
- URL and email validation

## Best Practices Implemented

1. **Defense in Depth**: Multiple layers of security controls
2. **Input Validation**: All user inputs are validated and sanitized
3. **Output Encoding**: All responses are properly encoded
4. **Secure Headers**: Comprehensive security headers are set
5. **Rate Limiting**: Protection against brute force and DoS attacks
6. **HTTPS Enforcement**: Secure transport in production
7. **Cookie Security**: HTTPOnly, Secure, and SameSite flags

## Monitoring and Maintenance

- Security headers should be reviewed regularly
- Rate limits may need adjustment based on usage patterns
- CSP violations should be monitored in production
- Security tests should be run with every deployment

## Additional Recommendations

1. **WAF**: Consider implementing a Web Application Firewall
2. **Security Scanning**: Regular vulnerability assessments
3. **Dependency Updates**: Keep all dependencies updated
4. **Security Headers Testing**: Use tools like securityheaders.com
5. **Penetration Testing**: Regular security testing by professionals