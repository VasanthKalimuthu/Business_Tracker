/**
 * Calculator Module
 * Handles all financial calculations
 */

import { getPartners } from './partners.js';
import { getTotalIncome, getTotalExpenses, getNetProfit, getExpensesPaidBy, getTransactions } from './transactions.js';
import { getCars } from './cars.js';

/**
 * Calculate the equal share of profit per partner
 * @returns {number}
 */
export function calculateProfitPerPartner() {
  const partnerCount = getPartners().length;
  if (partnerCount === 0) return 0;

  const netProfit = getNetProfit();
  return netProfit / partnerCount;
}

/**
 * Calculate the financial breakdown for all partners
 * @returns {Array<object>} Array of { name, paidExpenses, profitShare, totalPayout }
 */
export function calculateFinancialBreakdown() {
  const partners = getPartners();
  const profitPerPartner = calculateProfitPerPartner();

  return partners.map(partner => ({
    name: partner,
    paidExpenses: getExpensesPaidBy(partner),
    profitShare: profitPerPartner,
    totalPayout: getExpensesPaidBy(partner) + profitPerPartner
  }));
}

/**
 * Get the summary of all financial data
 * @returns {object}
 */
export function getFinancialSummary() {
  return {
    totalIncome: getTotalIncome(),
    totalExpenses: getTotalExpenses(),
    netProfit: getNetProfit(),
    profitPerPartner: calculateProfitPerPartner(),
    breakdown: calculateFinancialBreakdown()
  };
}

/**
 * Calculate how much each partner owes or is owed
 * @returns {Array<object>} Array of { name, amount, status: 'owes'|'owed' }
 */
export function calculateBalances() {
  const breakdown = calculateFinancialBreakdown();

  return breakdown.map(item => {
    const balance = item.totalPayout;
    return {
      name: item.name,
      amount: Math.abs(balance),
      status: balance >= 0 ? 'receives' : 'owes'
    };
  });
}

/**
 * Calculate monthly profit by partner
 * @param {string} partner - Partner name
 * @returns {Array<object>} Array of { month, income, expenses, profit }
 */
export function calculateMonthlyProfitByPartner(partner) {
  const transactions = getTransactions();
  const partners = getPartners();
  const monthlyData = {};

  transactions.forEach(t => {
    const [month, day, year] = t.date.split('/');
    const monthKey = `${year}-${month.padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { month: monthKey, income: 0, expenses: 0, profit: 0 };
    }
    
    if (t.type === 'income') {
      monthlyData[monthKey].income += t.amt;
    } else if (t.type === 'expense' && t.paidBy === partner) {
      monthlyData[monthKey].expenses += t.amt;
    }
  });

  // Calculate profit for each month
  Object.keys(monthlyData).forEach(key => {
    const profitPerPartner = partners.length > 0 ? monthlyData[key].income / partners.length : 0;
    monthlyData[key].profit = profitPerPartner - monthlyData[key].expenses;
  });

  return Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month));
}

/**
 * Calculate income for a specific vehicle
 * @param {string} carId - Car ID
 * @returns {number}
 */
export function getIncomeForVehicle(carId) {
  return getTransactions()
    .filter(t => t.type === 'income' && t.carId === carId)
    .reduce((sum, t) => sum + t.amt, 0);
}

/**
 * Calculate expense for a specific vehicle
 * @param {string} carId - Car ID
 * @returns {number}
 */
export function getExpenseForVehicle(carId) {
  return getTransactions()
    .filter(t => t.type === 'expense' && t.carId === carId)
    .reduce((sum, t) => sum + t.amt, 0);
}

/**
 * Calculate net profit for a specific vehicle
 * @param {string} carId - Car ID
 * @returns {number}
 */
export function getNetProfitForVehicle(carId) {
  return getIncomeForVehicle(carId) - getExpenseForVehicle(carId);
}

/**
 * Get financial summary for all vehicles
 * @returns {Array<object>} Array of { carId, name, income, expense, profit, transactionCount }
 */
export function getVehicleFinancialSummary() {
  const cars = getCars();
  
  return cars.map(car => ({
    carId: car.id,
    name: car.name,
    registrationNumber: car.registrationNumber,
    photo: car.photo,
    income: getIncomeForVehicle(car.id),
    expense: getExpenseForVehicle(car.id),
    profit: getNetProfitForVehicle(car.id),
    transactionCount: getTransactions().filter(t => t.carId === car.id).length
  }));
}

/**
 * Get vehicle financial summary for a specific month
 * @param {string} monthKey - Month in YYYY-MM format
 * @returns {Array<object>} Array of { carId, name, registrationNumber, photo, income, expense, profit, transactionCount }
 */
export function getVehicleFinancialSummaryForMonth(monthKey) {
  const cars = getCars();
  
  return cars.map(car => {
    const monthTransactions = getTransactionsForMonth(monthKey).filter(t => t.carId === car.id);
    
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amt, 0);
    
    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amt, 0);
    
    const profit = income - expense;
    
    return {
      carId: car.id,
      name: car.name,
      registrationNumber: car.registrationNumber,
      photo: car.photo,
      income: income,
      expense: expense,
      profit: profit,
      transactionCount: monthTransactions.length
    };
  });
}

/**
 * Calculate monthly financial summary for a specific vehicle
 * @param {string} carId - Car ID
 * @returns {Array<object>} Array of { month, income, expense, profit }
 */
export function getMonthlyFinancialByVehicle(carId) {
  const transactions = getTransactions().filter(t => t.carId === carId);
  const monthlyData = {};

  transactions.forEach(t => {
    const [month, day, year] = t.date.split('/');
    const monthKey = `${year}-${month.padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { month: monthKey, income: 0, expense: 0, profit: 0 };
    }
    
    if (t.type === 'income') {
      monthlyData[monthKey].income += t.amt;
    } else if (t.type === 'expense') {
      monthlyData[monthKey].expense += t.amt;
    }
  });

  // Calculate profit for each month
  Object.keys(monthlyData).forEach(key => {
    monthlyData[key].profit = monthlyData[key].income - monthlyData[key].expense;
  });

  return Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month));
}

