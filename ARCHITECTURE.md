# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI Layer                                │
│                  (HTML + Tailwind CSS)                          │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │ index.html - Clean markup with IDs for logic binding    │  │
│   │ css/ - Styling (custom.css + Tailwind CDN)              │  │
│   └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                            │
│                      (main.js)                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │ - Orchestrates modules                                  │  │
│   │ - Handles user events                                   │  │
│   │ - Coordinates state and UI updates                      │  │
│   └──────────────────────────────────────────────────────────┘  │
└──────┬──────────────────┬──────────────────┬───────────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│   Business     │ │    External    │ │  Utilities     │
│    Logic       │ │  Integrations  │ │                │
│   (modules/)   │ │   (services/)  │ │   (utils/)     │
└────────────────┘ └────────────────┘ └────────────────┘
       │                  │                  │
       ├─ partners       ├─ firebase       ├─ formatters
       ├─ transactions   │                 └─ validators
       ├─ calculator     │
       ├─ storage        │
       └─ ui             │
       
       ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                 │
│  ┌──────────────┐              ┌──────────────┐               │
│  │ Local Storage│◄────────────►│ Config File  │               │
│  │ (Browser)    │              │ (Firebase)   │               │
│  └──────────────┘              └──────────────┘               │
└───────────────────────┬──────────────────────┬──────────────────┘
                        │                      │
                        ▼                      ▼
                  ┌─────────────┐      ┌──────────────┐
                  │  Fallback   │      │   Cloud DB   │
                  │(No Internet)│      │ (Firebase RT)│
                  └─────────────┘      └──────────────┘
```

## Data Flow

### Adding a Partner
```
User clicks "Add" button
         │
         ▼
main.js: handleAddPartner()
         │
         ├─ Get input value from DOM
         ├─ Validate with validators.js
         │
         ▼
partners.js: addPartner()
         │
         ├─ Check if exists
         ├─ Add to partners array
         ├─ Save to storage.js
         │
         ├─ If Firebase connected
         │  └─ Sync to firebase-service.js
         │
         ▼
main.js
         │
         └─ Call renderAll()
                    │
                    ├─ ui.js: renderPartners()
                    ├─ ui.js: renderPaidByDropdown()
                    ├─ ui.js: renderBreakdown()
                    │
                    ▼
              DOM Updated
              Show success message
              Clear input fields
```

### Adding a Transaction
```
User fills form and clicks "Add"
         │
         ▼
main.js: handleAddTransaction()
         │
         ├─ Collect form data
         ├─ Validate with validators.js
         │
         ▼
transactions.js: addTransaction()
         │
         ├─ Create transaction object
         ├─ Add to transactions array
         ├─ Save to storage.js
         │
         ├─ If Firebase connected
         │  └─ Push to firebase-service.js
         │     └─ Get cloud ID
         │
         ▼
calculator.js (used by ui.js)
         │
         ├─ Recalculate totals
         ├─ Recalculate profit shares
         ├─ Generate breakdown
         │
         ▼
main.js
         │
         └─ Call renderAll()
                    │
                    ├─ ui.js: renderFinancialSummary()
                    ├─ ui.js: renderBreakdown()
                    ├─ ui.js: renderTransactionHistory()
                    │
                    ▼
              DOM Updated
              Show success message
              Clear input fields
```

### Real-time Cloud Sync
```
Cloud Data Changes (from other users)
         │
         ▼
firebase-service.js: subscribeToPartners/Transactions()
         │
         ├─ Callback triggered
         │
         ▼
main.js: Subscription handler
         │
         ├─ Call setPartners() or setTransactions()
         │
         ▼
modules update internal state
         │
         ├─ Save to local storage
         │
         ▼
main.js
         │
         └─ Call renderAll()
                    │
                    ▼
              DOM Updated
              (User sees changes from other users)
```

## Module Dependencies

```
main.js (Entry Point)
    ├── imports → partners.js
    │   ├── imports → storage.js
    │   ├── imports → validators.js
    │   └── imports → firebase-service.js
    │
    ├── imports → transactions.js
    │   ├── imports → storage.js
    │   ├── imports → validators.js
    │   ├── imports → formatters.js
    │   └── imports → firebase-service.js
    │
    ├── imports → calculator.js
    │   ├── imports → partners.js
    │   └── imports → transactions.js
    │
    ├── imports → ui.js
    │   ├── imports → formatters.js
    │   ├── imports → partners.js
    │   └── imports → calculator.js
    │
    ├── imports → firebase-service.js
    │   └── imports → firebase-config.js
    │
    └── imports → storage.js
```

## State Management

```
┌─────────────────────────────────────────┐
│         In-Memory State                 │
├─────────────────────────────────────────┤
│ partners: string[]                      │
│ transactions: Transaction[]             │
└─────────────────────────────────────────┘
         │          │
         │          └──── Persisted to LocalStorage
         │                (modules/storage.js)
         │
         └──── Exported to Cloud
              (services/firebase-service.js)

Transaction Object:
{
  id: string,          // Unique identifier
  type: 'income' | 'expense',
  desc: string,        // Description
  amt: number,         // Amount in dollars
  paidBy: string,      // Partner who paid (if expense)
  date: string,        // MM/DD/YYYY
  ts: number          // Timestamp in milliseconds
}
```

## Error Handling Strategy

```
User Action
    │
    ▼
Validation Layer
    │
    ├─ Invalid? → Show error message
    │
    ▼
Business Logic Layer
    │
    ├─ Error? → Log to console, show error message
    │
    ▼
Firebase Service (Optional)
    │
    ├─ Fails? → Fall back to local storage
    │           Log to console
    │           Continue working offline
    │
    ▼
Success → Update UI → Show success message
```

## Scalability Path

```
Current: Vanilla JS + Modules
         │
         │ If adding 15+ features
         │ or complex UI interactions
         │
         ▼
Next Phase: Migrate to React or Vue
         │
         ├─ Modules → Components
         ├─ Validators → Form hooks
         ├─ Calculator → Custom hooks
         │
         ▼
Advanced Phase: Add Webpack/Vite
         │
         ├─ Import optimization
         ├─ Code splitting
         ├─ Build optimization
         │
         ▼
Enterprise Phase: Add testing, CI/CD
         │
         ├─ Unit tests (Jest)
         ├─ Integration tests
         ├─ E2E tests (Cypress)
         ├─ GitHub Actions
```

---

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Easy to test
- ✅ Easy to scale
- ✅ Easy to maintain
- ✅ Easy to add features
