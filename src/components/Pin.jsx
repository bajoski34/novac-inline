import React, { useEffect, useRef, useState } from 'react';

const Pin = ({ formData, setFormData, handleSubmit }) => {
    const DIGITS = 4;
    const [pinDigits, setPinDigits] = useState(Array(DIGITS).fill(''));
    const [errors, setErrors] = useState({});
    const inputsRef = useRef([]);

    // Initialize from formData.cardPin if available
    useEffect(() => {
        if (formData && typeof formData.cardPin === 'string' && formData.cardPin.length === DIGITS) {
            setPinDigits(formData.cardPin.split(''));
        }
    }, [formData]);

    // Sync combined pin to parent formData whenever digits change
    useEffect(() => {
        const combined = pinDigits.join('');
        setFormData({ ...formData, cardPin: combined });
    }, [pinDigits]);

    const validateForm = () => {
        const newErrors = {};

        if (pinDigits.some(d => d.trim() === '')) {
            newErrors.pin = 'PIN is required';
        } else if (!pinDigits.join('').match(/^\d{4}$/)) {
            newErrors.pin = 'PIN must be 4 digits';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (index, e) => {
        const val = e.target.value;
        // Only keep the last entered digit if user somehow types more than one char
        const digit = val.replace(/[^0-9]/g, '').slice(-1) || '';
        const next = [...pinDigits];
        next[index] = digit;
        setPinDigits(next);

        if (digit && index < DIGITS - 1) {
            // move focus to next
            const nextInput = inputsRef.current[index + 1];
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (pinDigits[index]) {
                // clear current cell
                const next = [...pinDigits];
                next[index] = '';
                setPinDigits(next);
            } else if (index > 0) {
                // move to previous and clear it
                const prevInput = inputsRef.current[index - 1];
                if (prevInput) {
                    prevInput.focus();
                    const next = [...pinDigits];
                    next[index - 1] = '';
                    setPinDigits(next);
                }
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputsRef.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < DIGITS - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        const digits = paste.replace(/\D/g, '').slice(0, DIGITS).split('');
        if (digits.length === 0) return;
        const next = [...pinDigits];
        for (let i = 0; i < DIGITS; i++) {
            next[i] = digits[i] || '';
        }
        setPinDigits(next);
        // focus the first empty cell
        const firstEmpty = next.findIndex(d => d === '');
        const focusIndex = firstEmpty === -1 ? DIGITS - 1 : firstEmpty;
        inputsRef.current[focusIndex]?.focus();
    };

    const handleSubmitInternal = (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        handleSubmit(e);
    };

    return (
        <form onSubmit={handleSubmitInternal} className="novac-pin-form">
            <div className="novac-form-group">
                <label className="novac-label">Enter your 4 digit PIN to proceed</label>
                <div className="novac-pin-inputs" onPaste={handlePaste} style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    {pinDigits.map((digit, i) => (
                        <input
                            key={i}
                            ref={(el) => (inputsRef.current[i] = el)}
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            className={`novac-pin-cell ${errors.pin ? 'error' : ''}`}
                            value={digit}
                            onChange={(e) => handleChange(i, e)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            aria-label={`PIN digit ${i + 1}`}
                            autoComplete={i === 0 ? 'one-time-code' : 'off'}
                        />
                    ))}
                </div>

                {errors.pin && <span className="novac-error-text">{errors.pin}</span>}
                <button type="submit" className="novac-submit-btn" style={{ marginTop: '16px' }}>Submit</button>
            </div>
        </form>
    );
};

export default Pin;