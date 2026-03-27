/**
 * Main Application Entry Point
 * Orchestrates all modules and handles user interactions
 */

import { initPartners, addPartner, removePartner, getPartners, setPartners } from './modules/partners.js';
import { initTransactions, addTransaction, deleteTransaction, setTransactions, getTransactions } from './modules/transactions.js';
import { initCars, getCars, setCars, addCar, removeCar, getCarCount, getCarById, updateCar } from './modules/cars.js';
import { renderAll, clearInputs, showError, showSuccess, setSelectedMonth, setSelectedCar, getTransactionsForExport, renderVehiclePaidByDropdown, setPartnerFilterMonth, renderPartners, setFinancialSummaryFilterMonth, renderBreakdown } from './modules/ui.js';
import { getIncomeForVehicle, getExpenseForVehicle, getNetProfitForVehicle, getMonthlyFinancialByVehicle, calculateVehicleSettlement, calculateVehicleSettlementForMonth } from './modules/calculator.js';
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

  // Scroll to top on app load
  window.scrollTo(0, 0);

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
  // Partner input - safe check before attaching listener
  const partnerNameInput = document.getElementById('newPartnerName');
  if (partnerNameInput) {
    partnerNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleAddPartner();
    });
  }

  // Transaction form enter key
  const amountInput = document.getElementById('amount');
  if (amountInput) {
    amountInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleAddTransaction();
    });
  }

  // Transaction type change
  const transTypeSelect = document.getElementById('transType');
  if (transTypeSelect) {
    transTypeSelect.addEventListener('change', togglePartnerSelect);
  }

  // Helper function to get current month
  const getDefaultMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // Initialize partner filter month to current month
  const partnerFilterMonth = document.getElementById('partnerFilterMonth');
  if (partnerFilterMonth) {
    partnerFilterMonth.value = getDefaultMonth();
  }

  // Initialize main dashboard transaction history filter month to current month
  const filterMonth = document.getElementById('filterMonth');
  if (filterMonth) {
    filterMonth.value = getDefaultMonth();
  }

  // Initialize vehicle detail transaction history filter month to current month
  const vehicleFilterMonth = document.getElementById('vehicleFilterMonth');
  if (vehicleFilterMonth) {
    vehicleFilterMonth.value = getDefaultMonth();
  }

  // Initialize financial summary filter month to current month
  const financialSummaryFilterMonth = document.getElementById('financialSummaryFilterMonth');
  if (financialSummaryFilterMonth) {
    financialSummaryFilterMonth.value = getDefaultMonth();
  }

  // Helper function to get current date in YYYY-MM-DD format
  const getDefaultDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize transaction date to current date for home view
  const transDateInput = document.getElementById('transDate');
  if (transDateInput) {
    transDateInput.value = getDefaultDate();
  }

  // Initialize transaction date to current date for vehicle detail view
  const vehicleTransDateInput = document.getElementById('vehicleTransDate');
  if (vehicleTransDateInput) {
    vehicleTransDateInput.value = getDefaultDate();
  }
}


// ============= EVENT HANDLERS =============

/**
 * Handle adding a new partner
 */
async function handleAddPartner() {
  try {
    const input = document.getElementById('newPartnerName');
    if (!input) {
      showError('Input field not found. Please reload the page.');
      return;
    }

    const name = input.value.trim();

    if (!name) {
      showError('Please enter a partner name');
      return;
    }

    const result = await addPartner(name);
    
    if (result.success) {
      showSuccess(`Partner "${name}" added`);
      input.value = ''; // Clear the input
      handleCloseAddPartnerModal();
      renderAll();
    } else {
      showError(result.error);
    }
  } catch (error) {
    console.error('Error adding partner:', error);
    showError('An error occurred while adding the partner. Please try again.');
  }
}

/**
 * Open add partner modal
 */
function handleOpenAddPartnerModal() {
  const modal = document.getElementById('addPartnerModal');
  const input = document.getElementById('newPartnerName');
  
  if (modal) {
    modal.classList.remove('hidden');
  }
  
  if (input) {
    setTimeout(() => input.focus(), 100);
  }
}

/**
 * Close add partner modal
 */
function handleCloseAddPartnerModal() {
  const modal = document.getElementById('addPartnerModal');
  const input = document.getElementById('newPartnerName');
  
  if (modal) {
    modal.classList.add('hidden');
  }
  
  if (input) {
    input.value = '';
  }
}

/**
 * Handle removing a partner
 */
