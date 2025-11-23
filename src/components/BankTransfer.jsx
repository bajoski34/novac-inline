import React, { useState, useEffect, useCallback } from 'react';
import { makePaymentRequest } from '../utils/api';

const BankTransfer = ({ config, onSuccess, onError, isProcessing, setIsProcessing }) => {
  const [transferDetails, setTransferDetails] = useState(null);
  const [copied, setCopied] = useState(false);

  const initiateBankTransfer = useCallback(async () => {
    setIsProcessing(true);

    try {
      const payload = {
        publicKey: config.publicKey,
        email: config.email,
        amount: config.amount,
        currency: config.currency,
        reference: config.reference,
        paymentMethod: 'bank_transfer',
        metadata: config.metadata
      };

      const response = await makePaymentRequest(payload);
      
      // Simulate bank transfer details from API response
      setTransferDetails({
        accountNumber: response.accountNumber || '0123456789',
        accountName: response.accountName || 'Novac Payment Limited',
        bankName: response.bankName || 'Access Bank',
        amount: config.amount,
        reference: config.reference
      });

      setIsProcessing(false);
    } catch (error) {
      setIsProcessing(false);
      onError({
        message: error.message || 'Failed to generate transfer details',
        type: 'bank_transfer_error'
      });
    }
  }, [config, onError, setIsProcessing]);

  useEffect(() => {
    initiateBankTransfer();
  }, [initiateBankTransfer]);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(field);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // Fallback for browsers that don't support clipboard API
        alert('Copy failed. Please copy manually.');
      });
  };

  const handleConfirmPayment = () => {
    // In production, this would verify payment status with the API
    onSuccess({
      reference: config.reference,
      status: 'pending',
      message: 'Payment initiated. Awaiting confirmation.'
    });
  };

  if (isProcessing) {
    return (
      <div className="novac-loading">
        <div className="novac-spinner"></div>
        <p>Generating transfer details...</p>
      </div>
    );
  }

  if (!transferDetails) {
    return (
      <div className="novac-error-state">
        <p>Unable to generate transfer details. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="novac-bank-transfer">
      <div className="novac-info-box">
        <p className="novac-info-text">
          Transfer <strong>{config.currency} {config.amount.toLocaleString()}</strong> to the account below
        </p>
      </div>

      <div className="novac-transfer-details">
        <div className="novac-detail-item">
          <label className="novac-detail-label">Bank Name</label>
          <div className="novac-detail-value">
            <span>{transferDetails.bankName}</span>
          </div>
        </div>

        <div className="novac-detail-item">
          <label className="novac-detail-label">Account Number</label>
          <div className="novac-detail-value">
            <span>{transferDetails.accountNumber}</span>
            <button
              className="novac-copy-btn"
              onClick={() => copyToClipboard(transferDetails.accountNumber, 'account')}
              title="Copy account number"
            >
              {copied === 'account' ? '✓' : '📋'}
            </button>
          </div>
        </div>

        <div className="novac-detail-item">
          <label className="novac-detail-label">Account Name</label>
          <div className="novac-detail-value">
            <span>{transferDetails.accountName}</span>
          </div>
        </div>

        <div className="novac-detail-item">
          <label className="novac-detail-label">Amount</label>
          <div className="novac-detail-value">
            <span>{config.currency} {config.amount.toLocaleString()}</span>
            <button
              className="novac-copy-btn"
              onClick={() => copyToClipboard(config.amount.toString(), 'amount')}
              title="Copy amount"
            >
              {copied === 'amount' ? '✓' : '📋'}
            </button>
          </div>
        </div>

        <div className="novac-detail-item">
          <label className="novac-detail-label">Reference</label>
          <div className="novac-detail-value">
            <span className="novac-reference">{transferDetails.reference}</span>
            <button
              className="novac-copy-btn"
              onClick={() => copyToClipboard(transferDetails.reference, 'reference')}
              title="Copy reference"
            >
              {copied === 'reference' ? '✓' : '📋'}
            </button>
          </div>
        </div>
      </div>

      <div className="novac-warning-box">
        <p className="novac-warning-text">
          ⚠️ Please use the reference code when making the transfer. Payment confirmation may take 10-30 minutes.
        </p>
      </div>

      <button
        type="button"
        className="novac-submit-btn"
        onClick={handleConfirmPayment}
      >
        I have completed the transfer
      </button>
    </div>
  );
};

export default BankTransfer;
