/**
 * Calculator Module
 * Handles all financial calculations
 */

import { getPartners } from './partners.js';
import { getTotalIncome, getTotalExpenses, getNetProfit, getExpensesPaidBy } from './transactions.js';

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
