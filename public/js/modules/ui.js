/**
 * UI Module
 * Handles all DOM manipulation and rendering
 */

import { formatCurrency, formatDate } from '../utils/formatters.js';
import { getPartners } from './partners.js';
import { getTransactions, getTotalIncome, getTotalExpenses, getNetProfit } from './transactions.js';
import { calculateFinancialBreakdown } from './calculator.js';

/**
 * Render the partners list
 */
export function renderPartners() {
  const partners = getPartners();
  const partnersList = document.getElementById('partnersList');

  if (partners.length === 0) {
    partnersList.innerHTML = '<span class="text-xs text-gray-300">Add team members</span>';
    return;
  }

  partnersList.innerHTML = partners
    .map(p => `
      <span class="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded border border-indigo-100">
        ${p}
        <button onclick="window.appEvents.removePartner('${p}')" class="ml-1 opacity-50 hover:opacity-100">&times;</button>
      </span>
    `)
    .join('');
}

/**
 * Render the paid by dropdown
 */
export function renderPaidByDropdown() {
  const partners = getPartners();
  const paidBySelect = document.getElementById('paidBy');

  paidBySelect.innerHTML = partners
    .map(p => `<option value="${p}">${p}</option>`)
    .join('');
}

/**
 * Render financial summary cards
 */
export function renderFinancialSummary() {
  const income = getTotalIncome();
  const expenses = getTotalExpenses();
  const profit = getNetProfit();

  document.getElementById('totalIncome').innerText = formatCurrency(income);
  document.getElementById('totalExpense').innerText = formatCurrency(expenses);
  document.getElementById('netProfit').innerText = formatCurrency(profit);
}

/**
 * Render the financial breakdown table
 */
export function renderBreakdown() {
  const breakdown = calculateFinancialBreakdown();
  const table = document.getElementById('breakdownTable');

  if (getPartners().length === 0) {
    table.innerHTML = '';
    return;
  }

  table.innerHTML = breakdown
    .map(item => `
      <tr class="hover:bg-indigo-50/50">
        <td class="px-6 py-4 font-bold text-gray-600">${item.name}</td>
        <td class="text-right text-gray-400 text-xs">${formatCurrency(item.paidExpenses)} reimbursement</td>
        <td class="text-right font-black text-indigo-700 bg-indigo-50/30">${formatCurrency(item.totalPayout)} total payout</td>
      </tr>
    `)
    .join('');
}

/**
 * Render the transaction history table
 */
export function renderTransactionHistory() {
  const transactions = getTransactions();
  const table = document.getElementById('historyTable');

  table.innerHTML = transactions
    .map(t => `
      <tr>
        <td class="px-6 py-3">
          <div class="font-bold">${t.desc}</div>
          <div class="text-[9px] uppercase text-gray-400">${t.date}${t.paidBy ? ' • ' + t.paidBy : ''}</div>
        </td>
        <td class="text-right font-bold ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}">
          ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amt)}
        </td>
        <td class="text-center px-4">
          <button onclick="window.appEvents.deleteTransaction('${t.id}')" class="text-gray-200 hover:text-rose-400">&times;</button>
        </td>
      </tr>
    `)
    .join('');
}

/**
 * Render all UI elements
 * (Call this after any data change)
 */
export function renderAll() {
  renderPartners();
  renderPaidByDropdown();
  renderFinancialSummary();
  renderBreakdown();
  renderTransactionHistory();
}

/**
 * Clear all input fields
 */
export function clearInputs() {
  document.getElementById('partnerName').value = '';
  document.getElementById('desc').value = '';
  document.getElementById('amount').value = '';
  document.getElementById('transType').value = 'income';
}

/**
 * Show an error message
 * @param {string} message
 * @param {string} elementId - Optional: ID of element to update with error
 */
export function showError(message, elementId) {
  if (elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.setAttribute('data-error', message);
    }
  }
  alert(message);
}

/**
 * Show a success message
 * @param {string} message
 */
export function showSuccess(message) {
  console.log('✓ ' + message);
  // You can enhance this with a toast notification later
}
