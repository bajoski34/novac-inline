import React, { useEffect, useRef, useState } from "react";
import { verifyPayment } from "../utils/api";
import StatusIcon from './icons/StatusIcon';

const ConfirmTransaction = ({
  reference,
  onSuccess,
  onError,
  time_taken,
  publicKey,
  status = 'confirming',
  title,
  message,
  subMessage,
  onRetry,
  showCloseHint = true
}) => {
  const normalizedStatus = ['success', 'failed'].includes(status) ? status : 'confirming';
  const initialMinutes = typeof time_taken === 'number' && time_taken > 0 ? time_taken : 0.5;
  const [remainingSeconds, setRemainingSeconds] = useState(Math.round(initialMinutes * 60));
  const pollingRef = useRef(null);
  const tickerRef = useRef(null);
  const calledSuccessRef = useRef(false);

  const copy = {
    confirming: {
      title: title || 'Confirming your transaction...',
      message: message || 'Please do not refresh or leave this page',
      sub: subMessage || 'This process takes a moment while we finalize your payment.'
    },
    success: {
      title: title || 'Payment Completed',
      message: message || 'Your transaction was successful.',
      sub: subMessage || (showCloseHint ? 'You can now securely close this tab.' : '')
    },
    failed: {
      title: title || 'Payment Failed',
      message: message || "Sorry, we can't complete your transaction at this time.",
      sub: subMessage || (showCloseHint ? 'You can now securely close this tab.' : '')
    }
  }[normalizedStatus];

  // Helper to decide if verifyPayment response indicates success
  function isPaymentSuccessful(resp) {
    if (!resp) return false;
    // check common shapes: resp.status === true, resp.data?.status === 'success' etc.
    if (resp === true) return true;
    if (resp.status === true) return true;
    const dataStatus = resp?.data?.status ?? resp?.status ?? resp?.paymentStatus ?? resp?.statusText;
    if (typeof dataStatus === 'string') {
      const s = dataStatus.toLowerCase();
      if (s.includes('success') || s.includes('completed') || s.includes('paid')) return true;
    }
    return false;
  }

  useEffect(() => {
    if (normalizedStatus !== 'confirming') return () => {};

    let mounted = true;

    const stopAll = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (tickerRef.current) {
        clearInterval(tickerRef.current);
        tickerRef.current = null;
      }
    };

    const finishWithSuccess = () => {
      if (calledSuccessRef.current) return;
      calledSuccessRef.current = true;
      stopAll();
      try {
        onSuccess && onSuccess({
            reference: reference,
            status: 'success',
            message: 'Payment confirmed successfully'
        });
      } catch (e) {
        // swallow user callback errors
        // eslint-disable-next-line no-console
          onError && onError({
              reference: reference,
              status: 'failed',
              message: 'onSuccess callback error'
          })
        console.error('onSuccess callback error', e);
      }
    };

    // Polling function - call verifyPayment and finish when confirmed
    const pollVerify = async () => {
      try {
        const resp = await verifyPayment(reference, publicKey);
        if (!mounted) return;
        if (isPaymentSuccessful(resp)) {
          finishWithSuccess();
        }
      } catch (err) {
        // ignore transient errors - will retry
        // eslint-disable-next-line no-console
          mounted && onError && onError({
              reference: reference,
              status: 'failed',
              message: err?.message || 'verifyPayment error'
          })
        console.warn('verifyPayment error', err?.message || err);
      }
    };

    // Start an immediate verification then poll every 5 seconds
    pollVerify();
    pollingRef.current = setInterval(pollVerify, 5000);

    // Start countdown ticker every second
    tickerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          // time's up
          // call onSuccess if payment not confirmed (fallback)
          if (!calledSuccessRef.current) {
            finishWithSuccess();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      mounted = false;
      stopAll();
    };

  }, [normalizedStatus, reference, publicKey, onSuccess]);

  useEffect(() => {
    if (normalizedStatus !== 'confirming') {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (tickerRef.current) clearInterval(tickerRef.current);
    }
  }, [normalizedStatus]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className={`novac-status-container status-${normalizedStatus}`}>
      <div className="novac-status-icon">
        <StatusIcon status={normalizedStatus} />
      </div>
      <h3 className="novac-status-title">{copy.title}</h3>
      <p className="novac-status-message">{copy.message}</p>
      {normalizedStatus === 'confirming' ? (
        <p className="novac-status-submessage">
          {subMessage || 'This process takes about '}
          {remainingSeconds > 0 ? (
            <span>
              {minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : ''}
              {minutes > 0 && seconds > 0 ? ' ' : ''}
              {seconds > 0 ? `${seconds} second${seconds > 1 ? 's' : ''}` : ''}
            </span>
          ) : (
            <span>0 seconds</span>
          )}
        </p>
      ) : copy.sub ? (
        <p className="novac-status-submessage">{copy.sub}</p>
      ) : null}

      {normalizedStatus === 'failed' && onRetry && (
        <button type="button" className="novac-status-retry" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
};

export default ConfirmTransaction;
