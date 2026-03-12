/**
 * Main Application Entry Point
 * Orchestrates all modules and handles user interactions
 */

import { initPartners, addPartner, removePartner, getPartners, setPartners } from './modules/partners.js';
import { initTransactions, addTransaction, deleteTransaction, setTransactions } from './modules/transactions.js';
import { renderAll, clearInputs, showError, showSuccess } from './modules/ui.js';
import { initializeFirebase, isFirebaseConnected, subscribeToPartners, subscribeToTransactions, clearAllCloudData } from './services/firebase-service.js';
import { getPartnersFromStorage, getTransactionsFromStorage, clearAllStorage } from './modules/storage.js';

// ============= INITIALIZATION =============

/**
 * Initialize the application
 */
async function initializeApp() {
  // Initialize local data
  initPartners();
  initTransactions();

  // Render initial UI
  renderAll();

  // Initialize Firebase
  const firebaseReady = await initializeFirebase();
  updateConnectionStatus(firebaseReady);

  // Setup Firebase sync if available
  if (firebaseReady) {
    subscribeToPartners((cloudPartners) => {
      setPartners(cloudPartners);
      renderAll();
    });

    subscribeToTransactions((cloudTransactions) => {
      setTransactions(cloudTransactions);
      renderAll();
    });
  }

  // Setup event listeners
  setupEventListeners();
}

/**
 * Setup DOM event listeners
 */
function setupEventListeners() {
  // Partner input enter key
  document.getElementById('partnerName').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddPartner();
  });

  // Transaction form enter key
  document.getElementById('amount').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddTransaction();
  });

  // Transaction type change
  document.getElementById('transType').addEventListener('change', togglePartnerSelect);
}

// ============= EVENT HANDLERS =============

/**
 * Handle adding a new partner
 */
async function handleAddPartner() {
  const input = document.getElementById('partnerName');
  const name = input.value.trim();

  if (!name) {
    showError('Please enter a partner name');
    return;
  }

  const result = await addPartner(name);
  
  if (result.success) {
    showSuccess(`Partner "${name}" added`);
    clearInputs();
    renderAll();
  } else {
    showError(result.error);
  }
}

/**
 * Handle removing a partner
 */
async function handleRemovePartner(partnerName) {
  if (!confirm(`Remove ${partnerName}?`)) {
    return;
  }

  const result = await removePartner(partnerName);
  
  if (result.success) {
    showSuccess(`Partner removed`);
    renderAll();
  } else {
    showError(result.error);
  }
}

/**
 * Handle adding a new transaction
 */
async function handleAddTransaction() {
  const type = document.getElementById('transType').value;
  const desc = document.getElementById('desc').value;
  const amount = document.getElementById('amount').value;
  const paidBy = document.getElementById('paidBy').value;

  const transactionData = {
    type,
    desc,
    amount,
    paidBy: type === 'expense' ? paidBy : ''
  };

  const result = await addTransaction(transactionData);

  if (result.success) {
    showSuccess('Transaction added');
    clearInputs();
    renderAll();
  } else {
    showError(result.error);
  }
}

/**
 * Handle deleting a transaction
 */
async function handleDeleteTransaction(transactionId) {
  if (!confirm('Delete this transaction?')) {
    return;
  }

  const result = await deleteTransaction(transactionId);

  if (result.success) {
    showSuccess('Transaction deleted');
    renderAll();
  } else {
    showError(result.error);
  }
}

/**
 * Handle clearing all data
 */
async function handleClearAllData() {
  if (!confirm('This will delete all partners and transactions. Are you sure?')) {
    return;
  }

  clearAllStorage();
  
  if (isFirebaseConnected()) {
    await clearAllCloudData();
  }

  initPartners();
  initTransactions();
  renderAll();
  showSuccess('All data cleared');
}

// ============= UI HELPERS =============

/**
 * Toggle the "Paid By" partner select visibility
 */
function togglePartnerSelect() {
  const transType = document.getElementById('transType').value;
  const container = document.getElementById('paidByContainer');
  const partners = getPartners();

  if (transType === 'expense' && partners.length > 0) {
    container.classList.remove('hidden');
  } else {
    container.classList.add('hidden');
  }
}

/**
 * Update connection status indicator
 */
function updateConnectionStatus(isConnected) {
  const dot = document.getElementById('connDot');
  const txt = document.getElementById('connStatus');

  if (isConnected) {
    dot.className = 'status-dot bg-emerald-400';
    txt.innerText = 'Cloud Synced';
  } else {
    dot.className = 'status-dot bg-amber-400';
    txt.innerText = 'Local Mode (No Config)';
  }
}

/**
 * Toggle the troubleshoot guide modal
 */
function toggleGuide() {
  const modal = document.getElementById('guideModal');
  modal.classList.toggle('hidden');
}

// ============= WINDOW EXPORTS =============
// Make functions global for HTML onclick handlers

window.appEvents = {
  addPartner: handleAddPartner,
  removePartner: handleRemovePartner,
  addTransaction: handleAddTransaction,
  deleteTransaction: handleDeleteTransaction,
  clearAllData: handleClearAllData,
  togglePartnerSelect,
  toggleGuide
};

// ============= START APP =============

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
