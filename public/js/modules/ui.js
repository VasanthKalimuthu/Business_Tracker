/**
 * UI Module
 * Handles all DOM manipulation and rendering
 */

import { formatCurrency, formatDate } from '../utils/formatters.js';
import { getPartners } from './partners.js';
import { getCars, getCarById, getCarCount } from './cars.js';
import { getTransactions, getTotalIncome, getTotalExpenses, getNetProfit } from './transactions.js';
import { calculateFinancialBreakdown, calculateMonthlyProfitByPartner, getVehicleFinancialSummary, getMonthlyFinancialByVehicle, getAllPartnerSettlements, calculateVehicleSettlement, getExpenseForVehicle, getTotalIncomeForMonth, getTotalExpensesForMonth, getNetProfitForMonth, getExpensesPaidByForMonth, calculateProfitPerPartnerForMonth, getMonthlySettlement, getVehicleFinancialSummaryForMonth } from './calculator.js';

// State for month filter and car filter
let selectedMonth = null;
let selectedCarFilter = null;
let partnerFilterMonth = getCurrentMonth();
let financialSummaryFilterMonth = getCurrentMonth();

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

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
 * Set the partner filter month
 * @param {string} month - Month in YYYY-MM format
 */
export function setPartnerFilterMonth(month) {
  partnerFilterMonth = month;
}

/**
 * Set the financial summary filter month
 * @param {string} month - Month in YYYY-MM format
 */
export function setFinancialSummaryFilterMonth(month) {
  financialSummaryFilterMonth = month;
}

/**
 * Render the partners list with financial details
 * @param {string} monthKey - Optional month in YYYY-MM format for filtering
 */
