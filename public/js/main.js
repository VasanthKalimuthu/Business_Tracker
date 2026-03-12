/**
 * Main Application Entry Point
 * Orchestrates all modules and handles user interactions
 */

import { initPartners, addPartner, removePartner, getPartners, setPartners } from './modules/partners.js';
import { initTransactions, addTransaction, deleteTransaction, setTransactions } from './modules/transactions.js';
import { initCars, getCars, setCars, addCar, removeCar, getCarCount, getCarById } from './modules/cars.js';
import { renderAll, clearInputs, showError, showSuccess, setSelectedMonth, setSelectedCar, getTransactionsForExport } from './modules/ui.js';
import { initializeFirebase, isFirebaseConnected, subscribeToPartners, subscribeToTransactions, subscribeToCars, clearAllCloudData } from './services/firebase-service.js';
import { getPartnersFromStorage, getTransactionsFromStorage, getCarsFromStorage, clearAllStorage } from './modules/storage.js';
import { exportAsCSV, exportAsExcel, exportAsPDF } from './utils/exporter.js';
import { validateCarDetails } from './utils/validators.js';

// ============= STATE =============
let confirmAction = null; // Stores the callback for confirmation actions

/**
 * Show confirmation modal
 * @param {string} title - Modal title
 * @param {string} message - Confirmation message
 * @param {function} onConfirm - Callback if user confirms
 */
function showConfirmModal(title, message, onConfirm) {
  document.getElementById('confirmTitle').innerText = title;
  document.getElementById('confirmMessage').innerText = message;
  confirmAction = onConfirm;
  document.getElementById('confirmModal').classList.remove('hidden');
}

/**
 * Hide confirmation modal
 */
function hideConfirmModal() {
  document.getElementById('confirmModal').classList.add('hidden');
  confirmAction = null;
}

// ============= INITIALIZATION =============

/**
 * Initialize the application
 */
