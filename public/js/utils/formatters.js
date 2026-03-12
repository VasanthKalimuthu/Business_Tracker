/**
 * Utility functions for formatting data
 */

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format a date object to a readable string
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string (MM/DD/YYYY)
 */
export function formatDate(date) {
  if (typeof date === 'string') {
    return date;
  }
  if (date instanceof Date) {
    return date.toLocaleDateString('en-US');
  }
  return new Date(date).toLocaleDateString('en-US');
}

/**
 * Get current date as a formatted string
 * @returns {string} Current date (MM/DD/YYYY)
 */
export function getCurrentDate() {
  return new Date().toLocaleDateString('en-US');
}

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