/**
 * Calculate expense share for each partner (equal split of all expenses)
 * @param {string} partner - Partner name (optional, returns all if not provided)
 * @returns {number} Partner's share of total expenses
 */
export function getPartnerExpenseShare(partner = null) {
  const partners = getPartners();
  const totalExpenses = getTotalExpenses();
  
  if (partners.length === 0) return 0;
  
  const expensePerPartner = totalExpenses / partners.length;
  return expensePerPartner;
}

/**
 * Calculate settlement for a partner
 * Settlement = Amount they paid - Their equal share of expenses
 * Positive means they get back money, Negative means they owe money
 * @param {string} partner - Partner name
 * @returns {number} Settlement amount
 */
export function calculatePartnerSettlement(partner) {
  const amountPaid = getExpensesPaidBy(partner);
  const expenseShare = getPartnerExpenseShare();
  
  return amountPaid - expenseShare;
}

/**
 * Get settlement details for all partners
 * @returns {Array<object>} Array of { name, amountPaid, shareOfExpenses, settlement, settlementType }
 */
export function getAllPartnerSettlements() {
  const partners = getPartners();
  const expensePerPartner = getPartnerExpenseShare();
  
  return partners.map(partner => {
    const amountPaid = getExpensesPaidBy(partner);
    const settlement = amountPaid - expensePerPartner;
    
    return {
      name: partner,
      amountPaid: amountPaid,
      shareOfExpenses: expensePerPartner,
      settlement: settlement,
      settlementType: settlement > 0 ? 'receives' : settlement < 0 ? 'owes' : 'settled'
    };
  });
}

/**
 * Calculate settlement for a partner within a specific vehicle
 * @param {string} partner - Partner name
 * @param {string} carId - Car ID
 * @returns {object} { amountPaid, shareOfExpenses, settlement, settlementType }
 */
export function calculateVehicleSettlement(partner, carId) {
  const transactions = getTransactions();
  
  // Calculate partner's expenses for this vehicle
  const amountPaid = transactions
    .filter(t => t.type === 'expense' && t.paidBy === partner && t.carId === carId)
    .reduce((sum, t) => sum + t.amt, 0);
  
  // Calculate total vehicle expenses and equal share
  const vehicleExpenses = getExpenseForVehicle(carId);
  const partners = getPartners();
  const expenseShare = partners.length > 0 ? vehicleExpenses / partners.length : 0;
  
  const settlement = amountPaid - expenseShare;
  
  return {
    amountPaid: amountPaid,
    shareOfExpenses: expenseShare,
    settlement: settlement,
    settlementType: settlement > 0 ? 'receives' : settlement < 0 ? 'owes' : 'settled'
  };
}

