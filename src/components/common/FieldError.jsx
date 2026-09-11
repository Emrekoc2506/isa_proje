import React from 'react';

/**
 * Common Field Error Component for Form Validation.
 * Accessible: uses role="alert" and standardized error IDs.
 */
export default function FieldError({ errors, name, error, id, className, style }) {
  const errVal = error !== undefined ? error : (errors && name ? errors[name] : null);
  if (!errVal) return null;
  const text = Array.isArray(errVal) ? errVal[0] : String(errVal);
  if (!text) return null;

  const errorId = id || (name ? `${name}-error` : undefined);

  return (
    <span
      id={errorId}
      role="alert"
      className={className || 'field-error-message'}
      style={{
        display: 'block',
        color: '#e74c3c',
        fontSize: '12px',
        marginTop: '4px',
        fontWeight: 500,
        lineHeight: 1.3,
        ...style
      }}
    >
      {text}
    </span>
  );
}

/**
 * Helper to generate accessible aria-* properties for inputs.
 */
export function getFieldAriaProps(errorsOrError, name, customErrorId) {
  let hasError = false;
  let errorId = customErrorId;
  if (name && errorsOrError && typeof errorsOrError === 'object' && !Array.isArray(errorsOrError)) {
    const val = errorsOrError[name];
    hasError = Boolean(val && (Array.isArray(val) ? val.length > 0 : true));
    errorId = customErrorId || `${name}-error`;
  } else {
    hasError = Boolean(errorsOrError && (Array.isArray(errorsOrError) ? errorsOrError.length > 0 : true));
    errorId = customErrorId;
  }
  return {
    'aria-invalid': hasError ? 'true' : 'false',
    'aria-describedby': hasError ? errorId : undefined,
  };
}

/**
 * Focuses the first element in a form with aria-invalid="true" or an active field error.
 */
export function focusFirstInvalidInput(formElementOrRef) {
  if (typeof document === 'undefined') return;
  const root = formElementOrRef?.current || formElementOrRef || document;
  const firstInvalid = root.querySelector?.('[aria-invalid="true"], input.invalid, select.invalid, textarea.invalid');
  if (firstInvalid && typeof firstInvalid.focus === 'function') {
    firstInvalid.focus();
  }
}
