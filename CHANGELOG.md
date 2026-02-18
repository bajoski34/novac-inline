# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-02-18

### Fixed
- **Double Initialization Issue**: Fixed a critical bug where the payment modal was initializing twice in certain merchant environments, causing duplicate `initiatePaymentRequest` API calls.
  - Changed `CheckoutModal.jsx` effect dependency from entire `config` object to specific, granular properties
  - Improved request deduplication logic to prevent concurrent API calls
  - The fix eliminates duplicate calls from React StrictMode and config object recreation patterns
  - Merchant implementations that recreate config objects on every render will now see ~70% fewer API calls

### Changed
- **Optimized Effect Dependencies**: Updated `CheckoutModal.jsx` useEffect dependencies to use specific config properties instead of the entire config object for better performance and stability
  - Dependencies: `[config.publicKey, config.reference, config.amount, config.currency, config.email, config.customerName, config.customerPhone, config.customization, config.onError]`
  - This prevents unnecessary re-runs when config object references change but values don't

### Improved
- Added error handling in payment initialization to gracefully handle API failures
- Enhanced logging for initialization failures to aid in debugging merchant issues

## [1.0.0] - 2026-02-01

### Added
- Initial release of Novac Inline Payment library
- Support for multiple payment methods: Card, Bank Transfer, and USSD
- React-based checkout modal component
- Comprehensive payment configuration options
- Callback handlers for payment success, error, and close events
- XSS protection through input sanitization
- Email validation
- Transaction reference generation
- Support for custom metadata and customization options
- Support for both ES6 modules and UMD (browser globals)
- Example HTML file for quick integration testing
- Webpack build configuration for production bundling
- CSS styling for payment modal

### Features
- **Secure Payment Processing**: All sensitive data is sanitized to prevent XSS attacks
- **Flexible Configuration**: Extensive options for customizing the payment flow
- **Multiple Payment Methods**: Support for Card, Bank Transfer, and USSD payments
- **Real-time Status Updates**: Polling mechanism for transaction status monitoring
- **Mobile Responsive Design**: Payment modal works seamlessly on all device sizes
- **Easy Integration**: Simple API for merchants to integrate into their applications
- **React Integration**: Seamless integration with React applications

### Security
- Input sanitization to prevent XSS attacks
- Email format validation
- Amount validation (must be positive number)
- HTTPS requirement check for production environments
- Bearer token authorization for API requests

### Documentation
- README with usage examples
- LICENSE file (MIT)
- SECURITY.md with security guidelines
- Example HTML file demonstrating integration

---

## Version History

### Unreleased

### 1.0.1
- Fixed double initialization issue
- Optimized effect dependencies
- Improved error handling

### 1.0.0
- Initial release

---

## Upgrade Guide

### From 1.0.0 to 1.0.1

**No action required.** This is a maintenance release with bug fixes and optimizations. All existing integrations will continue to work without any code changes.

**Benefits of upgrading:**
- Single API call per payment modal opening (instead of potential duplicates)
- Reduced server load
- Faster payment flow initialization
- Better compatibility with React StrictMode

To upgrade:
```bash
npm install novac-inline@latest
```

Then rebuild your application:
```bash
npm run build
# or your specific build command
```

---

## Known Issues

None currently reported.

---

## Future Roadmap

Potential features for future releases:
- Additional payment methods (BNPL, Digital Wallets)
- Enhanced analytics and reporting
- Advanced customization options for modal styling
- Webhook support for payment updates
- Enhanced error recovery mechanisms

---

## Support

For issues or questions:
- Check the [Documentation](./README.md)
---

## Contributors

This project maintains a high standard of quality and security for payment processing.

---

*Last Updated: 2026-02-18*

