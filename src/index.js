/**
 * Novac Inline Payment Script
 * Main entry point for the inline payment integration
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import CheckoutModal from './components/CheckoutModal';
import './styles/main.css';

class Novac {
  constructor(config) {
    this.config = this.validateConfig(config);
    this.modalRoot = null;
    this.root = null;
  }

  /**
   * Validate configuration object
   */
  validateConfig(config) {
    if (!config) {
      throw new Error('Configuration is required');
    }

    const required = ['publicKey', 'email', 'amount', 'customerName', 'customization'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(config.email)) {
      throw new Error('Invalid email format');
    }

    // Validate amount
    if (typeof config.amount !== 'number' || config.amount <= 0) {
      throw new Error('Amount must be a positive number');
    }

    // Sanitize inputs to prevent XSS
    return {
      publicKey: this.sanitize(config.publicKey),
      email: this.sanitize(config.email),
      amount: config.amount,
      currency: config.currency || 'NGN',
      reference: config.reference || this.generateReference(),
      customerName: config.customerName ? this.sanitize(config.customerName) : '',
      redirectUrl: config.redirectUrl || '',
      customerPhone: config.customerPhone ? this.sanitize(config.customerPhone) : '',
      metadata: config.metadata || {},
      onSuccess: config.onSuccess || (() => {}),
      onError: config.onError || (() => {}),
      onClose: config.onClose || (() => {}),
      paymentMethods: config.paymentMethods || ['card', 'bank_transfer', 'ussd'],
      customization: config.customization || {}
    };
  }

  /**
   * Sanitize input to prevent XSS attacks
   */
  sanitize(input) {
    if (typeof input !== 'string') return input;
    
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * Generate unique reference for transaction
   */
  generateReference() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `NOVAC_${timestamp}_${random}`;
  }

  /**
   * Open the checkout modal
   */
  open() {
    // Ensure HTTPS in production
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.warn('Novac Inline: HTTPS is recommended for production environments');
    }

    // Create modal container
    this.modalRoot = document.createElement('div');
    this.modalRoot.id = 'novac-inline-modal';
    document.body.appendChild(this.modalRoot);

    // Render React component
    this.root = createRoot(this.modalRoot);
    this.root.render(
      <CheckoutModal
        config={this.config}
        onClose={this.close.bind(this)}
      />
    );

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close the checkout modal
   */
  close() {
    if (this.root) {
      this.root.unmount();
    }
    
    if (this.modalRoot && this.modalRoot.parentNode) {
      this.modalRoot.parentNode.removeChild(this.modalRoot);
    }

    // Restore body scroll
    document.body.style.overflow = '';

    // Call onClose callback
    if (this.config && this.config.onClose) {
      if(this.config.redirectUrl) {
        window.location.href = this.config.redirectUrl;
      }
      this.config.onClose();
    }
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Novac;
}

if (typeof window !== 'undefined') {
  window.Novac = Novac;
}

export default Novac;
