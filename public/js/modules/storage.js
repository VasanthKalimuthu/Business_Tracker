/**
 * Storage Module
 * Handles local storage operations
 */

const PARTNERS_KEY = 'local_partners';
const TRANSACTIONS_KEY = 'local_transactions';

/**
 * Get partners from local storage
 * @returns {Array<string>}
 */
export function getPartnersFromStorage() {
  const stored = localStorage.getItem(PARTNERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Save partners to local storage
 * @param {Array<string>} partners
 */
export function savePartnersToStorage(partners) {
  localStorage.setItem(PARTNERS_KEY, JSON.stringify(partners));
}

/**
 * Get transactions from local storage
 * @returns {Array<object>}
 */
export function getTransactionsFromStorage() {
  const stored = localStorage.getItem(TRANSACTIONS_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Save transactions to local storage
 * @param {Array<object>} transactions
 */
export function saveTransactionsToStorage(transactions) {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
}

/**
 * Clear all local storage data
 */
export function clearAllStorage() {
  localStorage.removeItem(PARTNERS_KEY);
  localStorage.removeItem(TRANSACTIONS_KEY);
}
