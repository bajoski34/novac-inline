import React, {useEffect, useState} from 'react';
import CardPayment from './CardPayment';
import BankTransfer from './BankTransfer';
import UssdPayment from './UssdPayment';
import { formatAmount } from '../utils/helpers';
import {generateTransactionId, initiatePaymentRequest} from "../utils/api";
import {Toaster} from "react-hot-toast";
import ConfirmTransaction from "./ConfirmTransaction";

const CheckoutModal = ({ config, onClose }) => {
  const [activeTab, setActiveTab] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [initialResponse, setInitialResponse] = useState(null);
  const [startVerifying, setStartVerifying] = useState(false);

  const tabs = [];
  
  if (config.paymentMethods.includes('card')) {
    tabs.push({ id: 'card', label: 'Card', icon: '💳' });
  }
  if (config.paymentMethods.includes('bank_transfer')) {
    tabs.push({ id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' });
  }
  if (config.paymentMethods.includes('ussd')) {
    tabs.push({ id: 'ussd', label: 'USSD', icon: '📱' });
  }

  const handlePaymentSuccess = (response) => {
    setIsProcessing(false);
    if (config.redirectUrl) {
      handleRedirect()
    }
    config.onSuccess(response);
    setTimeout(() => onClose(), 1500);
  };

  const handlePaymentError = (error) => {
    setIsProcessing(false);
    config.onError(error);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isProcessing) {
      onClose();
    }
  };

  const handleRedirect = () => {

    if(!config.redirectUrl) return;

    if (!config.redirectUrl.startsWith('https://') && config.redirectUrl.startsWith('http://')) {
      config.redirectUrl = config.redirectUrl.replace('http://', 'https://');

      const redirectOptions = new XMLHttpRequest();
      redirectOptions.open('OPTIONS', config.redirectUrl, false);
      redirectOptions.send();

      if (redirectOptions.status !== 200) {
        console.error('Invalid redirectUrl. Please check your configuration.');
        return;
      }
    }

    if (config.redirectUrl) {
      window.location.href = config.redirectUrl + '?transactionReference=' + initialResponse?.data?.transactionReference + '&status=success';
    }
  }

  useEffect(async () => {
    const full_name = (config.customerName || '').split(' ');
    const initiateResponse = await initiatePaymentRequest({
      publicKey: config.publicKey,
      transactionReference: config.reference || generateTransactionId(),
      amount: config.amount,
      currency: config.currency,
      redirectUrl: config.redirectUrl,
      checkoutCustomerData: {
        email: config.email,
        firstName: full_name[0] || 'Anonymous',
        lastName: full_name[1] || 'Anonymous',
        phoneNumber: config.customerPhone || ''
      },
      checkoutCustomizationData: {
        logoUrl: config.customization?.logoUrl || '',
        checkoutModalTitle: config.customization?.title || 'Novac Payment',
        paymentDescription: config.customization?.description || 'Complete your payment securely'
      }
    });
    setInitialResponse(initiateResponse);
  }, [config]);

  return (
    <div className="novac-modal-overlay" onClick={handleOverlayClick}>
      <div><Toaster position="top-right" /></div>
      {/* Test Environment Banner */}
      { config.publicKey.startsWith('nc_testpk_') && <div className="novac-test-banner">
        <span className="novac-test-banner-icon">⚠️</span>
        <span className="novac-test-banner-text">
            You are currently in test environment, all transactions are for testing purposes only!
          </span>
      </div>}
      <div className="novac-modal">

        <div className="novac-modal-header" style={{ background: `${ config.customization?.background || '#EEEDFD' }`, color: `${ config.customization?.color || '#15142B' }`  }}>
          <div className="novac-header-content">
            <p className="novac-amount" style={{ color: `${ config.customization?.color || '#15142B' }` }}>{formatAmount(config.amount, config.currency)}</p>
            <h2 className="novac-title" style={{ color: `${ config.customization?.color || '#15142B' }` }}>{ config.customization?.title || 'Payment Modal' }</h2>
            <p className="novac-email" style={{ color: `${ config.customization?.color || '#15142B' }` }}>{config.email}</p>
          </div>
          <button
            className="novac-close-btn"
            onClick={config.redirectUrl ? handleRedirect :onClose}
            disabled={isProcessing}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {startVerifying && (
            <ConfirmTransaction
                reference={initialResponse?.data?.transactionReference || undefined}
                publicKey={config.publicKey}
                onClose={onClose}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                time_taken={60.5}
                onRetry={() => setStartVerifying(false)}
            />
        )}

        {/*{initialResponse && initialResponse.data && initialResponse.data.reference && !startVerifying && (*/}
        {/*    <div className="novac-verify-container">*/}
        {/*      Payment Reference: <span className="novac-reference">{initialResponse.data.reference}</span> <button className="novac-verify-btn" onClick={() => setStartVerifying(true)}>Verify</button>*/}
        {/*    </div>*/}
        {/*)}*/}
        {!startVerifying && ( <div className="novac-tabs">
          { !startVerifying && tabs.map(tab => (
            <button
              key={tab.id}
              className={`novac-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => !isProcessing && setActiveTab(tab.id)}
              disabled={isProcessing}
            >
              <span className="novac-tab-icon">{tab.icon}</span>
              <span className="novac-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>)}

        { !startVerifying && <div className="novac-tab-content">
          { !startVerifying && activeTab === 'card' && (
            <CardPayment
              config={config}
              onSuccess={setStartVerifying}
              onError={handlePaymentError}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              initialResponse={initialResponse}
            />
          )}
          { !startVerifying && activeTab === 'bank_transfer' && (
            <BankTransfer
              config={config}
              onSuccess={setStartVerifying}
              onError={handlePaymentError}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              initialResponse={initialResponse}
            />
          )}
          { !startVerifying && activeTab === 'ussd' && (
            <UssdPayment
              config={config}
              onSuccess={setStartVerifying}
              onError={handlePaymentError}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              initialResponse={initialResponse}
            />
          )}
        </div>}

      </div>

      <div className="novac-security-badge">
        <span className="novac-lock-icon">🔒</span>
        <span className="novac-security-text">Secured by Novac Payment</span>
      </div>
    </div>
  );
};

export default CheckoutModal;
