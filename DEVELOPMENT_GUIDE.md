# Development Guide

Quick reference for developing features in the Business Tracker app.

## Getting Started

### Prerequisites
- Node.js and npm installed
- A modern web browser
- Text editor (VS Code recommended)

### Installation & Running

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Server will run on http://localhost:3000
```

## Workflow for Adding Features

### 1. **New Calculation Feature**
If you need a new financial calculation:

1. Add function to `public/js/modules/calculator.js`
2. Import and use in `modules/ui.js` for rendering
3. Or use in `modules/transactions.js` for logic

**Example: Add "Breakdown by Expense Category"**
```javascript
// In calculator.js
export function calculateByCategory() {
  const transactions = getTransactionsByType('expense');
  const categories = {};
  // ... group logic ...
  return categories;
}
```

### 2. **New Input Field**
To add a new input to forms:

1. Add `<input>` to `index.html`
2. Add validator to `utils/validators.js` if needed
3. Update `handleAddTransaction()` in `main.js`
4. Update transaction/partner modules if storing data
5. Update `modules/ui.js` to display the data

**Example: Add "Category" field to expenses**
```javascript
// Step 1: HTML
<input type="text" id="category" placeholder="Category">

// Step 2: Validator
export function validateCategory(category) {
  if (!category.trim()) return { isValid: false, error: 'Category required' };
  return { isValid: true, error: '' };
}

// Step 3: Main.js
async function handleAddTransaction() {
  const category = document.getElementById('category').value;
  const transactionData = { ..., category };
  // ...
}

// Step 4: Update transaction module to store it
const transaction = { ..., category };

// Step 5: Update UI to display it
// In renderTransactionHistory()
<div>${t.category}</div>
```

### 3. **New Status Indicator or Badge**
To show live updates:

1. Create display element in `index.html`
2. Create update function in `modules/ui.js`
3. Call from `renderAll()` or after specific actions

**Example: Show "Last Updated" timestamp**
```javascript
// HTML
<div id="lastUpdated" class="text-xs text-gray-400"></div>

// ui.js
export function renderLastUpdated() {
  const timestamp = new Date().toLocaleTimeString();
  document.getElementById('lastUpdated').innerText = `Updated: ${timestamp}`;
}

// main.js
// Add to renderAll() call
renderLastUpdated();
```

### 4. **New Modal or Popup**
To add a new dialog:

1. Add HTML structure to `index.html`
2. Create toggle function in `main.js`
3. Add to `window.appEvents` for onclick handlers

**Example: Add "Confirm Delete" Dialog**
```javascript
// HTML
<div id="confirmDialog" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center">
  <div class="bg-white p-8 rounded-lg">
    <p id="confirmMessage">Are you sure?</p>
    <button onclick="window.appEvents.confirmYes()">Yes</button>
    <button onclick="window.appEvents.confirmNo()">No</button>
  </div>
</div>

// main.js
function showConfirmDialog(message, onYes) {
  document.getElementById('confirmMessage').innerText = message;
  window.appEvents.confirmYes = onYes;
  document.getElementById('confirmDialog').classList.remove('hidden');
}

window.appEvents.confirmNo = () => {
  document.getElementById('confirmDialog').classList.add('hidden');
};

// Usage
async function handleDeletePartner(name) {
  showConfirmDialog(`Delete ${name}?`, async () => {
    await removePartner(name);
    document.getElementById('confirmDialog').classList.add('hidden');
    renderAll();
  });
}
```

### 5. **New Data Export Feature**
Add to `public/js/utils/exporters.js`:

```javascript
export function exportAsCSV() {
  const transactions = getTransactions();
  let csv = 'Date,Description,Type,Amount,Paid By\n';
  
  transactions.forEach(t => {
    csv += `${t.date},"${t.desc}",${t.type},${t.amt},"${t.paidBy}"\n`;
  });
  
  // Trigger download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transactions.csv';
  a.click();
}
```

Then use in HTML:
```javascript
// main.js - Add to window.appEvents
export: () => exportAsCSV(),

// HTML
<button onclick="window.appEvents.export()">Export CSV</button>
```

## Common Tasks

### Update Firebase Config
Edit `public/js/config/firebase-config.js` with your credentials.

### Add New Validation Rule
1. Add function to `public/js/utils/validators.js`
2. Call in appropriate module before data save
3. Return `{ isValid: boolean, error: string }`

### Fix a Bug
1. Open DevTools (F12)
2. Check Console for errors
3. Add `console.log()` in relevant module
4. Test fix locally
5. Clear browser cache if needed

### Debug Data Issues
```javascript
// In browser console:
localStorage.getItem('local_partners');
localStorage.getItem('local_transactions');

// Clear all data:
localStorage.clear();
```

## Best Practices

✅ **Do:**
- Keep modules focused on one responsibility
- Write clear function names and JSDoc comments
- Test in browser DevTools before pushing changes
- Use `renderAll()` after data changes to update UI
- Handle errors with try-catch in async functions
- Validate all user inputs

❌ **Don't:**
- Mix business logic with UI rendering
- Direct DOM manipulation outside `ui.js`
- Global variables (use modules instead)
- Hardcode values (use config file)
- Forget to handle Firebase failures gracefully
- Change HTML IDs without updating JavaScript

## Testing Checklist

When adding a feature:
- [ ] Add a partner and verify display
- [ ] Add a transaction and verify calculations
- [ ] Check LocalStorage in DevTools
- [ ] Test with empty data
- [ ] Test error messages
- [ ] Verify console has no errors
- [ ] Test on mobile (DevTools device mode)
- [ ] Test with data that has special characters
- [ ] Verify UI updates on all state changes

## Deployment

The app is static and ready for Firebase Hosting:

```bash
# Deploy to Firebase
firebase login
firebase deploy

# Or deploy anywhere that serves static files
# Just upload the public/ folder
```

## IDE Setup (VS Code)

Recommended extensions:
- `es7-extensions` - ES6 syntax
- `Prettier` - Code formatter
- `ESLint` - JavaScript linter
- `Tailwind CSS IntelliSense` - Tailwind support

Settings (`.vscode/settings.json`):
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "files.autoSave": "afterDelay"
}
```

## Performance Tips

- Modules are loaded once at startup
- UI re-renders only when `renderAll()` is called
- LocalStorage is fast for this data size
- Firebase sync happens in background without blocking UI

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Changes not showing | Call `renderAll()` after data change |
| Firebase not syncing | Check API key in config file |
| Data lost on refresh | Check localStorage in DevTools |
| Functions undefined | Check imports at top of file |
| Styles not applying | Check Tailwind class names (no typos) |

---

**Need Help?** Check PROJECT_STRUCTURE.md for detailed module documentation.
