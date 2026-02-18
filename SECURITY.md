# Security Policy

## Security Features

Novac Inline implements several security measures to protect payment data and prevent vulnerabilities:

### 1. Input Sanitization

All user inputs are automatically sanitized to prevent XSS (Cross-Site Scripting) attacks:

```javascript
// Inputs are sanitized before processing
sanitize(input) {
  if (typeof input !== 'string') return input;
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}
```

### 2. HTTPS Enforcement

The library warns when used over HTTP in production environments:

```javascript
if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
  console.warn('Novac Inline: HTTPS is recommended for production environments');
}
```

### 3. Validation

- **Card Number**: Luhn algorithm validation
- **CVV**: 3-4 digit validation
- **Expiry Date**: Format and expiration validation
- **Email**: RFC-compliant email validation

### 4. Content Security Policy

Recommended CSP headers for your website:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self' https://api.novacpayment.com; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline';">
```

### 5. Sensitive Data Handling

- Card details are never stored in browser storage
- All payment data is transmitted securely over HTTPS
- No sensitive data logged to console in production
- Payment forms use autocomplete attributes appropriately

### 6. PCI-DSS Compliance

- Card data is not stored locally
- All card transactions are tokenized
- Secure communication with payment gateway
- No card details in URLs or logs

## Reporting a Vulnerability

If you discover a security vulnerability within Novac Inline, please send an email to security@novacpayment.com. All security vulnerabilities will be promptly addressed.

Please include:

- Type of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

**Do not** disclose the vulnerability publicly until it has been addressed.

## Security Best Practices for Implementers

### 1. Use HTTPS

Always serve your website over HTTPS in production:

```javascript
// The library will warn if not using HTTPS
if (window.location.protocol !== 'https:') {
  // Warning will be logged
}
```

### 2. Verify Payments on Your Backend

Never trust client-side success callbacks alone:

```javascript
onSuccess: function(response) {
  // Always verify on your server
  fetch('/api/verify-payment', {
    method: 'POST',
    body: JSON.stringify({ reference: response.reference })
  });
}
```

### 3. Keep Your Public Key Secure

- Never commit your public key to public repositories
- Use environment variables for keys
- Rotate keys periodically

```javascript
// Use environment variables
const publicKey = process.env.NOVAC_PUBLIC_KEY;
```

### 4. Implement Rate Limiting

Add rate limiting to prevent abuse:

```javascript
// Example: Limit payment attempts
let attemptCount = 0;
const maxAttempts = 5;

if (attemptCount >= maxAttempts) {
  alert('Too many attempts. Please try again later.');
  return;
}
```

### 5. Validate on Backend

Always validate transaction amounts and details on your server:

```javascript
// Server-side validation
app.post('/api/verify-payment', async (req, res) => {
  const { reference } = req.body;
  
  // Verify with Novac API
  const verified = await novac.verifyPayment(reference);
  
  // Check amount matches expected amount
  if (verified.amount !== expectedAmount) {
    return res.status(400).json({ error: 'Amount mismatch' });
  }
  
  res.json({ success: true });
});
```

### 6. Use Content Security Policy

Implement strict CSP headers to prevent XSS:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://trusted-cdn.com; 
               style-src 'self' 'unsafe-inline';">
```

### 7. Monitor for Suspicious Activity

- Log all payment attempts
- Monitor for unusual patterns
- Set up alerts for failed attempts
- Track refund requests

## Security Updates

Security updates will be released as patch versions. Always keep your installation up to date:

```bash
npm update novac-inline
```

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Security Testing

We regularly perform:

- Static code analysis
- Dependency vulnerability scanning
- Penetration testing
- Code reviews

## Third-Party Dependencies

We carefully vet all third-party dependencies and:

- Regularly update to latest secure versions
- Monitor for security advisories
- Use tools like npm audit

```bash
npm audit
```

## Compliance

Novac Inline follows:

- PCI-DSS requirements
- OWASP security guidelines
- GDPR data protection standards
- Industry best practices

## Contact

For security concerns, contact: security@novacpayment.com

For general support: support@novacpayment.com