export function renderPartners(monthKey = null) {
  const partners = getPartners();
  const partnersList = document.getElementById('partnersList');
  
  // Use provided month or the selected filter month
  const filterMonth = monthKey || partnerFilterMonth;

  if (partners.length === 0) {
    partnersList.innerHTML = `
      <div class="text-center py-12 col-span-full text-slate-400">
        <i class="fas fa-inbox text-5xl mb-4 opacity-30 block"></i>
        <p>No team members added yet. Add your first member to get started!</p>
      </div>
    `;
    return;
  }

  // Use month-filtered calculations if a specific month is selected
  const netProfit = filterMonth ? getNetProfitForMonth(filterMonth) : getNetProfit();
  const profitPerPartner = partners.length > 0 ? netProfit / partners.length : 0;
  
  // Get settlements (month-filtered if applicable)
  const settlements = filterMonth 
    ? partners.map(partner => ({
        name: partner,
        ...getMonthlySettlement(partner, filterMonth)
      }))
    : getAllPartnerSettlements();

  partnersList.innerHTML = partners
    .map(partner => {
      const monthlyProfit = calculateMonthlyProfitByPartner(partner);
      
      // Use month-filtered expenses if filtering by month
      const totalPaidExpenses = filterMonth
        ? getExpensesPaidByForMonth(partner, filterMonth)
        : getTransactions()
          .filter(t => t.type === 'expense' && t.paidBy === partner)
          .reduce((sum, t) => sum + t.amt, 0);
      
      const totalProfit = profitPerPartner + totalPaidExpenses;
      
      const settlement = settlements.find(s => s.name === partner);
      const settlementAmount = settlement ? settlement.settlement : 0;
      const settlementColor = settlementAmount > 0 ? 'text-emerald-400' : settlementAmount < 0 ? 'text-rose-400' : 'text-slate-400';
      const settlementLabel = settlementAmount > 0 ? 'Gets Back' : settlementAmount < 0 ? 'Owes' : 'Settled';

      return `
        <div class="bg-slate-700 border border-slate-600 rounded-xl p-6 hover:border-purple-600 transition">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-bold text-white">${partner}</h3>
            <button onclick="window.appEvents.removePartner('${partner}')" class="text-rose-400 hover:text-rose-300 text-lg">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
          
          <div class="space-y-3 mb-4">
            <div class="bg-slate-800 rounded p-3 border border-slate-600">
              <div class="text-xs text-slate-400 mb-1">Total Profit</div>
              <div class="font-bold text-lg ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${formatCurrency(totalProfit)}</div>
            </div>
            
            <div class="grid grid-cols-3 gap-2">
              <div class="bg-slate-800 rounded p-2 border border-slate-600">
                <div class="text-xs text-slate-400 mb-1">Share</div>
                <div class="text-sm font-bold text-purple-400">${formatCurrency(profitPerPartner)}</div>
              </div>
              <div class="bg-slate-800 rounded p-2 border border-slate-600">
                <div class="text-xs text-slate-400 mb-1">Paid</div>
                <div class="text-sm font-bold text-orange-400">${formatCurrency(totalPaidExpenses)}</div>
              </div>
              <div class="bg-slate-800 rounded p-2 border border-slate-600">
                <div class="text-xs text-slate-400 mb-1">${settlementLabel}</div>
                <div class="text-sm font-bold ${settlementColor}">${formatCurrency(Math.abs(settlementAmount))}</div>
              </div>
            </div>
          </div>
          
          <div class="mt-4">
            <div class="text-xs text-slate-400 font-semibold mb-2">Monthly Breakdown</div>
            <div class="space-y-2 max-h-32 overflow-y-auto">
              ${monthlyProfit.length > 0 
                ? monthlyProfit.map(m => `
                    <div class="flex justify-between text-xs bg-slate-800 rounded px-2 py-1">
                      <span class="text-slate-300">${m.month}</span>
                      <span class="${m.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-semibold">${formatCurrency(m.profit)}</span>
                    </div>
                  `).join('')
                : '<div class="text-xs text-slate-500 text-center py-2">No transactions</div>'
              }
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

/**
 * Render the paid by dropdown
 */
export function renderPaidByDropdown() {
  const partners = getPartners();
  const paidBySelect = document.getElementById('paidBy');

  paidBySelect.innerHTML = '<option value="">Select...</option>' +
    '<option value="common"><i class="fas fa-users"></i> Common (All Members)</option>' +
    partners.map(p => `<option value="${p}">${p}</option>`).join('');
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
export function renderBreakdown(monthKey = null) {
  const filterMonth = monthKey || financialSummaryFilterMonth;
  const vehicleSummary = filterMonth ? getVehicleFinancialSummaryForMonth(filterMonth) : getVehicleFinancialSummary();
  const table = document.getElementById('breakdownTable');

  if (vehicleSummary.length === 0) {
    table.innerHTML = '<div class="text-slate-400 text-center py-4">Add vehicles to see financial summary</div>';
    return;
  }

  table.innerHTML = vehicleSummary
    .map(vehicle => `
      <div class="bg-slate-700 border border-slate-600 rounded-xl p-4 hover:border-cyan-600 transition cursor-pointer" onclick="window.appEvents.showVehicleTransactions('${vehicle.carId}')">
        <div class="flex justify-between items-start mb-4">
          <div class="flex items-center gap-3">
            ${vehicle.photo ? `<img src="${vehicle.photo}" alt="${vehicle.name}" class="w-12 h-12 rounded object-cover">` : `<div class="w-12 h-12 rounded bg-slate-600 flex items-center justify-center"><i class="fas fa-car text-slate-400 text-lg"></i></div>`}
            <div>
              <div class="font-bold text-white text-sm">${vehicle.name}</div>
              <div class="text-xs text-slate-400">${vehicle.registrationNumber}</div>
            </div>
          </div>
          <div class="text-xs bg-slate-600 rounded px-2 py-1 text-slate-300">${vehicle.transactionCount} transactions</div>
        </div>
        
        <div class="grid grid-cols-3 gap-2 text-xs">
          <div class="bg-slate-800 rounded p-2 border border-slate-600">
            <div class="text-slate-400 mb-1">Income</div>
            <div class="font-bold text-emerald-400">${formatCurrency(vehicle.income)}</div>
          </div>
          <div class="bg-slate-800 rounded p-2 border border-slate-600">
            <div class="text-slate-400 mb-1">Expense</div>
            <div class="font-bold text-rose-400">${formatCurrency(vehicle.expense)}</div>
          </div>
          <div class="bg-slate-800 rounded p-2 border border-slate-600">
            <div class="text-slate-400 mb-1">Profit</div>
            <div class="font-bold ${vehicle.profit >= 0 ? 'text-blue-400' : 'text-rose-400'}">${formatCurrency(vehicle.profit)}</div>
          </div>
        </div>
      </div>
    `)
    .join('');
}

/**
 * Render the cars list
 */
/**
 * Calculate income for a specific vehicle
 * @param {string} carId - Car ID
 * @returns {number}
 */
function getCarIncome(carId) {
  return getTransactions()
    .filter(t => t.type === 'income' && t.carId === carId)
    .reduce((sum, t) => sum + t.amt, 0);
}

/**
 * Calculate expense for a specific vehicle
 * @param {string} carId - Car ID
 * @returns {number}
 */
function getCarExpense(carId) {
  return getTransactions()
    .filter(t => t.type === 'expense' && t.carId === carId)
    .reduce((sum, t) => sum + t.amt, 0);
}

/**
 * Get icon for fuel type
 * @param {string} fuelType - Fuel type
 * @returns {string} - Font Awesome icon class
 */
function getFuelTypeIcon(fuelType) {
  switch (fuelType) {
    case 'Petrol':
      return 'fas fa-gas-pump';
    case 'Diesel':
      return 'fas fa-oil-can';
    case 'Electric':
      return 'fas fa-bolt';
    default:
      return 'fas fa-car';
  }
}

/**
 * Get icon for transmission type
 * @param {string} transmission - Transmission type
 * @returns {string} - Font Awesome icon class
 */
function getTransmissionIcon(transmission) {
  switch (transmission) {
    case 'Manual':
      return 'fas fa-gears';
    case 'Automatic':
      return 'fas fa-gear';
    default:
      return 'fas fa-cog';
  }
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
    .map(car => {
      const carIncome = getCarIncome(car.id);
      const carExpense = getCarExpense(car.id);
      
      return `
      <div class="bg-slate-700 border border-slate-600 rounded-xl p-6 hover:border-cyan-600 transition cursor-pointer" onclick="window.appEvents.viewVehicleDetail('${car.id}')">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="font-bold text-lg text-white">${car.name}</h3>
            <p class="text-xs text-slate-400 mt-1">${car.model}</p>
          </div>
          <div class="flex gap-2">
            <button onclick="event.stopPropagation(); window.appEvents.openEditCarModal('${car.id}')" class="text-blue-400 hover:text-blue-300 text-lg" title="Edit Vehicle">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="event.stopPropagation(); window.appEvents.removeCar('${car.id}')" class="text-rose-400 hover:text-rose-300 text-lg" title="Delete Vehicle">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>

        ${car.photo ? `<div class="mb-4 rounded-lg overflow-hidden h-32 bg-slate-600"><img src="${car.photo}" alt="${car.name}" class="w-full h-full object-cover"></div>` : `<div class="mb-4 rounded-lg overflow-hidden h-32 bg-slate-600 flex items-center justify-center"><i class="fas fa-car text-3xl text-slate-500"></i></div>`}

        <div class="space-y-3 mb-4">
          <div class="bg-slate-800 rounded p-3 border border-slate-600">
            <div class="text-xs text-slate-400 mb-1">Registration</div>
            <div class="font-mono text-sm text-cyan-400 font-bold">${car.registrationNumber}</div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="bg-slate-800 rounded p-2 border border-slate-600">
              <div class="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <i class="${getFuelTypeIcon(car.fuelType)} text-xs"></i>
                Fuel
              </div>
              <div class="text-sm font-bold text-slate-300">${car.fuelType || 'N/A'}</div>
            </div>
            <div class="bg-slate-800 rounded p-2 border border-slate-600">
              <div class="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <i class="${getTransmissionIcon(car.transmission)} text-xs"></i>
                Trans
              </div>
              <div class="text-sm font-bold text-slate-300">${car.transmission || 'N/A'}</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="bg-emerald-900/30 rounded p-2 border border-emerald-600/30">
              <div class="text-xs text-emerald-400 mb-1">Income</div>
              <div class="font-bold text-emerald-300">${formatCurrency(carIncome)}</div>
            </div>
            <div class="bg-rose-900/30 rounded p-2 border border-rose-600/30">
              <div class="text-xs text-rose-400 mb-1">Expense</div>
              <div class="font-bold text-rose-300">${formatCurrency(carExpense)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
    })
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
 * Render vehicle detail paidBy dropdown
 */
export function renderVehiclePaidByDropdown() {
  const partners = getPartners();
  const vehiclePaidBySelect = document.getElementById('vehiclePaidBy');

  if (vehiclePaidBySelect) {
    vehiclePaidBySelect.innerHTML = '<option value="">Select a team member...</option>' +
      '<option value="common"><i class="fas fa-users"></i> Common (All Members)</option>' +
      partners.map(p => `<option value="${p}">${p}</option>`).join('');
  }
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
    table.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400">No transactions found</td></tr>';
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
          <td class="px-4 py-3 text-sm ${t.paidBy === 'common' ? 'text-purple-400 font-semibold' : 'text-slate-300'}">${t.paidBy === 'common' ? '<i class="fas fa-users mr-1"></i>Common' : (t.paidBy || '—')}</td>
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
  // Scroll to top when re-rendering
  window.scrollTo(0, 0);
  
  renderFinancialSummary();
  renderPartners();
  renderPaidByDropdown();
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
  document.getElementById('paidBy').value = '';
}

/**
 * Show a toast notification
 * @param {string} message - Notification message
 * @param {string} type - 'success', 'error', or 'info'
 * @param {number} duration - Duration in ms (default 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('notificationContainer');
  
  const toast = document.createElement('div');
  toast.className = `animated-toast px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 border transition-all duration-300 transform`;
  
  // Set styles based on type
  if (type === 'success') {
    toast.className += ' bg-emerald-600 border-emerald-500 text-white';
    toast.innerHTML = `
      <i class="fas fa-check-circle text-lg"></i>
      <span class="font-medium">${message}</span>
    `;
  } else if (type === 'error') {
    toast.className += ' bg-rose-600 border-rose-500 text-white';
    toast.innerHTML = `
      <i class="fas fa-exclamation-circle text-lg"></i>
      <span class="font-medium">${message}</span>
    `;
  } else {
    toast.className += ' bg-blue-600 border-blue-500 text-white';
    toast.innerHTML = `
      <i class="fas fa-info-circle text-lg"></i>
      <span class="font-medium">${message}</span>
    `;
  }
  
  container.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove toast after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Show an error message
 * @param {string} message
 */
export function showError(message) {
  showToast(message, 'error', 4000);
}

/**
 * Show a success message
 * @param {string} message
 */
export function showSuccess(message) {
  showToast(message, 'success', 3000);
}
