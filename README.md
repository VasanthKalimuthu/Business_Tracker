# Business Income & Expense Splitter 📊

A collaborative financial tracking system designed for business partnerships and project-based ventures. This tool automates the process of tracking individual out-of-pocket expenses and shared income to calculate fair monthly profit distributions.

## 🚀 Overview
When multiple partners run a business, tracking who spent what can become complicated. This project provides a structured ledger where:
1. Partners log their individual expenses.
2. Shared business income is recorded.
3. The system automatically calculates the "Settlement Payout" for each partner.

## 🧮 The Business Formula
The tracker uses a specific settlement logic to ensure fairness:

**Final Payout = (Individual Share of Net Profit) + (Individual Out-of-Pocket Reimbursement)**

In simpler terms:
- The business first identifies the total net profit.
- It then "repays" the partner for what they spent.
- Finally, it adds their equal share of the remaining profit.

## 🛠️ Features
- **Individual Tagging:** Expenses are tagged to specific partners to ensure accurate reimbursement.
- **Automated Summaries:** Real-time calculation of total spend, total income, and net margins.
- **Error Reduction:** Uses data validation (dropdowns) to ensure consistent data entry.
- **CSV Ready:** Structured format compatible with Google Sheets, Excel, and automated RAG pipelines.

## 📋 File Structure
- `Transactions.csv`: The raw data entry sheet for daily logs.
- `Summary_Logic.md`: Documentation of the formulas used for profit splitting.

## 📖 How to Use
1. **Log Data:** Enter every transaction in the `Transactions` tab/file. 
2. **Assign Names:** Ensure the "Name" matches the partner who paid for the expense.
3. **Review Summary:** Check the Summary sheet at the end of the month to see the final payout amounts for each partner.

---
*Developed for transparent business financial management.*
