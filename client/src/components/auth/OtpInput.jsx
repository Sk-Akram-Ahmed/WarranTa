import { useEffect, useRef } from 'react';
import './OtpInput.css';

const OtpInput = ({ value, onChange, onVerify, disabled = false, resetKey = 0, shake = false, success = false }) => {
  const inputRefs = useRef([]);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] || '');

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, [resetKey]);

  const updateValue = (nextDigits, focusIndex) => {
    const nextValue = nextDigits.join('');
    onChange(nextValue);
    if (typeof focusIndex === 'number') inputRefs.current[focusIndex]?.focus();
  };

  const handleChange = (event, index) => {
    const digit = event.target.value.replace(/\D/g, '').slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = digit;
    updateValue(nextDigits, digit && index < 5 ? index + 1 : undefined);
  };

  const handleKeyDown = (event, index) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault();
      const nextDigits = [...digits];
      nextDigits[index - 1] = '';
      updateValue(nextDigits, index - 1);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const nextDigits = Array.from({ length: 6 }, (_, index) => pasted[index] || '');
    updateValue(nextDigits, Math.min(pasted.length, 5));
  };

  const submit = (event) => {
    event.preventDefault();
    if (value.length === 6 && !disabled) onVerify(value);
  };

  return (
    <form className="otp-input-form" onSubmit={submit}>
      <div className={`otp-input${shake ? ' otp-input--shake' : ''}${success ? ' otp-input--success' : ''}`} aria-label="Six digit verification code">
      {digits.map((digit, index) => <input
        key={index}
        ref={(element) => { inputRefs.current[index] = element; }}
        className="otp-input__box"
        type="text"
        inputMode="numeric"
        autoComplete={index === 0 ? 'one-time-code' : 'off'}
        maxLength="1"
        value={digit}
        onChange={(event) => handleChange(event, index)}
        onKeyDown={(event) => handleKeyDown(event, index)}
        onPaste={handlePaste}
        disabled={disabled}
        aria-label={`Verification code digit ${index + 1}`}
      />)}
      </div>
      <button className="otp-input__continue" type="submit" disabled={value.length !== 6 || disabled}>
        {disabled ? 'Verifying...' : 'Continue'}
      </button>
    </form>
  );
};

export default OtpInput;
