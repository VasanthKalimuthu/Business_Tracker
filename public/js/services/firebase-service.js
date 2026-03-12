/**
 * Firebase Service
 * Handles all Firebase database operations
 */

import { firebaseConfig } from '../config/firebase-config.js';

let db = null;
let isConnected = false;

/**
 * Initialize Firebase connection
 * @returns {Promise<boolean>} True if Firebase is initialized, false otherwise
 */
export async function initializeFirebase() {
  try {
    // Check if API key is configured
    if (firebaseConfig.apiKey === "PASTE_YOUR_KEY" || !firebaseConfig.apiKey) {
      console.warn('Firebase API key not configured');
      return false;
    }

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    isConnected = true;
    console.log('Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    isConnected = false;
    return false;
  }
}

/**
 * Check if Firebase is connected
 * @returns {boolean}
 */
export function isFirebaseConnected() {
  return isConnected && db !== null;
}

/**
 * Subscribe to partners data changes
 * @param {function} callback - Function to call when partners change
 * @returns {function} Unsubscribe function
 */
export function subscribeToPartners(callback) {
  if (!isConnected || !db) {
    console.warn('Firebase not connected');
    return () => {};
  }

  const ref = db.ref('partners');
  ref.on('value', (snapshot) => {
    const partners = snapshot.val() || [];
    callback(partners);
  });

  return () => ref.off();
}

/**
 * Subscribe to transactions data changes
 * @param {function} callback - Function to call when transactions change
 * @returns {function} Unsubscribe function
 */
export function subscribeToTransactions(callback) {
  if (!isConnected || !db) {
    console.warn('Firebase not connected');
    return () => {};
  }

  const ref = db.ref('transactions');
  ref.on('value', (snapshot) => {
    const data = snapshot.val() || {};
    const transactions = Object.keys(data)
      .map(key => ({ ...data[key], id: key }))
      .sort((a, b) => b.ts - a.ts);
    callback(transactions);
  });

  return () => ref.off();
}

/**
 * Add a partner to cloud database
 * @param {string} partnerName - Name of the partner
 * @returns {Promise<boolean>}
 */
export async function addPartnerToCloud(partnerName) {
  if (!isConnected || !db) return false;

  try {
    const ref = db.ref('partners');
    const snapshot = await ref.once('value');
    const partners = snapshot.val() || [];

    if (!partners.includes(partnerName)) {
      partners.push(partnerName);
      await ref.set(partners);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error adding partner to cloud:', error);
    return false;
  }
}

/**
 * Remove a partner from cloud database
 * @param {string} partnerName - Name of the partner to remove
 * @returns {Promise<boolean>}
 */
export async function removePartnerFromCloud(partnerName) {
  if (!isConnected || !db) return false;

  try {
    const ref = db.ref('partners');
    const snapshot = await ref.once('value');
    const partners = snapshot.val() || [];
    const filtered = partners.filter(p => p !== partnerName);
    await ref.set(filtered);
    return true;
  } catch (error) {
    console.error('Error removing partner from cloud:', error);
    return false;
  }
}

/**
 * Add a transaction to cloud database
 * @param {object} transaction - Transaction object
 * @returns {Promise<string|null>} Transaction ID or null on failure
 */
export async function addTransactionToCloud(transaction) {
  if (!isConnected || !db) return null;

  try {
    const ref = db.ref('transactions').push();
    await ref.set({
      ...transaction,
      ts: firebase.database.ServerValue.TIMESTAMP
    });
    return ref.key;
  } catch (error) {
    console.error('Error adding transaction to cloud:', error);
    return null;
  }
}

/**
 * Delete a transaction from cloud database
 * @param {string} transactionId - ID of transaction to delete
 * @returns {Promise<boolean>}
 */
export async function deleteTransactionFromCloud(transactionId) {
  if (!isConnected || !db) return false;

  try {
    await db.ref(`transactions/${transactionId}`).remove();
    return true;
  } catch (error) {
    console.error('Error deleting transaction from cloud:', error);
    return false;
  }
}

/**
 * Clear all cloud data
 * @returns {Promise<boolean>}
 */
export async function clearAllCloudData() {
  if (!isConnected || !db) return false;

  try {
    await db.ref('partners').remove();
    await db.ref('transactions').remove();
    await db.ref('cars').remove();
    return true;
  } catch (error) {
    console.error('Error clearing cloud data:', error);
    return false;
  }
}

/**
 * Subscribe to cars data changes
 * @param {function} callback - Function to call when cars change
 * @returns {function} Unsubscribe function
 */
export function subscribeToCars(callback) {
  if (!isConnected || !db) {
    console.warn('Firebase not connected');
    return () => {};
  }

  const ref = db.ref('cars');
  ref.on('value', (snapshot) => {
    const data = snapshot.val() || [];
    callback(Array.isArray(data) ? data : Object.values(data));
  });

  return () => ref.off();
}

/**
 * Add a car to cloud database
 * @param {object} car - Car object
 * @returns {Promise<boolean>}
 */
export async function addCarToCloud(car) {
  if (!isConnected || !db) return false;

  try {
    const ref = db.ref('cars');
    const snapshot = await ref.once('value');
    const cars = snapshot.val() || [];

    if (!Array.isArray(cars)) {
      cars = Object.values(cars);
    }

    cars.push(car);
    await ref.set(cars);
    return true;
  } catch (error) {
    console.error('Error adding car to cloud:', error);
    return false;
  }
}

/**
 * Remove a car from cloud database
 * @param {string} carId - Car ID to remove
 * @returns {Promise<boolean>}
 */
export async function removeCarFromCloud(carId) {
  if (!isConnected || !db) return false;

  try {
    const ref = db.ref('cars');
    const snapshot = await ref.once('value');
    const cars = snapshot.val() || [];

    const filtered = (Array.isArray(cars) ? cars : Object.values(cars)).filter(car => car.id !== carId);
    await ref.set(filtered);
    return true;
  } catch (error) {
    console.error('Error removing car from cloud:', error);
    return false;
  }
}