/**
 * Get transactions for a specific month (YYYY-MM format)
 * @param {string} monthKey - Month in YYYY-MM format (e.g., "2026-03")
 * @returns {Array<object>} Filtered transactions
 */
function getTransactionsForMonth(monthKey) {
  return getTransactions().filter(t => {
    const [month, day, year] = t.date.split('/');
    const tMonthKey = `${year}-${month.padStart(2, '0')}`;
    return tMonthKey === monthKey;
  });
}

/**
 * Calculate total income for a specific month
 * @param {string} monthKey - Month in YYYY-MM format
 * @returns {number}
 */
export function getTotalIncomeForMonth(monthKey) {
  return getTransactionsForMonth(monthKey)
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amt, 0);
}

/**
 * Calculate total expenses for a specific month
 * @param {string} monthKey - Month in YYYY-MM format
 * @returns {number}
 */
export function getTotalExpensesForMonth(monthKey) {
  return getTransactionsForMonth(monthKey)
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amt, 0);
}

/**
 * Calculate net profit for a specific month
 * @param {string} monthKey - Month in YYYY-MM format
 * @returns {number}
 */
export function getNetProfitForMonth(monthKey) {
  return getTotalIncomeForMonth(monthKey) - getTotalExpensesForMonth(monthKey);
}

/**
 * Get expenses paid by a partner in a specific month
 * @param {string} partner - Partner name
 * @param {string} monthKey - Month in YYYY-MM format
 * @returns {number}
 */
export function getExpensesPaidByForMonth(partner, monthKey) {
  return getTransactionsForMonth(monthKey)
    .filter(t => t.type === 'expense' && t.paidBy === partner)
    .reduce((sum, t) => sum + t.amt, 0);
}

/**
 * Calculate profit share per partner for a specific month
 * @param {string} monthKey - Month in YYYY-MM format
 * @returns {number}
 */
export function calculateProfitPerPartnerForMonth(monthKey) {
  const partnerCount = getPartners().length;
  if (partnerCount === 0) return 0;

  const netProfit = getNetProfitForMonth(monthKey);
  return netProfit / partnerCount;
}

/**
 * Get settlement for a partner in a specific month
 * @param {string} partner - Partner name
 * @param {string} monthKey - Month in YYYY-MM format
 * @returns {object} { amountPaid, shareOfExpenses, settlement, settlementType }
 */
export function getMonthlySettlement(partner, monthKey) {
  const partners = getPartners();
  const amountPaid = getExpensesPaidByForMonth(partner, monthKey);
  const totalMonthlyExpenses = getTotalExpensesForMonth(monthKey);
  const expenseShare = partners.length > 0 ? totalMonthlyExpenses / partners.length : 0;
  
  const settlement = amountPaid - expenseShare;
  
  return {
    amountPaid: amountPaid,
    shareOfExpenses: expenseShare,
    settlement: settlement,
    settlementType: settlement > 0 ? 'receives' : settlement < 0 ? 'owes' : 'settled'
  };
}

/**
 * Calculate vehicle settlement for a partner in a specific month
 * @param {string} partner - Partner name
 * @param {string} carId - Car ID
 * @param {string} monthKey - Month in YYYY-MM format
 * @returns {object} { amountPaid, shareOfExpenses, settlement, settlementType }
 */
export function calculateVehicleSettlementForMonth(partner, carId, monthKey) {
  // Get transactions for this month and vehicle only
  const monthTransactions = getTransactionsForMonth(monthKey)
    .filter(t => t.carId === carId);
  
  // Calculate partner's expenses for this vehicle in this month
  const amountPaid = monthTransactions
    .filter(t => t.type === 'expense' && t.paidBy === partner)
    .reduce((sum, t) => sum + t.amt, 0);
  
  // Calculate total vehicle expenses for this month and equal share
  const vehicleMonthlyExpenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amt, 0);
  
  const partners = getPartners();
  const expenseShare = partners.length > 0 ? vehicleMonthlyExpenses / partners.length : 0;
  
  const settlement = amountPaid - expenseShare;
  
  return {
    amountPaid: amountPaid,
    shareOfExpenses: expenseShare,
    settlement: settlement,
    settlementType: settlement > 0 ? 'receives' : settlement < 0 ? 'owes' : 'settled'
  };
}
