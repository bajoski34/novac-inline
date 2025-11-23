import React, { useState } from 'react';
import { makePaymentRequest } from '../utils/api';

const UssdPayment = ({ config, onSuccess, onError, isProcessing, setIsProcessing }) => {
  const [selectedBank, setSelectedBank] = useState('');
  const [ussdCode, setUssdCode] = useState('');
  const [showCode, setShowCode] = useState(false);

  const banks = [
    { id: 'gtb', name: 'GTBank', ussdCode: '*737*' },
    { id: 'access', name: 'Access Bank', ussdCode: '*901*' },
    { id: 'zenith', name: 'Zenith Bank', ussdCode: '*966*' },
    { id: 'uba', name: 'UBA', ussdCode: '*919*' },
    { id: 'first', name: 'First Bank', ussdCode: '*894*' },
    { id: 'fidelity', name: 'Fidelity Bank', ussdCode: '*770*' },
    { id: 'sterling', name: 'Sterling Bank', ussdCode: '*822*' },
    { id: 'unity', name: 'Unity Bank', ussdCode: '*7799*' },
    { id: 'wema', name: 'Wema Bank', ussdCode: '*945*' },
    { id: 'polaris', name: 'Polaris Bank', ussdCode: '*833*' }
  ];

  const handleBankSelect = async (bank) => {
    setSelectedBank(bank.id);
    setIsProcessing(true);

    try {
      const payload = {
        publicKey: config.publicKey,
        email: config.email,
        amount: config.amount,
        currency: config.currency,
        reference: config.reference,
        paymentMethod: 'ussd',
        bankCode: bank.id,
        metadata: config.metadata
      };

      const response = await makePaymentRequest(payload);
      
      // Generate USSD code
      const code = `${bank.ussdCode}${response.paymentCode || '000'}*${config.amount}#`;
      setUssdCode(code);
      setShowCode(true);
      setIsProcessing(false);
    } catch (error) {
      setIsProcessing(false);
      onError({
        message: error.message || 'Failed to generate USSD code',
        type: 'ussd_error'
      });
    }
  };

  const handleConfirmPayment = () => {
    // In production, this would poll the API to check payment status
    onSuccess({
      reference: config.reference,
      status: 'pending',
      message: 'USSD payment initiated. Please complete on your device.'
    });
  };

  const copyUssdCode = () => {
    navigator.clipboard.writeText(ussdCode)
      .then(() => {
        // Success feedback could be added here
      })
      .catch(() => {
        // Fallback for browsers that don't support clipboard API
        alert('Copy failed. Please write down the code manually.');
      });
  };

  if (showCode) {
    return (
      <div className="novac-ussd-code">
        <div className="novac-info-box">
          <p className="novac-info-text">
            Dial the USSD code below on your registered phone number
          </p>
        </div>

        <div className="novac-ussd-display">
          <div className="novac-code-box">
            <span className="novac-code-text">{ussdCode}</span>
            <button
              className="novac-copy-btn"
              onClick={copyUssdCode}
              title="Copy USSD code"
            >
              📋
            </button>
          </div>
        </div>

        <div className="novac-ussd-instructions">
          <h4 className="novac-instructions-title">How to complete payment:</h4>
          <ol className="novac-instructions-list">
            <li>Dial the USSD code above on your phone</li>
            <li>Follow the prompts on your device</li>
            <li>Enter your PIN to authorize the payment</li>
            <li>You will receive a confirmation message</li>
          </ol>
        </div>

        <div className="novac-button-group">
          <button
            type="button"
            className="novac-secondary-btn"
            onClick={() => {
              setShowCode(false);
              setSelectedBank('');
            }}
          >
            Choose Another Bank
          </button>
          <button
            type="button"
            className="novac-submit-btn"
            onClick={handleConfirmPayment}
          >
            I have completed payment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="novac-ussd-payment">
      <div className="novac-info-box">
        <p className="novac-info-text">
          Select your bank to generate USSD code
        </p>
      </div>

      <div className="novac-bank-list">
        {banks.map(bank => (
          <button
            key={bank.id}
            className={`novac-bank-item ${selectedBank === bank.id ? 'selected' : ''}`}
            onClick={() => handleBankSelect(bank)}
            disabled={isProcessing}
          >
            <span className="novac-bank-icon">🏦</span>
            <span className="novac-bank-name">{bank.name}</span>
          </button>
        ))}
      </div>

      {isProcessing && (
        <div className="novac-loading">
          <div className="novac-spinner"></div>
          <p>Generating USSD code...</p>
        </div>
      )}
    </div>
  );
};

export default UssdPayment;
