# Project Structure Guide

This document explains the refactored Business Tracker project structure and how to work with it.

## 📁 Folder Structure

```
public/
├── index.html                 # Main HTML file (minimal, only contains UI markup)
├── css/
│   ├── custom.css            # Custom CSS styles
│   └── tailwind.css          # Tailwind CSS (CDN imported in HTML)
├── js/
│   ├── main.js               # Application entry point (orchestrator)
│   ├── config/
│   │   └── firebase-config.js        # Firebase configuration (API keys, etc)
│   ├── modules/              # Core business logic (separated by feature)
│   │   ├── partners.js       # Partner management logic
│   │   ├── transactions.js   # Transaction management logic
│   │   ├── storage.js        # Local storage operations
│   │   ├── calculator.js     # Financial calculations
│   │   └── ui.js             # UI rendering functions
│   ├── services/             # External integrations
│   │   └── firebase-service.js       # Firebase database operations
│   └── utils/                # Helper functions
│       ├── formatters.js     # Data formatting utilities
│       └── validators.js     # Input validation utilities
```

## 🎯 Module Responsibilities

### `modules/partners.js`
- Managing partner list
- Adding/removing partners
- Partner validation
- Partner storage sync

**Key Functions:**
- `initPartners()` - Load partners from storage
- `getPartners()` - Get all partners
- `addPartner(name)` - Add new partner
- `removePartner(name)` - Remove partner
- `setPartners(newPartners)` - Set partners (cloud sync)

### `modules/transactions.js`
- Managing financial transactions
- Income/expense tracking
- Transaction calculations
- Transaction persistence

**Key Functions:**
- `initTransactions()` - Load transactions from storage
- `getTransactions()` - Get all transactions
- `addTransaction(data)` - Add new transaction
- `deleteTransaction(id)` - Delete transaction
- `getTotalIncome()` - Calculate total income
- `getTotalExpenses()` - Calculate total expenses
- `getNetProfit()` - Calculate net profit

### `modules/calculator.js`
- Financial calculations
- Profit sharing
- Balance calculations
- Financial breakdown

**Key Functions:**
- `calculateProfitPerPartner()` - Calculate equal share
- `calculateFinancialBreakdown()` - Get breakdown by partner
- `getFinancialSummary()` - Get complete summary
- `calculateBalances()` - Calculate who owes/receives

### `modules/storage.js`
- Local storage management
- Data persistence
- Storage initialization

**Key Functions:**
- `getPartnersFromStorage()` - Read partners
- `savePartnersToStorage(data)` - Save partners
- `getTransactionsFromStorage()` - Read transactions
- `saveTransactionsToStorage(data)` - Save transactions
- `clearAllStorage()` - Clear all data

### `modules/ui.js`
- DOM rendering
- UI state management
- User feedback

**Key Functions:**
- `renderPartners()` - Render partner list
- `renderFinancialSummary()` - Render summary cards
- `renderBreakdown()` - Render breakdown table
- `renderTransactionHistory()` - Render transaction log
- `renderAll()` - Render all UI elements
- `showError(message)` - Display error
- `showSuccess(message)` - Display success

### `services/firebase-service.js`
- Firebase initialization
- Cloud database operations
- Real-time sync subscription
- Connection status

**Key Functions:**
- `initializeFirebase()` - Setup Firebase
- `isFirebaseConnected()` - Check connection
- `subscribeToPartners(callback)` - Subscribe to changes
- `subscribeToTransactions(callback)` - Subscribe to changes
- `addPartnerToCloud(name)` - Cloud write
- `deleteTransactionFromCloud(id)` - Cloud delete

### `utils/formatters.js`
- Currency formatting
- Date formatting
- String utilities

**Key Functions:**
- `formatCurrency(amount)` - Format as currency
- `formatDate(date)` - Format as date string
- `getCurrentDate()` - Get today's date
- `capitalize(str)` - Capitalize string

