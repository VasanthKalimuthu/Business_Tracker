/**
 * Cars Module
 * Manages car rental details and operations
 */

import { getCarsFromStorage, saveCarsToStorage } from './storage.js';
import { validateCarDetails } from '../utils/validators.js';
import { addCarToCloud, removeCarFromCloud, isFirebaseConnected } from '../services/firebase-service.js';

let cars = [];

/**
 * Initialize cars from storage
 */
export function initCars() {
  cars = getCarsFromStorage();
}

/**
 * Get all cars
 * @returns {Array<object>}
 */
export function getCars() {
  return [...cars];
}

/**
 * Get a single car by ID
 * @param {string} carId - Car ID
 * @returns {object|null}
 */
export function getCarById(carId) {
  return cars.find(car => car.id === carId) || null;
}

/**
 * Set cars (used for cloud sync)
 * @param {Array<object>} newCars
 */
export function setCars(newCars) {
  cars = newCars || [];
  saveCarsToStorage(cars);
}

/**
 * Add a new car
 * @param {object} carData - { name, model, registrationNumber, fuelType, transmission, photo (optional) }
 * @returns {Promise<object>} { success: boolean, error: string, carId: string }
 */
export async function addCar(carData) {
  const validation = validateCarDetails(carData);
  if (!validation.isValid) {
    return { success: false, error: validation.error, carId: null };
  }

  const car = {
    id: `car_${Date.now()}`,
    name: carData.name.trim(),
    model: carData.model.trim(),
    registrationNumber: carData.registrationNumber.trim().toUpperCase(),
    fuelType: carData.fuelType.trim(),
    transmission: carData.transmission.trim(),
    photo: carData.photo || null,
    createdDate: new Date().toISOString(),
    totalIncome: 0,
    totalExpense: 0,
    status: 'active' // active, inactive, rented
  };

  cars.push(car);
  saveCarsToStorage(cars);

  // Sync to cloud if available
  if (isFirebaseConnected()) {
    await addCarToCloud(car);
  }

  return { success: true, error: '', carId: car.id };
}

/**
 * Remove a car
 * @param {string} carId - ID of car to remove
 * @returns {Promise<object>} { success: boolean, error: string }
 */
export async function removeCar(carId) {
  const index = cars.findIndex(car => car.id === carId);
  if (index === -1) {
    return { success: false, error: 'Car not found' };
  }

  const removedCar = cars.splice(index, 1)[0];
  saveCarsToStorage(cars);

  // Sync to cloud if available
  if (isFirebaseConnected()) {
    await removeCarFromCloud(carId);
  }

  return { success: true, error: '' };
}

/**
 * Update car details
 * @param {string} carId - Car ID
 * @param {object} updates - Fields to update { name, model, registrationNumber, photo, status }
 * @returns {object} { success: boolean, error: string }
 */
export function updateCar(carId, updates) {
  const car = cars.find(c => c.id === carId);
  if (!car) {
    return { success: false, error: 'Car not found' };
  }

  // Update allowed fields
  if (updates.name) car.name = updates.name.trim();
  if (updates.model) car.model = updates.model.trim();
  if (updates.registrationNumber) car.registrationNumber = updates.registrationNumber.trim().toUpperCase();
  if (updates.fuelType) car.fuelType = updates.fuelType;
  if (updates.transmission) car.transmission = updates.transmission;
  if (updates.photo) car.photo = updates.photo;
  if (updates.status) car.status = updates.status;

  saveCarsToStorage(cars);
  return { success: true, error: '' };
}

/**
 * Update car financial summary
 * @param {string} carId - Car ID
 * @param {number} incomeAmount - Income to add
 * @param {number} expenseAmount - Expense to add
 */
export function updateCarFinancials(carId, incomeAmount = 0, expenseAmount = 0) {
  const car = cars.find(c => c.id === carId);
  if (car) {
    car.totalIncome = (car.totalIncome || 0) + incomeAmount;
    car.totalExpense = (car.totalExpense || 0) + expenseAmount;
    saveCarsToStorage(cars);
  }
}

/**
 * Get car statistics
 * @param {string} carId - Car ID
 * @returns {object}
 */
export function getCarStats(carId) {
  const car = getCarById(carId);
  if (!car) {
    return { income: 0, expense: 0, profit: 0 };
  }

  const profit = car.totalIncome - car.totalExpense;
  return {
    income: car.totalIncome,
    expense: car.totalExpense,
    profit: profit
  };
}

/**
 * Get total statistics across all cars
 * @returns {object}
 */
export function getTotalStats() {
  const totalIncome = cars.reduce((sum, car) => sum + (car.totalIncome || 0), 0);
  const totalExpense = cars.reduce((sum, car) => sum + (car.totalExpense || 0), 0);
  const profit = totalIncome - totalExpense;

  return {
    totalIncome,
    totalExpense,
    profit,
    carCount: cars.length
  };
}

/**
 * Check if a car exists
 * @param {string} carId - Car ID
 * @returns {boolean}
 */
export function carExists(carId) {
  return cars.some(car => car.id === carId);
}

/**
 * Get number of cars
 * @returns {number}
 */
export function getCarCount() {
  return cars.length;
}
