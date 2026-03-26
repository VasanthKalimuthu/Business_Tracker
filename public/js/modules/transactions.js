/**
 * Transactions Module
 * Manages transaction-related operations
 */

import { getTransactionsFromStorage, saveTransactionsToStorage } from './storage.js';
import { validateTransaction } from '../utils/validators.js';
import { getCurrentDate } from '../utils/formatters.js';
import { addTransactionToCloud, deleteTransactionFromCloud, isFirebaseConnected } from '../services/firebase-service.js';
import { updateCarFinancials, getCarById } from './cars.js';

let transactions = [];
let transactionIdCounter = 0;

/**
 * Initialize transactions from storage
 */
export function initTransactions() {
  transactions = getTransactionsFromStorage();
  // Update counter based on existing transactions
  transactionIdCounter = transactions.length > 0
    ? Math.max(...transactions.map(t => parseInt(t.id) || 0))
    : 0;
}

/**
 * Get all transactions sorted by date (newest first)
 * @returns {Array<object>}
 */
export function getTransactions() {
  return transactions.sort((a, b) => {
    const timeA = a.ts || new Date(a.date).getTime();
    const timeB = b.ts || new Date(b.date).getTime();
    return timeB - timeA;
  });
}

/**
 * Set transactions (used for cloud sync)
 * @param {Array<object>} newTransactions
 */
export function setTransactions(newTransactions) {
  transactions = (newTransactions || []).sort((a, b) => {
    const timeA = a.ts || new Date(a.date).getTime();
    const timeB = b.ts || new Date(b.date).getTime();
    return timeB - timeA;
  });
  saveTransactionsToStorage(transactions);
}

/**
 * Add a new transaction
 * @param {object} transactionData - { type, desc, amount, paidBy, date (optional), carId }
 * @returns {Promise<object>} { success: boolean, error: string, id: string }
 */
export async function addTransaction(transactionData) {
  const validation = validateTransaction(transactionData);
  if (!validation.isValid) {
    return { 
      success: false, 
      error: Object.values(validation.errors).join(', '),
      id: null
    };
  }

  // Format date: if custom date provided (YYYY-MM-DD), convert to MM/DD/YYYY
  let formattedDate = getCurrentDate();
  if (transactionData.date) {
    const [year, month, day] = transactionData.date.split('-');
    formattedDate = `${month}/${day}/${year}`;
  }

  const transaction = {
    id: `tx_${++transactionIdCounter}`,
    type: transactionData.type,
    desc: transactionData.desc.trim(),
    amt: parseFloat(transactionData.amount),
    paidBy: transactionData.paidBy || '',
    carId: transactionData.carId || '',
    date: formattedDate,
    ts: Date.now()
  };

  transactions.push(transaction);
  saveTransactionsToStorage(transactions);

  // Update car financials
  if (transactionData.carId) {
    const incomeAmount = transactionData.type === 'income' ? parseFloat(transactionData.amount) : 0;
    const expenseAmount = transactionData.type === 'expense' ? parseFloat(transactionData.amount) : 0;
    updateCarFinancials(transactionData.carId, incomeAmount, expenseAmount);
  }

  // Sync to cloud if available
  let cloudId = null;
  if (isFirebaseConnected()) {
    cloudId = await addTransactionToCloud(transaction);
  }

  return { 
    success: true, 
    error: '',
    id: cloudId || transaction.id
  };
}

/**
 * Delete a transaction
 * @param {string} transactionId - ID of transaction to delete
 * @returns {Promise<object>} { success: boolean, error: string }
 */
export async function deleteTransaction(transactionId) {
  const index = transactions.findIndex(t => t.id === transactionId);
  if (index === -1) {
    return { success: false, error: 'Transaction not found' };
  }

  const transaction = transactions[index];

  transactions.splice(index, 1);
  saveTransactionsToStorage(transactions);

  // Reverse car financial updates
  if (transaction.carId) {
    const incomeAmount = transaction.type === 'income' ? -transaction.amt : 0;
    const expenseAmount = transaction.type === 'expense' ? -transaction.amt : 0;
    updateCarFinancials(transaction.carId, incomeAmount, expenseAmount);
  }

  // Sync to cloud if available
  if (isFirebaseConnected()) {
    await deleteTransactionFromCloud(transactionId);
  }

  return { success: true, error: '' };
}

/**
 * Get total income
 * @returns {number}
 */
export function getTotalIncome() {
  return transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amt, 0);
}

/**
 * Get total expenses
 * @returns {number}
 */
export function getTotalExpenses() {
  return transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amt, 0);
}

/**
 * Get net profit
 * @returns {number}
 */
export function getNetProfit() {
  return getTotalIncome() - getTotalExpenses();
}

/**
 * Get transactions of a specific type
 * @param {string} type - 'income' or 'expense'
 * @returns {Array<object>}
 */
export function getTransactionsByType(type) {
  return transactions.filter(t => t.type === type);
}

/**
 * Get expenses paid by a specific partner
 * @param {string} partnerName
 * @returns {number}
 */
export function getExpensesPaidBy(partnerName) {
  return transactions
    .filter(t => t.type === 'expense' && t.paidBy === partnerName)
    .reduce((sum, t) => sum + t.amt, 0);
}