async function handleRemovePartner(partnerName) {
  showConfirmModal(
    'Delete Team Member',
    `Are you sure you want to remove "${partnerName}"? This action cannot be undone.`,
    async () => {
      const result = await removePartner(partnerName);
      hideConfirmModal();

      if (result.success) {
        showSuccess(`Partner removed`);
        renderAll();
      } else {
        showError(result.error);
      }
    }
  );
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
  const paidBy = document.getElementById('paidBy').value;

  if (!carId) {
    showError('Please select a vehicle');
    return;
  }

  if (!desc || !amount) {
    showError('Please fill in all fields');
    return;
  }

  if (!paidBy) {
    showError('Please select a team member');
    return;
  }

  const transactionData = {
    type,
    desc,
    amount,
    carId: carId,
    paidBy: paidBy,
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
 * Handle partner filter by month
 */
function handleFilterPartnersByMonth() {
  const monthInput = document.getElementById('partnerFilterMonth').value;
  setPartnerFilterMonth(monthInput);
  renderPartners(monthInput);
}

/**
 * Handle updating Financial Summary filter by month
 */
function handleUpdateFinancialSummaryFilter() {
  const monthInput = document.getElementById('financialSummaryFilterMonth').value;
  setFinancialSummaryFilterMonth(monthInput);
  renderBreakdown(monthInput);
}

/**
 * Handle showing vehicle transaction details
 */
function handleShowVehicleTransactions(carId) {
  const transactions = getTransactions();
  const car = getCarById(carId);
  
  if (!car) {
    showError('Vehicle not found');
    return;
  }
  
  // Filter transactions for this vehicle
  const vehicleTransactions = transactions.filter(t => t.carId === carId);
  
  if (vehicleTransactions.length === 0) {
    showError('No transactions found for this vehicle');
    return;
  }
  
  // Build HTML for transaction details
  let html = '<div class="space-y-4">';
  
  // Vehicle info header
  html += `
    <div class="bg-slate-700 p-4 rounded-lg">
      <div class="flex items-center gap-3">
        <img src="${car.photo || 'https://via.placeholder.com/50?text=Car'}" alt="${car.name}" class="w-12 h-12 rounded object-cover">
        <div>
          <h3 class="font-bold text-white">${car.name}</h3>
          <p class="text-sm text-slate-400">${car.registrationNumber}</p>
        </div>
      </div>
    </div>
  `;
  
  // Transaction list
  vehicleTransactions.forEach(transaction => {
    // Parse date in MM/DD/YYYY format
    const [month, day, year] = transaction.date.split('/');
    const dateObj = new Date(year, month - 1, day);
    const formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const typeColor = transaction.type === 'income' ? 'text-green-400' : 'text-red-400';
    const typeIcon = transaction.type === 'income' ? 'fa-arrow-up' : 'fa-arrow-down';
    const amount = parseFloat(transaction.amt) || 0;
    
    html += `
      <div class="bg-slate-700 p-4 rounded-lg border-l-4 ${transaction.type === 'income' ? 'border-green-500' : 'border-red-500'}">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <i class="fas ${typeIcon} ${typeColor}"></i>
              <span class="font-bold text-white capitalize">${transaction.type}</span>
            </div>
            <p class="text-sm text-slate-300">${transaction.desc}</p>
            <div class="mt-2 space-y-1 text-xs text-slate-400">
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Member:</strong> ${transaction.paidBy}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-lg font-bold ${typeColor}">
              ${transaction.type === 'income' ? '+' : '-'}$${amount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  
  // Populate and show modal
  document.getElementById('transactionDetailsContent').innerHTML = html;
  document.getElementById('transactionDetailsModal').classList.remove('hidden');
}

/**
 * Handle closing transaction details modal
 */
function handleCloseTransactionDetailsModal() {
  document.getElementById('transactionDetailsModal').classList.add('hidden');
  document.getElementById('transactionDetailsContent').innerHTML = '';
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
  document.getElementById('carFuelType').value = '';
  document.getElementById('carTransmission').value = '';
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
 * Handle updating transmission options based on fuel type
 */
function handleUpdateTransmissionOptions() {
  const fuelType = document.getElementById('carFuelType').value;
  const transmissionSelect = document.getElementById('carTransmission');
  const options = transmissionSelect.querySelectorAll('option');

  if (fuelType === 'Electric') {
    // For electric vehicles, only show Automatic option
    options.forEach(opt => {
      if (opt.value === 'Automatic' || opt.value === '') {
        opt.style.display = 'block';
      } else {
        opt.style.display = 'none';
      }
    });
    // Set transmission to Automatic
    transmissionSelect.value = 'Automatic';
  } else {
    // For petrol/diesel, show all options
    options.forEach(opt => {
      opt.style.display = 'block';
    });
    transmissionSelect.value = ''; // Reset selection
  }
}

/**
 * Handle adding a new car
 */
async function handleAddCar() {
  const name = document.getElementById('carName').value.trim();
  const model = document.getElementById('carModel').value.trim();
  const rego = document.getElementById('carRego').value.trim();
  const fuelType = document.getElementById('carFuelType').value;
  const transmission = document.getElementById('carTransmission').value;
  const photoInput = document.getElementById('carPhoto');

  // Get photo as base64 if provided
  let photoData = null;
  if (photoInput.files && photoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      photoData = e.target.result;
      await createCar(name, model, rego, fuelType, transmission, photoData);
    };
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    await createCar(name, model, rego, fuelType, transmission, null);
  }
}

/**
 * Helper function to create car
 */
async function createCar(name, model, rego, fuelType, transmission, photo) {
  const carData = {
    name,
    model,
    registrationNumber: rego,
    fuelType,
    transmission,
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
 * Open edit car modal with current car data
 */
function handleOpenEditCarModal(carId) {
  const car = getCarById(carId);
  if (!car) {
    showError('Vehicle not found');
    return;
  }

  // Store the car ID being edited
  window.editingCarId = carId;

  // Populate form with current data
  document.getElementById('editCarName').value = car.name;
  document.getElementById('editCarModel').value = car.model;
  document.getElementById('editCarRego').value = car.registrationNumber;
  document.getElementById('editCarFuelType').value = car.fuelType || '';
  document.getElementById('editCarTransmission').value = car.transmission || '';

  // Update transmission options based on fuel type
  handleUpdateEditTransmissionOptions();

  // Display current photo if exists
  if (car.photo) {
    document.getElementById('editPhotoPreviewImg').src = car.photo;
    document.getElementById('editPhotoPreview').classList.remove('hidden');
  } else {
    document.getElementById('editPhotoPreview').classList.add('hidden');
  }

  // Clear file input
  document.getElementById('editCarPhoto').value = '';

  // Show modal
  document.getElementById('editCarModal').classList.remove('hidden');
}

/**
 * Close edit car modal
 */
function handleCloseEditCarModal() {
  document.getElementById('editCarModal').classList.add('hidden');
  window.editingCarId = null;
  document.getElementById('editCarPhoto').value = '';
  document.getElementById('editPhotoPreview').classList.add('hidden');
}

/**
 * Handle transmission options update for edit modal
 */
function handleUpdateEditTransmissionOptions() {
  const fuelType = document.getElementById('editCarFuelType').value;
  const transmissionSelect = document.getElementById('editCarTransmission');
  const manualOption = transmissionSelect.querySelector('option[value="Manual"]');

  if (fuelType === 'Electric') {
    if (manualOption) manualOption.style.display = 'none';
    transmissionSelect.value = 'Automatic';
  } else {
    if (manualOption) manualOption.style.display = 'block';
  }
}

/**
 * Preview edit car photo
 */
function handlePreviewEditCarPhoto() {
  const photoInput = document.getElementById('editCarPhoto');
  if (photoInput.files && photoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('editPhotoPreviewImg').src = e.target.result;
      document.getElementById('editPhotoPreview').classList.remove('hidden');
    };
    reader.readAsDataURL(photoInput.files[0]);
  }
}

/**
 * Save edited car
 */
async function handleSaveEditCar() {
  if (!window.editingCarId) {
    showError('No vehicle selected for editing');
    return;
  }

  const name = document.getElementById('editCarName').value.trim();
  const model = document.getElementById('editCarModel').value.trim();
  const rego = document.getElementById('editCarRego').value.trim().toUpperCase();
  const fuelType = document.getElementById('editCarFuelType').value;
  const transmission = document.getElementById('editCarTransmission').value;

  if (!name || !model || !rego || !fuelType || !transmission) {
    showError('Please fill in all required fields');
    return;
  }

  const updates = {
    name,
    model,
    registrationNumber: rego,
    fuelType,
    transmission
  };

  // Handle photo update if a new photo is selected
  const photoInput = document.getElementById('editCarPhoto');
  if (photoInput.files && photoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      updates.photo = e.target.result;
      await saveUpdatedCar(updates);
    };
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    await saveUpdatedCar(updates);
  }
}

/**
 * Helper function to save updated car
 */
async function saveUpdatedCar(updates) {
  const result = await updateCar(window.editingCarId, updates);

  if (result.success) {
    showSuccess('Vehicle updated successfully');
    handleCloseEditCarModal();
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

// ============= VEHICLE DETAIL VIEW =============

let selectedVehicleId = null;
let settlementFilterMonth = getCurrentMonthString();

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonthString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Open vehicle detail view
 */
function handleViewVehicleDetail(carId) {
  const car = getCarById(carId);
  if (!car) {
    showError('Vehicle not found');
    return;
  }

  selectedVehicleId = carId;
  
  // Get financial data for this vehicle
  const income = getIncomeForVehicle(carId);
  const expense = getExpenseForVehicle(carId);
  const profit = getNetProfitForVehicle(carId);
  const monthlyData = getMonthlyFinancialByVehicle(carId);
  const partners = getPartners();
  
  // Populate vehicle detail title and info
  const detailTitle = document.getElementById('vehicleDetailTitle');
  const profileIcon = document.getElementById('vehicleProfileIcon');
  const detailInfo = document.getElementById('vehicleDetailInfo');
  
  // Display vehicle image as profile icon in sticky header
  if (profileIcon) {
    if (car.photo) {
      profileIcon.innerHTML = `<img src="${car.photo}" alt="${car.name}" class="w-full h-full object-cover">`;
    } else {
      profileIcon.innerHTML = `<i class="fas fa-car text-slate-400 text-sm"></i>`;
    }
  }
  
  // Display vehicle name in header title
  detailTitle.innerHTML = `<span class="truncate">${car.name}</span>`;
  
  // Create settlement rows for each partner in this vehicle
  const settlementRows = partners.map(partner => {
    const settlement = calculateVehicleSettlementForMonth(partner, carId, settlementFilterMonth);
    const settlementColor = settlement.settlement > 0 ? 'text-emerald-400' : settlement.settlement < 0 ? 'text-rose-400' : 'text-slate-400';
    const settlementLabel = settlement.settlement > 0 ? 'Gets Back' : settlement.settlement < 0 ? 'Owes' : 'Settled';
    
    return `
      <tr class="border-b border-slate-600 hover:bg-slate-700/50 text-xs sm:text-sm">
        <td class="px-2 sm:px-4 py-2 sm:py-3 text-white font-medium line-clamp-1">${partner}</td>
        <td class="px-2 sm:px-4 py-2 sm:py-3 text-orange-400 text-right sm:text-left">₹${settlement.amountPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
        <td class="px-2 sm:px-4 py-2 sm:py-3 text-purple-400 hidden sm:table-cell">₹${settlement.shareOfExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
        <td class="px-2 sm:px-4 py-2 sm:py-3"><span class="font-bold ${settlementColor} text-right sm:text-left block">₹${Math.abs(settlement.settlement).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span><span class="text-xs text-slate-400">${settlementLabel}</span></td>
      </tr>
    `;
  }).join('');
  
  // Create detailed info display with financial summary
  detailInfo.innerHTML = `
    <div class="space-y-3 sm:space-y-4">
      <div class="flex justify-center mb-4 sm:mb-6 relative px-2 sm:px-0">
        <div class="relative w-full max-w-2xl h-56 sm:h-80 rounded-2xl overflow-hidden shadow-2xl vehicle-image-elite" style="background: linear-gradient(135deg, rgba(34, 197, 238, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%); border: 2px solid rgba(34, 197, 238, 0.4);">
          ${car.photo ? `<img src="${car.photo}" alt="${car.name}" class="w-full h-full object-cover">` : `<div class="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center"><i class="fas fa-car text-6xl sm:text-8xl text-slate-500 opacity-50"></i></div>`}
        </div>
        <div class="absolute hidden sm:block -top-2 -right-2 w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full blur-3xl opacity-30"></div>
        <div class="absolute hidden sm:block -bottom-2 -left-2 w-32 h-32 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20"></div>
      </div>
      
      <div class="grid grid-cols-2 gap-2 sm:gap-4 bg-slate-700 rounded-lg p-3 sm:p-4">
        <div>
          <p class="text-slate-400 text-xs sm:text-sm">Model</p>
          <p class="text-sm sm:text-lg font-bold text-white line-clamp-1">${car.model}</p>
        </div>
        <div>
          <p class="text-slate-400 text-xs sm:text-sm">Registration</p>
          <p class="text-sm sm:text-lg font-bold text-yellow-400 line-clamp-1">${car.registrationNumber}</p>
        </div>
        <div>
          <p class="text-slate-400 text-xs sm:text-sm">Fuel Type</p>
          <p class="text-sm sm:text-lg font-bold text-white"><i class="fas ${getFuelIcon(car.fuelType)}"></i> <span class="ml-1">${car.fuelType}</span></p>
        </div>
        <div>
          <p class="text-slate-400 text-xs sm:text-sm">Transmission</p>
          <p class="text-sm sm:text-lg font-bold text-white"><i class="fas ${getTransmissionIcon(car.transmission)}"></i> <span class="ml-1">${car.transmission}</span></p>
        </div>
      </div>
      
      <!-- Financial Summary -->
      <div class="grid grid-cols-3 gap-2 sm:gap-3">
        <div class="bg-emerald-900/30 border border-emerald-600/30 rounded-lg p-2 sm:p-4">
          <p class="text-emerald-400 text-xs uppercase font-semibold mb-1">Income</p>
          <p class="text-sm sm:text-2xl font-bold text-emerald-300 line-clamp-1">₹${income.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div class="bg-rose-900/30 border border-rose-600/30 rounded-lg p-2 sm:p-4">
          <p class="text-rose-400 text-xs uppercase font-semibold mb-1">Expense</p>
          <p class="text-sm sm:text-2xl font-bold text-rose-300 line-clamp-1">₹${expense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div class="bg-blue-900/30 border border-blue-600/30 rounded-lg p-2 sm:p-4">
          <p class="text-blue-400 text-xs uppercase font-semibold mb-1">Profit</p>
          <p class="text-sm sm:text-2xl font-bold ${profit >= 0 ? 'text-blue-300' : 'text-rose-300'} line-clamp-1">₹${profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
      </div>
      
      <!-- Settlement Details -->
      <div class="bg-slate-700 rounded-lg overflow-hidden">
        <div class="bg-slate-600 px-3 sm:px-4 py-2 sm:py-3 border-b border-slate-500 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
          <div class="flex-1 min-w-0 flex content-center items-center">
            <p class="text-sm sm:text-base text-white font-semibold line-clamp-1"><i class="fas fa-exchange-alt text-cyan-400 mr-1 sm:mr-2"></i>Expense Settlement</p>
            <p class="text-slate-300 text-xs mt-0 hidden sm:block ml-2">Expenses split equally</p>
          </div>
          <div class="flex items-center gap-3 sm:gap-4">
            <div class="min-w-[130px] sm:min-w-[160px]">
              <label class="block text-xs text-slate-400 font-semibold mb-1" onclick="event.stopPropagation()">
                <i class="fas fa-filter text-purple-400 mr-1"></i>Filter
              </label>
              <input type="month" id="settlementFilterMonth" class="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-white focus:ring-2 focus:ring-purple-500 outline-none text-xs" onchange="window.appEvents.updateSettlementFilter()" value="${settlementFilterMonth}" onclick="event.stopPropagation()">
            </div>
            <button class="collapse-toggle mt-4 sm:mt-0 p-2 rounded-lg hover:bg-slate-700 transition" onclick="this.parentElement.parentElement.nextElementSibling.classList.toggle('collapsed'); this.classList.toggle('collapsed');" title="Toggle Settlement Details">
              <i class="fas fa-chevron-down text-cyan-400 text-lg"></i>
            </button>
          </div>
        </div>
        <div class="overflow-x-auto collapse-content -mx-3 sm:-mx-0">
          <table class="w-full">
            <thead class="bg-slate-600/50 border-b border-slate-500">
              <tr>
                <th class="px-2 sm:px-4 py-2 sm:py-3 text-left text-slate-300 font-semibold text-xs sm:text-sm">Partner</th>
                <th class="px-2 sm:px-4 py-2 sm:py-3 text-left text-slate-300 font-semibold text-xs sm:text-sm">Paid</th>
                <th class="px-2 sm:px-4 py-2 sm:py-3 text-left text-slate-300 font-semibold text-xs sm:text-sm">Share</th>
                <th class="px-2 sm:px-4 py-2 sm:py-3 text-left text-slate-300 font-semibold text-xs sm:text-sm">Settle</th>
              </tr>
            </thead>
            <tbody id="settlementTableBody" class="text-xs sm:text-sm">
              ${settlementRows}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Switch to vehicle detail view
  showVehicleDetailView();
  
  // Render vehicle-specific dropdowns
  renderVehiclePaidByDropdown();
  
  // Render vehicle-specific transactions
  renderVehicleTransactionHistory();
}

/**
 * Helper function to get fuel icon
 */
function getFuelIcon(fuelType) {
  switch(fuelType) {
    case 'Petrol': return 'fa-gas-pump text-orange-400';
    case 'Diesel': return 'fa-oil-can text-amber-700';
    case 'Electric': return 'fa-bolt text-yellow-400';
    default: return 'fa-car';
  }
}

/**
 * Helper function to get transmission icon
 */
function getTransmissionIcon(transmission) {
  return transmission === 'Manual' ? 'fa-gears text-blue-400' : 'fa-gear text-purple-400';
}

/**
 * Show vehicle detail view, hide home view
 */
function showVehicleDetailView() {
  document.getElementById('dashboardView').classList.add('hidden');
  document.getElementById('vehicleDetailView').classList.remove('hidden');
  
  // Scroll to top immediately
  window.scrollTo(0, 0);
  
  // Initialize sections - Settlement collapsed by default, Transaction history collapsed
  setTimeout(() => {
    // Collapse Expense Settlement section by default - find by settlement table body ID
    const settlementTableBody = document.getElementById('settlementTableBody');
    if (settlementTableBody) {
      // Navigate up to find the collapse-content div
      let collapseContent = settlementTableBody.closest('.collapse-content');
      if (collapseContent) {
        collapseContent.classList.add('collapsed');
        // Find and toggle the collapse-toggle button
        let settlementSection = collapseContent.closest('.bg-slate-700');
        if (settlementSection) {
          let toggleButton = settlementSection.querySelector('.collapse-toggle');
          if (toggleButton) {
            toggleButton.classList.add('collapsed');
          }
        }
      }
    }
    
    // Collapse Transaction History section by default
    const transactionContainer = document.getElementById('vehicleTransactionHistoryContainer');
    if (transactionContainer) {
      const historyToggle = transactionContainer.querySelector('.collapse-toggle');
      const historyContent = transactionContainer.querySelectorAll('.collapse-content');
      if (historyToggle && historyContent.length > 0) {
        historyToggle.classList.add('collapsed');
        historyContent.forEach(content => content.classList.add('collapsed'));
      }
    }
  }, 150);
}

/**
 * Show home view, hide vehicle detail view
 */
function showHomeView() {
  document.getElementById('vehicleDetailView').classList.add('hidden');
  document.getElementById('dashboardView').classList.remove('hidden');
  window.scrollTo(0, 0);
}

/**
 * Go back to fleet view from vehicle detail
 */
function handleBackToFleetView() {
  selectedVehicleId = null;
  showHomeView();
  clearVehicleFormInputs();
  window.scrollTo(0, 0);
}

/**
 * Clear vehicle form inputs
 */
function clearVehicleFormInputs() {
  document.getElementById('vehicleTransType').value = 'income';
  document.getElementById('vehicleDesc').value = '';
  document.getElementById('vehicleAmount').value = '';
  document.getElementById('vehicleTransDate').value = '';
  document.getElementById('vehiclePaidBy').value = '';
}

/**
 * Update settlement table when month filter changes
 */
function handleUpdateSettlementFilter() {
  const filterInput = document.getElementById('settlementFilterMonth');
  if (!filterInput) return;
  
  settlementFilterMonth = filterInput.value;
  
  if (!selectedVehicleId) return;
  
  const car = getCarById(selectedVehicleId);
  if (!car) return;
  
  const partners = getPartners();
  
  // Regenerate settlement rows for the selected month
  const settlementRows = partners.map(partner => {
    const settlement = calculateVehicleSettlementForMonth(partner, selectedVehicleId, settlementFilterMonth);
    const settlementColor = settlement.settlement > 0 ? 'text-emerald-400' : settlement.settlement < 0 ? 'text-rose-400' : 'text-slate-400';
    const settlementLabel = settlement.settlement > 0 ? 'Gets Back' : settlement.settlement < 0 ? 'Owes' : 'Settled';
    
    return `
      <tr class="border-b border-slate-600 hover:bg-slate-700/50">
        <td class="px-4 py-3 text-white font-medium">${partner}</td>
        <td class="px-4 py-3 text-orange-400">₹${settlement.amountPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
        <td class="px-4 py-3 text-purple-400">₹${settlement.shareOfExpenses.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
        <td class="px-4 py-3"><span class="font-bold ${settlementColor}">₹${Math.abs(settlement.settlement).toLocaleString('en-IN', { maximumFractionDigits: 2 })} ${settlementLabel}</span></td>
      </tr>
    `;
  }).join('');
  
  // Update the table body
  const tableBody = document.getElementById('settlementTableBody');
  if (tableBody) {
    tableBody.innerHTML = settlementRows;
  }
}

/**
 * Toggle the vehicle "Paid By" field visibility
 */
function handleToggleVehiclePaidBy() {
  const container = document.getElementById('vehiclePaidByContainer');
  const partners = getPartners();

  if (partners.length > 0) {
    container.classList.remove('hidden');
    // Populate paid by dropdown
    const paidBySelect = document.getElementById('vehiclePaidBy');
    paidBySelect.innerHTML = '<option value="">Select a team member...</option>' +
      partners.map(p => `<option value="${p}">${p}</option>`).join('');
  } else {
    container.classList.add('hidden');
    document.getElementById('vehiclePaidBy').value = '';
  }
}

/**
 * Add transaction for selected vehicle
 */
async function handleAddVehicleTransaction() {
  if (!selectedVehicleId) {
    showError('No vehicle selected');
    return;
  }

  const type = document.getElementById('vehicleTransType').value;
  const desc = document.getElementById('vehicleDesc').value;
  const amount = parseFloat(document.getElementById('vehicleAmount').value);
  const date = document.getElementById('vehicleTransDate').value;
  const paidBy = document.getElementById('vehiclePaidBy').value;

  if (!type || !desc || !amount) {
    showError('Please fill in all fields');
    return;
  }

  if (amount <= 0) {
    showError('Amount must be greater than 0');
    return;
  }

  if (!paidBy) {
    showError('Please select a team member or mark as common');
    return;
  }

  const result = await addTransaction({
    type,
    desc,
    amount: amount,
    carId: selectedVehicleId,
    paidBy: paidBy,
    date: date || null
  });

  if (result.success) {
    showSuccess('Transaction recorded');
    clearVehicleFormInputs();
    // Refresh vehicle detail info and transaction history
    if (selectedVehicleId) {
      const car = getCarById(selectedVehicleId);
      if (car) {
        const income = getIncomeForVehicle(selectedVehicleId);
        const expense = getExpenseForVehicle(selectedVehicleId);
        const profit = getNetProfitForVehicle(selectedVehicleId);
        
        const detailInfo = document.getElementById('vehicleDetailInfo');
        detailInfo.innerHTML = `
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4 bg-slate-700 rounded-lg p-4">
              <div>
                <p class="text-slate-400 text-sm">Model</p>
                <p class="text-lg font-bold text-white">${car.model}</p>
              </div>
              <div>
                <p class="text-slate-400 text-sm">Registration</p>
                <p class="text-lg font-bold text-yellow-400">${car.registrationNumber}</p>
              </div>
              <div>
                <p class="text-slate-400 text-sm">Fuel Type</p>
                <p class="text-lg font-bold text-white"><i class="fas ${getFuelIcon(car.fuelType)}"></i> ${car.fuelType}</p>
              </div>
              <div>
                <p class="text-slate-400 text-sm">Transmission</p>
                <p class="text-lg font-bold text-white"><i class="fas ${getTransmissionIcon(car.transmission)}"></i> ${car.transmission}</p>
              </div>
            </div>
            
            <!-- Financial Summary -->
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-emerald-900/30 border border-emerald-600/30 rounded-lg p-4">
                <p class="text-emerald-400 text-xs uppercase font-semibold mb-1">Total Income</p>
                <p class="text-2xl font-bold text-emerald-300">₹${income.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              </div>
              <div class="bg-rose-900/30 border border-rose-600/30 rounded-lg p-4">
                <p class="text-rose-400 text-xs uppercase font-semibold mb-1">Total Expense</p>
                <p class="text-2xl font-bold text-rose-300">₹${expense.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              </div>
              <div class="bg-blue-900/30 border border-blue-600/30 rounded-lg p-4">
                <p class="text-blue-400 text-xs uppercase font-semibold mb-1">Net Profit</p>
                <p class="text-2xl font-bold ${profit >= 0 ? 'text-blue-300' : 'text-rose-300'}">₹${profit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        `;
      }
    }
    renderVehicleTransactionHistory();
    renderAll(); // Update home view too
  } else {
    showError(result.error);
  }
}

/**
 * Filter vehicle transactions by month
 */
function handleFilterVehicleTransactions() {
  if (!selectedVehicleId) return;
  renderVehicleTransactionHistory();
}

/**
 * Render vehicle-specific transaction history
 */
function renderVehicleTransactionHistory() {
  if (!selectedVehicleId) return;

  const transactions = getTransactions();
  const filterMonth = document.getElementById('vehicleFilterMonth').value;
  
  // Filter by vehicle ID and optionally by month
  let filtered = transactions.filter(t => t.carId === selectedVehicleId);
  
  if (filterMonth) {
    filtered = filtered.filter(t => {
      const tMonth = t.date.substring(0, 7); // MM/DD/YYYY -> first 7 chars won't work
      // Need to parse the date properly
      const parts = t.date.split('/');
      if (parts.length === 3) {
        const month = parts[0]; // MM from MM/DD/YYYY
        const year = parts[2];  // YYYY from MM/DD/YYYY
        const tMonthYear = `${year}-${month}`;
        return tMonthYear === filterMonth;
      }
      return false;
    });
  }

  // Sort by date (newest first)
  filtered.sort((a, b) => {
    const dateA = new Date(a.date.replace(/\//g, '-'));
    const dateB = new Date(b.date.replace(/\//g, '-'));
    return dateB - dateA;
  });

  const table = document.getElementById('vehicleHistoryTable');
  if (!table) return;

  if (filtered.length === 0) {
    table.innerHTML = '<tr><td colspan="6" class="px-4 py-3 text-slate-400">No transactions found</td></tr>';
    return;
  }

  table.innerHTML = filtered.map(trans => `
    <tr class="border-b border-slate-700 hover:bg-slate-700/50">
      <td class="px-4 py-3 text-slate-300">${trans.date}</td>
      <td class="px-4 py-3 text-slate-300">${trans.desc}</td>
      <td class="px-4 py-3">
        <span class="px-2 py-1 rounded text-xs font-bold ${
          trans.type === 'income' 
            ? 'bg-emerald-900 text-emerald-300' 
            : 'bg-red-900 text-red-300'
        }">
          ${trans.type.toUpperCase()}
        </span>
      </td>
      <td class="px-4 py-3 ${trans.paidBy === 'common' ? 'text-purple-400 font-semibold' : 'text-slate-300'}">${trans.paidBy === 'common' ? '<i class="fas fa-users mr-1"></i>Common' : (trans.paidBy || '—')}</td>
      <td class="px-4 py-3 font-bold ${trans.type === 'income' ? 'text-emerald-400' : 'text-red-400'}">
        ₹${trans.amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td class="px-4 py-3">
        <button onclick="window.appEvents.deleteVehicleTransaction('${trans.id}')" class="text-red-400 hover:text-red-300 transition">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

/**
 * Delete vehicle transaction
 */
async function handleDeleteVehicleTransaction(transactionId) {
  showConfirmModal(
    'Delete Transaction',
    'Are you sure you want to delete this transaction?',
    async () => {
      const result = await deleteTransaction(transactionId);
      hideConfirmModal();

      if (result.success) {
        showSuccess('Transaction deleted');
        renderVehicleTransactionHistory();
        renderAll(); // Update home view too
      } else {
        showError(result.error);
      }
    }
  );
}

/**
 * Download vehicle transactions as CSV
 */
async function handleDownloadVehicleCSV() {
  if (!selectedVehicleId) {
    showError('No vehicle selected');
    return;
  }

  const car = getCarById(selectedVehicleId);
  const transactions = getTransactions().filter(t => t.carId === selectedVehicleId);
  const filterMonth = document.getElementById('vehicleFilterMonth').value;
  
  if (filterMonth) {
    transactions.filter(t => {
      const parts = t.date.split('/');
      if (parts.length === 3) {
        const month = parts[0];
        const year = parts[2];
        const tMonthYear = `${year}-${month}`;
        return tMonthYear === filterMonth;
      }
      return false;
    });
  }

  await exportAsCSV(transactions, `${car.name}-transactions`);
  showSuccess('CSV downloaded');
}

/**
 * Download vehicle transactions as Excel
 */
async function handleDownloadVehicleExcel() {
  if (!selectedVehicleId) {
    showError('No vehicle selected');
    return;
  }

  const car = getCarById(selectedVehicleId);
  const transactions = getTransactions().filter(t => t.carId === selectedVehicleId);
  
  await exportAsExcel(transactions, `${car.name}-transactions`);
  showSuccess('Excel file downloaded');
}

/**
 * Download vehicle transactions as PDF
 */
async function handleDownloadVehiclePDF() {
  if (!selectedVehicleId) {
    showError('No vehicle selected');
    return;
  }

  const car = getCarById(selectedVehicleId);
  const transactions = getTransactions().filter(t => t.carId === selectedVehicleId);
  
  await exportAsPDF(transactions, `${car.name}-transactions`);
  showSuccess('PDF downloaded');
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
  addPartnerFromModal: handleAddPartner,
  openAddPartnerModal: handleOpenAddPartnerModal,
  closeAddPartnerModal: handleCloseAddPartnerModal,
  removePartner: handleRemovePartner,
  addTransaction: handleAddTransaction,
  deleteTransaction: handleDeleteTransaction,
  clearAllData: handleClearAllData,
  togglePartnerSelect,
  filterByMonth: handleFilterByMonth,
  filterPartnersByMonth: handleFilterPartnersByMonth,
  updateFinancialSummaryFilter: handleUpdateFinancialSummaryFilter,
  showVehicleTransactions: handleShowVehicleTransactions,
  closeTransactionDetailsModal: handleCloseTransactionDetailsModal,
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
  previewCarPhoto: handlePreviewCarPhoto,
  updateTransmissionOptions: handleUpdateTransmissionOptions,
  openEditCarModal: handleOpenEditCarModal,
  closeEditCarModal: handleCloseEditCarModal,
  updateEditTransmissionOptions: handleUpdateEditTransmissionOptions,
  previewEditCarPhoto: handlePreviewEditCarPhoto,
  saveEditCar: handleSaveEditCar,
  // Vehicle Detail View
  viewVehicleDetail: handleViewVehicleDetail,
  backToFleetView: handleBackToFleetView,
  updateSettlementFilter: handleUpdateSettlementFilter,
  addVehicleTransaction: handleAddVehicleTransaction,
  toggleVehiclePaidBy: handleToggleVehiclePaidBy,
  filterVehicleTransactions: handleFilterVehicleTransactions,
  deleteVehicleTransaction: handleDeleteVehicleTransaction,
  downloadVehicleCSV: handleDownloadVehicleCSV,
  downloadVehicleExcel: handleDownloadVehicleExcel,
  downloadVehiclePDF: handleDownloadVehiclePDF
};

// ============= START APP =============

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
