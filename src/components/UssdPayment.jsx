import React, {useEffect, useState} from 'react';
import {getUssdBanks, makePaymentRequest} from '../utils/api';
import {toast} from "react-hot-toast";

const UssdPayment = ({ config, onSuccess, onError, isProcessing, setIsProcessing, initialResponse }) => {
  const [selectedBank, setSelectedBank] = useState('');
  const [ussdCode, setUssdCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [banks, setBanks] = useState(sessionStorage.getItem('novac-ussd-banks') ? JSON.parse(sessionStorage.getItem('novac-ussd-banks')) :[]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksError, setBanksError] = useState('');

  // Fetch banks when publicKey becomes available
  useEffect(() => {
    let mounted = true;
    const loadBanks = async () => {
      setBanksError('');
      if (!config || !config.publicKey) return;
      setBanksLoading(true);
      try {
        const res = await getUssdBanks(config.publicKey);

        // API may return different shapes: array, { data: [...] }, { banks: [...] }, { data: { banks: [...] } }
        // Also handle res.data.bankDetails which is the shape you provided
        let list = [];
        if (Array.isArray(res)) {
          list = res;
        } else if (Array.isArray(res?.data?.bankDetails)) {
          list = res.data.bankDetails;
        } else if (Array.isArray(res?.data)) {
          list = res.data;
        } else if (Array.isArray(res?.data?.banks)) {
          list = res.data.banks;
        } else if (Array.isArray(res?.banks)) {
          list = res.banks;
        } else if (res && typeof res === 'object') {
          // try to find an array value inside the object (one level deep)
          const possible = Object.values(res).find(v => Array.isArray(v));
          if (Array.isArray(possible)) list = possible;
          // also try nested data object
          if (!list.length && res.data && typeof res.data === 'object') {
            const nested = Object.values(res.data).find(v => Array.isArray(v));
            if (Array.isArray(nested)) list = nested;
          }
        }

        // Normalize each bank to { key, name, ussd }
        const normalized = (list || []).map((b, idx) => ({
          key: String(b?.bank_code ?? b?.bankCode ?? b?.code ?? b?.id ?? b?.slug ?? b?.name ?? idx),
          name: String(b?.bank_name ?? b?.bankName ?? b?.name ?? b?.label ?? `Bank ${idx + 1}`),
          ussd: String(b?.ussd_string ?? b?.ussdCode ?? b?.ussd_code ?? b?.ussd ?? b?.ussdPrefix ?? '')
        }));

        if (mounted) {
          sessionStorage.setItem('novac-ussd-banks', JSON.stringify(normalized));
          setBanks(normalized);
        }
      } catch (err) {
        if (mounted) setBanks([]);
        setBanksError(err?.message || 'Failed to load banks');
        if (onError) onError({ message: err.message || 'Failed to load banks', type: 'fetch_banks' });
      } finally {
        if (mounted) setBanksLoading(false);
      }
    };

    loadBanks();
    return () => { mounted = false; };
  }, [config?.publicKey]);

  const handleBankSelect = async (bank) => {
    // bank is already normalized: { key, name, ussd }
    const bankCode = bank?.key;
    const ussdPrefix = bank?.ussd ?? '';

    setSelectedBank(bankCode);
    setIsProcessing(true);

    try {
      const payload = {
        publicKey: config.publicKey,
        email: config.email,
        amount: config.amount,
        currency: config.currency,
        reference: config.reference,
        paymentMethod: 'ussd',
        bankCode: bankCode,
        metadata: config.metadata
      };

      const response = await makePaymentRequest(payload, initialResponse);

      // Generate USSD code (handle different property names safely)
      const paymentCode = response?.paymentCode ?? response?.data?.paymentCode ?? response?.payment_code ?? response?.code ?? '';

      // If the bank provided a full ussd string (e.g. '*123*1#'), use it as-is.
      // If the ussd string contains a placeholder like {amount}, replace it.
      // Otherwise, compose using prefix + paymentCode + amount.
      let code;
      if (ussdPrefix && ussdPrefix.includes('{amount}')) {
        code = ussdPrefix.replace('{amount}', String(config.amount));
      } else if (ussdPrefix && ussdPrefix.includes('#')) {
        code = ussdPrefix;
      } else {
        code = `${ussdPrefix}${paymentCode || '000'}*${config.amount}#`;
      }
      setUssdCode(code);
      setShowCode(true);
      setIsProcessing(false);
    } catch (error) {
      setIsProcessing(false);
      toast.error(error.message || 'Failed to generate USSD code');
      if (onError) onError({
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
          Choose your preferred bank for payment
        </p>
      </div>

      {banksLoading ? (
        <div className="novac-loading">
          <div className="novac-spinner"></div>
          <p>Loading banks...</p>
        </div>
      ) : banksError ? (
        <div className="novac-warning-box">
          <p className="novac-warning-text">{banksError}</p>
        </div>
      ) : banks.length === 0 ? (
        <div className="novac-info-box">
          <p className="novac-info-text">No USSD banks available for this merchant.</p>
        </div>
      ) : (
          <select
              className="novac-bank-select"
              value={selectedBank}
              onChange={(e) => {
                const bank = banks.find((b) => b.key === e.target.value);
                if (bank) handleBankSelect(bank);
              }}
              disabled={isProcessing}
          >
            <option value="">Select a bank</option>
            {banks.map((bank) => (
                <option key={bank.key} value={bank.key}>
                  {bank.name}
                </option>
            ))}
          </select>
      )}

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
