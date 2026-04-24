/**
 * Currency formatting utility for Nepalese Rupees (NPR)
 * All prices in the application are displayed using this function.
 */

const formatter = new Intl.NumberFormat('en-NP', {
  style: 'currency',
  currency: 'NPR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format a numeric amount as Nepalese Rupees.
 * @param {number} amount - The amount to format
 * @returns {string} Formatted string like "Rs. 1,234.00"
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rs. 0.00';
  // Intl may return "NPR" prefix; we normalize to "Rs."
  return `Rs. ${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format a currency amount with sign (for discounts, negative values)
 */
export function formatCurrencySigned(amount) {
  if (amount < 0) return `-${formatCurrency(Math.abs(amount))}`;
  return formatCurrency(amount);
}

/**
 * VAT rate for Nepal (13%)
 */
export const VAT_RATE = 0.13;

/**
 * Loyalty discount threshold (Rs. 5,000)
 */
export const LOYALTY_THRESHOLD = 5000;

/**
 * Loyalty discount percentage
 */
export const LOYALTY_DISCOUNT_RATE = 0.10;
