/**
 * UI Module
 * Handles all DOM manipulation and rendering
 */

import { formatCurrency, formatDate } from '../utils/formatters.js';
import { getPartners } from './partners.js';
import { getCars, getCarById, getCarCount } from './cars.js';
import { getTransactions, getTotalIncome, getTotalExpenses, getNetProfit } from './transactions.js';
import { calculateFinancialBreakdown } from './calculator.js';

// State for month filter and car filter
let selectedMonth = null;
let selectedCarFilter = null;

/**
 * Set the selected month for filtering
 * @param {string} month - Month in YYYY-MM format or null
 */
export function setSelectedMonth(month) {
  selectedMonth = month;
}

/**
 * Set the selected car for filtering
 * @param {string} carId - Car ID or null
 */
export function setSelectedCar(carId) {
  selectedCarFilter = carId;
}

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
  const carCount = getCarCount();

  document.getElementById('totalIncome').innerText = formatCurrency(income);
  document.getElementById('totalExpense').innerText = formatCurrency(expenses);
  document.getElementById('netProfit').innerText = formatCurrency(profit);
  document.getElementById('carCount').innerText = carCount;
}

/**
 * Render the financial breakdown table
 */
export function renderBreakdown() {
  const cars = getCars();
  const table = document.getElementById('breakdownTable');

  if (cars.length === 0) {
    table.innerHTML = '<div class="text-slate-400 text-center py-4">Add vehicles to see financial summary</div>';
    return;
  }

  table.innerHTML = cars
    .map(car => `
      <div class="flex justify-between items-center py-2 px-4 bg-slate-700/50 rounded">
        <div class="flex items-center gap-3">
          ${car.photo ? `<img src="${car.photo}" alt="${car.name}" class="w-10 h-10 rounded object-cover">` : `<div class="w-10 h-10 rounded bg-slate-600 flex items-center justify-center"><i class="fas fa-car text-slate-400"></i></div>`}
          <div>
            <div class="font-semibold text-white">${car.name}</div>
            <div class="text-xs text-slate-400">${car.registrationNumber}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-sm text-emerald-400">+${formatCurrency(car.totalIncome)}</div>
          <div class="text-sm text-rose-400">-${formatCurrency(car.totalExpense)}</div>
        </div>
      </div>
    `)
    .join('');
}

/**
 * Render the cars list
 */
export function renderCars() {
  const cars = getCars();
  const carsList = document.getElementById('carsList');
  const noCarsMsg = document.getElementById('noCarsMessage');

  if (cars.length === 0) {
    carsList.innerHTML = '';
    noCarsMsg.classList.remove('hidden');
    return;
  }

  noCarsMsg.classList.add('hidden');
  carsList.innerHTML = cars
    .map(car => `
      <div class="bg-slate-700 border border-slate-600 rounded-xl p-5 hover:border-cyan-600 transition">
        ${car.photo ? `<div class="mb-4 rounded-lg overflow-hidden h-40 bg-slate-600"><img src="${car.photo}" alt="${car.name}" class="w-full h-full object-cover"></div>` : `<div class="mb-4 rounded-lg overflow-hidden h-40 bg-slate-600 flex items-center justify-center"><i class="fas fa-car text-4xl text-slate-500"></i></div>`}
        <h3 class="font-bold text-lg text-white mb-1">${car.name}</h3>
        <p class="text-xs text-slate-400 mb-3">${car.model}</p>
        <div class="bg-slate-800 rounded p-3 mb-4 border border-slate-600">
          <div class="text-xs text-slate-400 mb-2">Registration:</div>
          <div class="font-mono text-sm text-cyan-400 font-bold">${car.registrationNumber}</div>
        </div>
        <div class="grid grid-cols-2 gap-2 mb-4">
          <div class="bg-emerald-900/30 rounded p-2 border border-emerald-600/30">
            <div class="text-xs text-emerald-400">Income</div>
            <div class="text-sm font-bold text-emerald-300">${formatCurrency(car.totalIncome)}</div>
          </div>
          <div class="bg-rose-900/30 rounded p-2 border border-rose-600/30">
            <div class="text-xs text-rose-400">Expense</div>
            <div class="text-sm font-bold text-rose-300">${formatCurrency(car.totalExpense)}</div>
          </div>
        </div>
        <button onclick="window.appEvents.removeCar('${car.id}')" class="w-full bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white py-2 rounded font-semibold transition flex items-center justify-center gap-2">
          <i class="fas fa-trash"></i>
          Delete
        </button>
      </div>
    `)
    .join('');
}

