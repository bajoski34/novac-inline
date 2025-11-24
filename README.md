# Novac Inline Payment

A JavaScript inline script for seamless Novac payment integration with custom checkout. Built with React, this library provides a secure and customizable payment experience with support for multiple payment methods.

## Features

✓ **Multiple Payment Methods**
- Card Payments (Visa, Mastercard, Verve)
- Bank Transfer
- USSD Payments

✓ **Security First**
- Input sanitization to prevent XSS attacks
- HTTPS validation
- Secure API communication
- PCI-DSS compliant card handling

✓ **Beautiful UI**
- Matches Novac pre-built checkout design
- Mobile responsive
- Smooth animations
- Accessibility compliant

✓ **Easy Integration**
- Simple JavaScript API
- Works with any website
- Minimal setup required
- Comprehensive callbacks

## Installation

### Via NPM

```bash
npm install novac-inline
```

### Via CDN

```html
<script src="https://unpkg.com/novac-inline@latest/dist/novac-inline.js"></script>
```

### Via Direct Download

Download `dist/novac-inline.js` and include it in your HTML:

```html
<script src="path/to/novac-inline.js"></script>
```

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
  <title>Payment Example</title>
</head>
<body>
  <button id="payButton">Pay Now</button>

  <script src="dist/novac-inline.js"></script>
  <script>
    document.getElementById('payButton').addEventListener('click', function() {
      const payment = new Novac({
        publicKey: 'pk_test_your_public_key',
        email: 'customer@example.com',
        amount: 15000,
        currency: 'NGN',
        
        onSuccess: function(response) {
          console.log('Payment successful:', response);
        },
        
        onError: function(error) {
          console.error('Payment failed:', error);
        },
        
        onClose: function() {
          console.log('Payment modal closed');
        }
      });

      payment.open();
    });
  </script>
</body>
</html>
```

## Configuration Options

### Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `publicKey` | string | Your Novac public key |
| `email` | string | Customer's email address |
| `amount` | number | Amount to charge (in minor units) |

### Optional Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `currency` | string | `'NGN'` | Currency code (NGN, USD, GBP, EUR) |
| `reference` | string | Auto-generated | Unique transaction reference |
| `customerName` | string | `''` | Customer's full name |
| `customerPhone` | string | `''` | Customer's phone number |
| `redirectUrl` | string | `''` | Redirect Url |
| `metadata` | object | `{}` | Custom data to attach to transaction |
| `customization` | object | `{}` | Customization options (e.g., title, description, logo) |
| `paymentMethods` | array | `['card', 'bank_transfer', 'ussd']` | Available payment methods |
| `onSuccess` | function | `() => {}` | Callback when payment succeeds |
| `onError` | function | `() => {}` | Callback when payment fails |
| `onClose` | function | `() => {}` | Callback when modal closes |

## Usage Examples

### Basic Payment

```javascript
const payment = new Novac({
  publicKey: 'pk_test_xxxxxxxxxxxxx',
  email: 'customer@example.com',
  amount: 50000,
  currency: 'NGN'
});

payment.open();
```

### With Customer Details

```javascript
const payment = new Novac({
  publicKey: 'pk_test_xxxxxxxxxxxxx',
  email: 'customer@example.com',
  amount: 50000,
  currency: 'NGN',
  customerName: 'John Doe',
  customerPhone: '+2348012345678',
  reference: 'ORDER_12345'
});

payment.open();
```

### Custom Payment Methods

```javascript
const payment = new Novac({
  publicKey: 'pk_test_xxxxxxxxxxxxx',
  email: 'customer@example.com',
  amount: 50000,
  paymentMethods: ['card', 'ussd'] // Only show card and USSD
});

payment.open();
```

### With Metadata

```javascript
const payment = new Novac({
  publicKey: 'pk_test_xxxxxxxxxxxxx',
  email: 'customer@example.com',
  amount: 50000,
  metadata: {
    orderId: '12345',
    productName: 'Premium Subscription',
    userId: '67890'
  }
});

