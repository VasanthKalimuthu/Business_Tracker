/**
 * Partners Module
 * Manages partner-related operations
 */

import { getPartnersFromStorage, savePartnersToStorage } from './storage.js';
import { validatePartnerName } from '../utils/validators.js';
import { addPartnerToCloud, removePartnerFromCloud, isFirebaseConnected } from '../services/firebase-service.js';

let partners = [];

/**
 * Initialize partners from storage
 */
export function initPartners() {
  partners = getPartnersFromStorage();
}

/**
 * Get all partners
 * @returns {Array<string>}
 */
export function getPartners() {
  return [...partners];
}

/**
 * Set partners (used for cloud sync)
 * @param {Array<string>} newPartners
 */
export function setPartners(newPartners) {
  partners = newPartners || [];
  savePartnersToStorage(partners);
}

/**
 * Add a new partner
 * @param {string} name - Partner name
 * @returns {object} { success: boolean, error: string }
 */
export async function addPartner(name) {
  const validation = validatePartnerName(name);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const trimmed = name.trim();

  // Check if partner already exists (case-insensitive)
  const lowerTrimmed = trimmed.toLowerCase();
  if (partners.some(p => p.toLowerCase() === lowerTrimmed)) {
    return { success: false, error: 'Partner already exists' };
  }

  partners.push(trimmed);
  savePartnersToStorage(partners);

  // Sync to cloud if available
  if (isFirebaseConnected()) {
    await addPartnerToCloud(trimmed);
  }

  return { success: true, error: '' };
}

/**
 * Remove a partner
 * @param {string} name - Partner name to remove
 * @returns {object} { success: boolean, error: string }
 */
export async function removePartner(name) {
  const index = partners.indexOf(name);
  if (index === -1) {
    return { success: false, error: 'Partner not found' };
  }

  partners.splice(index, 1);
  savePartnersToStorage(partners);

  // Sync to cloud if available
  if (isFirebaseConnected()) {
    await removePartnerFromCloud(name);
  }

  return { success: true, error: '' };
}

/**
 * Check if a partner exists
 * @param {string} name - Partner name
 * @returns {boolean}
 */
export function partnerExists(name) {
  return partners.includes(name);
}

/**
 * Get number of partners
 * @returns {number}
 */
export function getPartnerCount() {
  return partners.length;
}
