/**
 * Utility functions for validating input data
 */

/**
 * Validate partner name
 * @param {string} name - Partner name to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export function validatePartnerName(name) {
  const trimmed = name.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Partner name is required' };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Partner name must be at least 2 characters' };
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: 'Partner name cannot exceed 50 characters' };
  }

  return { isValid: true, error: '' };
}

/**
 * Validate transaction amount
 * @param {string|number} amount - Amount to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export function validateAmount(amount) {
  const num = parseFloat(amount);

  if (isNaN(num)) {
    return { isValid: false, error: 'Amount must be a valid number' };
  }

  if (num <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }

  if (num > 999999999) {
    return { isValid: false, error: 'Amount is too large' };
  }

  return { isValid: true, error: '' };
}

/**
 * Validate transaction description
 * @param {string} desc - Description to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export function validateDescription(desc) {
  const trimmed = desc.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Description is required' };
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: 'Description cannot exceed 100 characters' };
  }

  return { isValid: true, error: '' };
}

/**
 * Validate all transaction fields
 * @param {object} transaction - Transaction object with type, desc, amount, paidBy
 * @returns {object} { isValid: boolean, errors: object }
 */
export function validateTransaction(transaction) {
  const errors = {};

  if (!transaction.type) {
    errors.type = 'Transaction type is required';
  }

  if (transaction.type === 'expense' && !transaction.paidBy) {
    errors.paidBy = 'Please select who paid for this expense';
  }

  const descValidation = validateDescription(transaction.desc);
  if (!descValidation.isValid) {
    errors.desc = descValidation.error;
  }

  const amountValidation = validateAmount(transaction.amount);
  if (!amountValidation.isValid) {
    errors.amount = amountValidation.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