async function initializeApp() {
  // Initialize local data
  initPartners();
  initTransactions();
  initCars();

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

    subscribeToCars((cloudCars) => {
      setCars(cloudCars);
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
  const carId = document.getElementById('carSelect').value;
  const date = document.getElementById('transDate').value;

  if (!carId) {
    showError('Please select a vehicle');
    return;
  }

  if (!desc || !amount) {
    showError('Please fill in all fields');
    return;
  }

  const transactionData = {
    type,
    desc,
    amount,
    carId: carId,
    date: date || null
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
  showConfirmModal(
    'Delete Transaction',
    'Are you sure you want to delete this transaction?',
    async () => {
      const result = await deleteTransaction(transactionId);
      hideConfirmModal();

      if (result.success) {
        showSuccess('Transaction deleted');
        renderAll();
      } else {
        showError(result.error);
      }
    }
  );
}

/**
 * Handle clearing all data
 */
function handleClearAllData() {
  showConfirmModal(
    'Reset All Data',
    'This will delete all partners and transactions. This action cannot be undone!',
    async () => {
      clearAllStorage();
      
      if (isFirebaseConnected()) {
        await clearAllCloudData();
      }

      initPartners();
      initTransactions();
      renderAll();
      hideConfirmModal();
      showSuccess('All data cleared');
    }
  );
}

/**
 * Handle filtering transactions by month and car
 */
function handleFilterByMonth() {
  const monthInput = document.getElementById('filterMonth').value;
  const carInput = document.getElementById('filterCar').value;
  
  setSelectedMonth(monthInput || null);
  setSelectedCar(carInput || null);
  
  renderAll();
  
  if (monthInput || carInput) {
    showSuccess('Filters applied');
  } else {
    showSuccess('Filters cleared');
  }
}

/**
 * Handle CSV download
 */
function handleDownloadCSV() {
  const transactions = getTransactionsForExport();
  
  if (transactions.length === 0) {
    showError('No transactions to export');
    return;
  }
  
  exportAsCSV(transactions);
  showSuccess('CSV downloaded');
}

/**
 * Handle Excel download
 */
function handleDownloadExcel() {
  const transactions = getTransactionsForExport();
  
  if (transactions.length === 0) {
    showError('No transactions to export');
    return;
  }
  
  exportAsExcel(transactions);
  showSuccess('Excel file downloaded');
}

/**
 * Handle PDF download
 */
function handleDownloadPDF() {
  const transactions = getTransactionsForExport();
  
  if (transactions.length === 0) {
    showError('No transactions to export');
    return;
  }
  
  exportAsPDF(transactions);
  showSuccess('PDF generated');
}

/**
 * Handle reset with confirmation
 */
function handleConfirmReset() {
  handleClearAllData();
}

/**
 * Confirm modal: Confirm button clicked
 */
function handleConfirmAction() {
  if (confirmAction) {
    confirmAction();
  } else {
    hideConfirmModal();
  }
}

/**
 * Confirm modal: Cancel button clicked
 */
function handleConfirmCancel() {
  hideConfirmModal();
}

// ============= CAR HANDLERS =============

/**
 * Open add car modal
 */
function handleOpenAddCarModal() {
  document.getElementById('addCarModal').classList.remove('hidden');
}

/**
 * Close add car modal
 */
function handleCloseAddCarModal() {
  document.getElementById('addCarModal').classList.add('hidden');
  // Clear all car form inputs
  document.getElementById('carName').value = '';
  document.getElementById('carModel').value = '';
  document.getElementById('carRego').value = '';
  document.getElementById('carPhoto').value = '';
  document.getElementById('photoPreview').classList.add('hidden');
}

/**
 * Preview car photo
 */
function handlePreviewCarPhoto() {
  const fileInput = document.getElementById('carPhoto');
  const previewDiv = document.getElementById('photoPreview');
  const previewImg = document.getElementById('photoPreviewImg');

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewDiv.classList.remove('hidden');
    };
    reader.readAsDataURL(fileInput.files[0]);
  }
}

/**
 * Handle adding a new car
 */
async function handleAddCar() {
  const name = document.getElementById('carName').value.trim();
  const model = document.getElementById('carModel').value.trim();
  const rego = document.getElementById('carRego').value.trim();
  const photoInput = document.getElementById('carPhoto');

  // Validate inputs
  const validation = validateCarDetails(name, model, rego);
  if (!validation.valid) {
    showError(validation.error);
    return;
  }

  // Get photo as base64 if provided
  let photoData = null;
  if (photoInput.files && photoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      photoData = e.target.result;
      await createCar(name, model, rego, photoData);
    };
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    await createCar(name, model, rego, null);
  }
}

/**
 * Helper function to create car
 */
async function createCar(name, model, rego, photo) {
  const carData = {
    name,
    model,
    registrationNumber: rego,
    photo: photo || null,
    status: 'active'
  };

  const result = await addCar(carData);

  if (result.success) {
    showSuccess(`Vehicle "${name}" added`);
    handleCloseAddCarModal();
    renderAll();
  } else {
    showError(result.error);
  }
}

/**
 * Handle removing a car
 */
async function handleRemoveCar(carId) {
  const car = getCarById(carId);
  if (!car) return;

  showConfirmModal(
    'Delete Vehicle',
    `Are you sure you want to delete ${car.name}? This will not delete associated transactions.`,
    async () => {
      const result = await removeCar(carId);
      hideConfirmModal();

      if (result.success) {
        showSuccess('Vehicle deleted');
        renderAll();
      } else {
        showError(result.error);
      }
    }
  );
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

// ============= WINDOW EXPORTS =============
// Make functions global for HTML onclick handlers

window.appEvents = {
  addPartner: handleAddPartner,
  removePartner: handleRemovePartner,
  addTransaction: handleAddTransaction,
  deleteTransaction: handleDeleteTransaction,
  clearAllData: handleClearAllData,
  togglePartnerSelect,
  filterByMonth: handleFilterByMonth,
  downloadCSV: handleDownloadCSV,
  downloadExcel: handleDownloadExcel,
  downloadPDF: handleDownloadPDF,
  confirmReset: handleConfirmReset,
  confirmAction: handleConfirmAction,
  confirmCancel: handleConfirmCancel,
  openAddCarModal: handleOpenAddCarModal,
  closeAddCarModal: handleCloseAddCarModal,
  addCar: handleAddCar,
  removeCar: handleRemoveCar,
  previewCarPhoto: handlePreviewCarPhoto
};

// ============= START APP =============

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
