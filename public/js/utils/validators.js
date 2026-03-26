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

/**
 * Validate car details
 * @param {object} carData - { name, model, registrationNumber, fuelType, transmission, photo }
 * @returns {object} { isValid: boolean, error: string }
 */
export function validateCarDetails(carData) {
  const carName = carData.name?.trim();
  const carModel = carData.model?.trim();
  const regNumber = carData.registrationNumber?.trim();
  const fuelType = carData.fuelType?.trim();
  const transmission = carData.transmission?.trim();

  if (!carName) {
    return { isValid: false, error: 'Car name is required' };
  }

  if (carName.length < 2) {
    return { isValid: false, error: 'Car name must be at least 2 characters' };
  }

  if (carName.length > 50) {
    return { isValid: false, error: 'Car name cannot exceed 50 characters' };
  }

  if (!carModel) {
    return { isValid: false, error: 'Car model is required' };
  }

  if (carModel.length < 2) {
    return { isValid: false, error: 'Car model must be at least 2 characters' };
  }

  if (!regNumber) {
    return { isValid: false, error: 'Registration number is required' };
  }

  if (regNumber.length < 3) {
    return { isValid: false, error: 'Registration number seems invalid' };
  }

  if (!fuelType) {
    return { isValid: false, error: 'Fuel type is required' };
  }

  const validFuelTypes = ['Petrol', 'Diesel', 'Electric'];
  if (!validFuelTypes.includes(fuelType)) {
    return { isValid: false, error: 'Invalid fuel type selected' };
  }

  if (!transmission) {
    return { isValid: false, error: 'Transmission type is required' };
  }

  const validTransmissions = ['Manual', 'Automatic'];
  if (!validTransmissions.includes(transmission)) {
    return { isValid: false, error: 'Invalid transmission type selected' };
  }

  // Electric vehicles must have automatic transmission
  if (fuelType === 'Electric' && transmission !== 'Automatic') {
    return { isValid: false, error: 'Electric vehicles must have Automatic transmission' };
  }

  return { isValid: true, error: '' };
}
