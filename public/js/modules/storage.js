/**
 * Storage Module
 * Handles local storage operations
 */

const PARTNERS_KEY = 'local_partners';
const TRANSACTIONS_KEY = 'local_transactions';
const CARS_KEY = 'local_cars';

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
 * Get cars from local storage
 * @returns {Array<object>}
 */
export function getCarsFromStorage() {
  const stored = localStorage.getItem(CARS_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Save cars to local storage
 * @param {Array<object>} cars
 */
export function saveCarsToStorage(cars) {
  localStorage.setItem(CARS_KEY, JSON.stringify(cars));
}

/**
 * Clear all local storage data
 */
export function clearAllStorage() {
  localStorage.removeItem(PARTNERS_KEY);
  localStorage.removeItem(TRANSACTIONS_KEY);
  localStorage.removeItem(CARS_KEY);
}
