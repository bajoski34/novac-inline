import React from 'react';

const Failed = () => {
  return (
    <div className="novac-failed-container">
      <div className="novac-failed-icon">
        <span className="novac-failed-icon-inner">✕</span>
      </div>
      <h2 className="novac-failed-title">Payment Failed</h2>
      <p className="novac-failed-message">
        Sorry, we can&apos;t complete your transaction at this time. Please try again.
      </p>
      <p className="novac-failed-submessage">
        You can now securely close this tab.
      </p>
    </div>
  );
};

export default Failed;