### `utils/validators.js`
- Input validation
- Data integrity checks
- Error messages

**Key Functions:**
- `validatePartnerName(name)` - Validate partner name
- `validateAmount(amount)` - Validate amount
- `validateDescription(desc)` - Validate description
- `validateTransaction(data)` - Validate all transaction fields

## 🚀 How to Add New Features

### Example: Add a Notes Field to Transactions

1. **Update Storage (storage.js)**
   - No changes needed (already saves complete objects)

2. **Update Transaction Module (modules/transactions.js)**
   ```javascript
   // Modify addTransaction to accept notes
   export async function addTransaction(transactionData) {
     // ... validation ...
     const transaction = {
       // ... existing fields ...
       notes: transactionData.notes || '',  // Add this
     };
   }
   ```

3. **Update UI Module (modules/ui.js)**
   ```javascript
   export function renderTransactionHistory() {
     // ... modify template to show notes ...
   }
   ```

4. **Update HTML (index.html)**
   ```html
   <input type="text" id="notes" placeholder="Notes (optional)">
   ```

5. **Update Main (main.js)**
   ```javascript
   async function handleAddTransaction() {
     const transactionData = {
       // ... existing fields ...
       notes: document.getElementById('notes').value,
     };
     // ... rest of code ...
   }
   ```

## 🔄 Data Flow

```
User Action (Click Button)
         ↓
main.js (Event Handler)
         ↓
modules/* (Validate & Update State)
         ↓
services/* (Sync to Cloud if available)
         ↓
storage.js (Save to LocalStorage)
         ↓
ui.js (Re-render UI)
```

## 🔧 Development Tips

### Adding a New Module
1. Create `public/js/modules/your-module.js`
2. Define clear functions with JSDoc comments
3. Import in `main.js` if needed
4. Use consistent naming conventions

### Adding a Utility Function
1. Add to appropriate file in `utils/`
2. Export the function
3. Import where needed
4. Test with sample data

### Debugging
- Open browser DevTools (F12)
- Check Console for errors
- LocalStorage data is visible in DevTools
- Firebase operations log to console

### Testing Locally
- App works fully in localStorage without Firebase
- Set invalid Firebase credentials to test local mode
- Use DevTools to inspect localStorage data
- Clear storage: `localStorage.clear()` in console

## 📦 Dependencies

- **Tailwind CSS** - CDN (no installation needed)
- **Firebase** - CDN (Compatibility version)
- **serve** - Local dev server (`npm start`)

## 🔐 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Realtime Database
4. Update `config/firebase-config.js` with your credentials
5. Set database rules to: `{ ".read": true, ".write": true }` (for testing only)

## 📝 Naming Conventions

- **Methods**: camelCase, action verbs (`addPartner`, `deleteTransaction`)
- **Variables**: camelCase (`partnerName`, `totalIncome`)
- **Files**: kebab-case (`firebase-config.js`, `firebase-service.js`)
- **Functions**: Exported as `export function name() {}`
- **Comments**: JSDoc style for functions with params and returns

## 🎓 Learning Path for Contributors

1. Start with `main.js` - understand the flow
2. Read `modules/partners.js` - simple state management
3. Read `modules/transactions.js` - more complex logic
4. Read `modules/calculator.js` - pure calculation functions
5. Read `services/firebase-service.js` - external integration
6. Read `modules/ui.js` - DOM manipulation
7. Understand `utils/*` - helper patterns

## 🔮 Future Enhancements Ready

This structure makes it easy to add:
- **Authentication** - Add auth module
- **Reports** - Add reporting module
- **Analytics** - Add analytics module
- **Multiple Business** - Add business selection
- **User Profiles** - Extend partners module
- **Data Export** - Add export utilities
- **Notifications** - Add notification service
- **Offline Sync** - Enhance storage module

---

**Questions?** Check the code comments or refer to specific module documentation.
