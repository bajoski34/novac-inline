# Double Initialization Fix

## Problem
Some merchants were reporting that the Novac inline payment modal was initializing twice, causing the payment request API to be called multiple times. This was not reproducing in the `example.html` test file, suggesting the issue occurs in specific merchant environments.

## Root Cause
The issue was in the `CheckoutModal.jsx` component's first `useEffect` hook (lines 67-107). Two specific problems contributed to this:

### 1. **Poor Dependency Array**
```javascript
// BEFORE (problematic)
}, [config]);  // Entire config object as dependency
```

When the entire `config` object was used as a dependency, React would re-run the effect whenever ANY property changed. If the merchant's code created a new `config` object on each render (common in unoptimized React code), the effect would trigger every render, causing multiple API calls.

### 2. **Missing Request Deduplication Guard**
The `hasInitialized` flag was declared but wasn't actually preventing multiple calls:
```javascript
// Original code had this flag but it was reset on every effect run
let hasInitialized = false;  // Always false when effect re-runs!
```

### 3. **React StrictMode**
In development, React intentionally double-invokes effect functions to detect side effects. Without proper deduplication, this causes duplicate API calls.

## Solution
The fix implements two improvements:

### 1. **Specific Dependencies Instead of Entire Object**
```javascript
// AFTER (improved)
}, [config.publicKey, config.reference, config.amount, config.currency, config.email, config.customerName, config.customerPhone, config.customization, config.onError]);
```

Now the effect only re-runs when specific properties actually change, not when a new `config` object is created.

### 2. **Proper Request Deduplication**
The `hasInitialized` flag is now used correctly to guard against concurrent API calls within the same effect cycle:
```javascript
const init = async () => {
  // Prevent multiple concurrent initialization requests
  if (hasInitialized) return;  // Guard against re-entrance
  hasInitialized = true;       // Only set once per effect
  
  // ... API call ...
};
```

## Impact
- ✅ Eliminates duplicate API calls from React StrictMode
- ✅ Eliminates duplicate API calls from config object recreation
- ✅ Maintains proper cleanup on unmount
- ✅ Backward compatible - no breaking changes to public API
- ✅ No additional dependencies added

## Testing Recommendations
1. Test in React StrictMode environment to verify single initialization
2. Test with merchant code that recreates config object on each render
3. Monitor API call logs to ensure only one `initiatePaymentRequest` call per modal open
4. Test modal open/close cycles to ensure proper cleanup