/**
 * Render car select dropdowns
 */
export function renderCarSelectors() {
  const cars = getCars();
  const carSelect = document.getElementById('carSelect');
  const filterCar = document.getElementById('filterCar');

  // Car select dropdown for transactions
  carSelect.innerHTML = '<option value="">Select a vehicle...</option>' +
    cars.map(c => `<option value="${c.id}">${c.name} (${c.registrationNumber})</option>`).join('');

  // Filter select dropdown
  filterCar.innerHTML = '<option value="">All Vehicles</option>' +
    cars.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

/**
 * Filter transactions by selected month and car
 * @returns {Array<object>}
 */
function getFilteredTransactions() {
  const transactions = getTransactions();
  
  return transactions.filter(t => {
    // Filter by month
    if (selectedMonth) {
      const [month, day, year] = t.date.split('/');
      const txMonth = `${year}-${month.padStart(2, '0')}`;
      if (txMonth !== selectedMonth) return false;
    }
    
    // Filter by car
    if (selectedCarFilter) {
      if (t.carId !== selectedCarFilter) return false;
    }
    
    return true;
  });
}

/**
 * Get all transactions for export (unfiltered)
 * @returns {Array<object>}
 */
export function getTransactionsForExport() {
  const transactions = getTransactions();
  
  if (!selectedMonth) {
    return transactions;
  }
  
  return getFilteredTransactions();
}

/**
 * Render the transaction history table
 */
export function renderTransactionHistory() {
  const transactions = getFilteredTransactions();
  const table = document.getElementById('historyTable');

  if (transactions.length === 0) {
    table.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400">No transactions found</td></tr>';
    return;
  }

  table.innerHTML = transactions
    .map(t => {
      const car = t.carId ? getCarById(t.carId) : null;
      return `
        <tr class="hover:bg-slate-700/50">
          <td class="px-4 py-3 text-sm">${formatDate(t.date)}</td>
          <td class="px-4 py-3 text-sm">${car ? car.name : '—'}</td>
          <td class="px-4 py-3 text-sm font-semibold text-slate-200">${t.desc}</td>
          <td class="px-4 py-3 text-sm">
            <span class="px-2 py-1 rounded text-xs font-bold ${t.type === 'income' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-rose-900/30 text-rose-400'}">
              ${t.type === 'income' ? 'Income' : 'Expense'}
            </span>
          </td>
          <td class="px-4 py-3 text-sm font-bold text-right ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}">
            ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amt)}
          </td>  
          <td class="px-4 py-3 text-center">
            <button onclick="window.appEvents.deleteTransaction('${t.id}')" class="text-slate-400 hover:text-red-400 font-bold transition">
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join('');
}

/**
 * Render all UI elements
 * (Call this after any data change)
 */
export function renderAll() {
  renderFinancialSummary();
  renderCars();
  renderCarSelectors();
  renderBreakdown();
  renderTransactionHistory();
}

/**
 * Clear all input fields
 */
export function clearInputs() {
  document.getElementById('desc').value = '';
  document.getElementById('amount').value = '';
  document.getElementById('carSelect').value = '';
  document.getElementById('transType').value = 'income';
  document.getElementById('transDate').value = '';
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
