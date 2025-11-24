import React, { useState } from 'react';
import { validateOtp } from '../utils/api';

const Otp = ({ config, onSuccess, onError }) => {

    const [formData, setFormData] = useState({
        otp: '',
    });
    const [errors, setErrors] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.otp.trim()) {
            newErrors.otp = 'OTP is required';
        }

        // TODO: confirm if there are any other validations for OTP

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsProcessing(true);

        try {
            const otp = formData.otp.replace(/\s/g, '');

            const payload = {
                publicKey: config.publicKey,
                otp,
                reference: config.reference,
            };

            const response = await validateOtp(payload);
            console.log("OTP Validation Response:", response);
            onSuccess(true);
        } catch (error) {
            onError({
                message: error.message || 'Otp Validation failed.',
                type: 'card_error'
            });
        }
    };

    function handleInputChange(e) {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    }

    return (
        <form className="novac-payment-form" onSubmit={handleSubmit}>
            <div className="novac-form-group">
                <label htmlFor="cardholderName" className="novac-label">
                    Otp
                </label>
                <input
                    type="text"
                    id="otp"
                    name="otp"
                    className={`novac-input ${errors.otp ? 'error' : ''}`}
                    value={formData.otp}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    disabled={isProcessing}
                    autoComplete="cc-name"
                />
                {errors.otp && (
                    <span className="novac-error-text">{errors.otp}</span>
                )}
            </div>
            <button
                type="submit"
                className="novac-submit-btn"
                disabled={isProcessing}
            >
                {isProcessing ? 'Processing...' : 'Submit OTP'}
            </button>
        </form>
    )
}

export default Otp;