payment.open();
```

### Handling Callbacks

```javascript
const payment = new Novac({
  publicKey: 'pk_test_xxxxxxxxxxxxx',
  email: 'customer@example.com',
  amount: 50000,
  
  onSuccess: function(response) {
    // Payment successful - verify on your backend
    console.log('Transaction Reference:', response.reference);
    console.log('Transaction ID:', response.transactionId);
    
    // Verify payment on your server
    fetch('/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference: response.reference })
    })
    .then(res => res.json())
    .then(data => {
      if (data.verified) {
        // Update UI and grant access
        alert('Payment verified! Thank you.');
      }
    });
  },
  
  onError: function(error) {
    // Payment failed
    console.error('Error type:', error.type);
    console.error('Error message:', error.message);
    alert('Payment failed: ' + error.message);
  },
  
  onClose: function() {
    // Modal was closed
    console.log('User closed payment modal');
  }
});

payment.open();
```

## Payment Methods

### Card Payment

Supports all major card types:
- Visa
- Mastercard
- Verve
- American Express
- Discover

Features:
- Real-time card validation
- Luhn algorithm verification
- CVV and expiry validation
- Card type detection
- Auto-formatting for better UX

### Bank Transfer

Features:
- Instant account generation
- Copy-to-clipboard functionality
- Reference tracking
- Payment confirmation

### USSD Payment

Supported banks:
- GTBank (*737#)
- Access Bank (*901#)
- Zenith Bank (*966#)
- UBA (*919#)
- First Bank (*894#)
- Fidelity Bank (*770#)
- Sterling Bank (*822#)
- Unity Bank (*7799#)
- Wema Bank (*945#)
- Polaris Bank (*833#)

## Security Considerations

### Input Sanitization

All user inputs are automatically sanitized to prevent XSS attacks:

```javascript
// Inputs are sanitized before processing
const sanitized = payment.sanitize(userInput);
```

### HTTPS Enforcement

The library warns when used over HTTP in production:

```javascript
// Automatically checks protocol
if (window.location.protocol !== 'https:' && !isLocalhost) {
  console.warn('HTTPS is required in production');
}
```

### Content Security Policy

Recommended CSP headers:

```html
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' https://api.novacpayment.com; img-src 'self' https://api.novacpayment.com https://*.novacpayment.com;; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

### Sensitive Data Handling

- Card details are never stored locally
- All payment data is transmitted securely
- PCI-DSS compliant implementation
- No sensitive data in console logs

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Development build with watch
npm run dev

# Production build
npm run build

# Run linter
npm run lint

# Run tests
npm test
```

### Project Structure

```
novac-inline/
├── src/
│   ├── index.js                  # Main entry point
│   ├── components/
│   │   ├── CheckoutModal.jsx     # Main modal component
│   │   ├── CardPayment.jsx       # Card payment form
│   │   ├── BankTransfer.jsx      # Bank transfer component
│   │   └── UssdPayment.jsx       # USSD payment component
│   ├── utils/
│   │   ├── api.js                # API utilities
│   │   ├── validation.js         # Validation functions
│   │   └── helpers.js            # Helper functions
│   └── styles/
│       └── main.css              # Styles
├── dist/
│   └── novac-inline.js           # Built bundle
├── example.html                   # Usage example
├── package.json
├── webpack.config.js
└── README.md
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## API Reference

### NovacInline Class

#### Constructor

```javascript
new NovacInline(config)
```

Creates a new payment instance with the provided configuration.

#### Methods

##### `open()`

Opens the payment modal.

```javascript
payment.open();
```

##### `close()`

Closes the payment modal.

```javascript
payment.close();
```

## Response Objects

### Success Response

```javascript
{
  status: 'success',
  reference: 'NOVAC_1234567890_abc',
  transactionId: 'TXN_1234567890_xyz',
  message: 'Payment successful',
  amount: 50000,
  currency: 'NGN'
}
```

### Error Response

```javascript
{
  message: 'Card declined',
  type: 'card_error'
}
```

Error types:
- `card_error` - Card payment failed
- `bank_transfer_error` - Bank transfer issue
- `ussd_error` - USSD generation failed
- `validation_error` - Invalid input
- `network_error` - Network issue

## Testing

Use test keys for development:

```javascript
const payment = new NovacInline({
  publicKey: 'pk_test_xxxxxxxxxxxxx', // Test key
  email: 'test@example.com',
  amount: 1000
});
```

Test card numbers:
- Success: `4111111111111111`
- Decline: `4000000000000002`
- Insufficient funds: `4000000000009995`

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linter and tests
6. Submit a pull request

## Support

For support, email support@novacpayment.com or visit our [documentation](https://developer.novacpayment.com).

## License

MIT License - see LICENSE file for details

## Acknowledgments

Built with React and modern web technologies. Designed to match the Novac pre-built checkout experience.
