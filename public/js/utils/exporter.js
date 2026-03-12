/**
 * Export utility functions for various file formats
 */

import { formatCurrency, formatDate } from './formatters.js';
import { getCarById } from '../modules/cars.js';

/**
 * Export transactions as CSV
 * @param {Array<object>} transactions - Transactions to export
 * @returns {void}
 */
export function exportAsCSV(transactions) {
  if (transactions.length === 0) {
    alert('No transactions to export');
    return;
  }

  let csv = 'Date,Vehicle,Description,Type,Amount (₹)\n';

  transactions.forEach(t => {
    const amount = t.amt.toString().replace(',', '');
    const carName = t.carId ? (getCarById(t.carId)?.name || '-') : '-';
    csv += `"${t.date}","${carName}","${t.desc}","${t.type}","${amount}"\n`;
  });

  // Trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `fleet_expenses_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export transactions as Excel (using a simple HTML table approach)
 * For production, consider using libraries like xlsx
 * @param {Array<object>} transactions - Transactions to export
 * @returns {void}
 */
export function exportAsExcel(transactions) {
  if (transactions.length === 0) {
    alert('No transactions to export');
    return;
  }

  let html = '<table border="1"><tr><th>Date</th><th>Vehicle</th><th>Description</th><th>Type</th><th>Amount (₹)</th></tr>';

  transactions.forEach(t => {
    const carName = t.carId ? (getCarById(t.carId)?.name || '-') : '-';
    html += `<tr><td>${t.date}</td><td>${carName}</td><td>${t.desc}</td><td>${t.type}</td><td>${t.amt}</td></tr>`;
  });

  html += '</table>';

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `fleet_expenses_${new Date().toISOString().split('T')[0]}.xls`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export transactions as PDF (simple HTML to PDF using print)
 * For production, consider using libraries like jsPDF or html2pdf
 * @param {Array<object>} transactions - Transactions to export
 * @returns {void}
 */
export function exportAsPDF(transactions) {
  if (transactions.length === 0) {
    alert('No transactions to export');
    return;
  }

  const docTitle = `Fleet Expense Report - ${new Date().toLocaleDateString('en-IN')}`;
  
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${docTitle}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #06b6d4; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .summary { margin-top: 30px; font-size: 14px; }
        .summary-item { margin: 10px 0; }
      </style>
    </head>
    <body>
      <h1>${docTitle}</h1>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Vehicle</th>
            <th>Description</th>
            <th>Type</th>
            <th>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
  `;

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amt, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amt, 0);

  transactions.forEach(t => {
    const carName = t.carId ? (getCarById(t.carId)?.name || '-') : '-';
    htmlContent += `
      <tr>
        <td>${t.date}</td>
        <td>${carName}</td>
        <td>${t.desc}</td>
        <td>${t.type}</td>
        <td>${formatCurrency(t.amt)}</td>
      </tr>
    `;
  });

  htmlContent += `
        </tbody>
      </table>
      <div class="summary">
        <div class="summary-item"><strong>Total Income:</strong> ${formatCurrency(totalIncome)}</div>
        <div class="summary-item"><strong>Total Expenses:</strong> ${formatCurrency(totalExpense)}</div>
        <div class="summary-item"><strong>Net Profit:</strong> ${formatCurrency(totalIncome - totalExpense)}</div>
      </div>
    </body>
    </html>
  `;

  // Open in new window and trigger print
  const printWindow = window.open('', '', 'height=600,width=800');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Trigger print dialog
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

/**
 * Generate summary statistics for export
 * @param {Array<object>} transactions
 * @returns {object}
 */
export function generateSummary(transactions) {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amt, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amt, 0);

  const netProfit = totalIncome - totalExpense;

  return {
    totalIncome,
    totalExpense,
    netProfit,
    transactionCount: transactions.length
  };
}
