//src/utilities/helper.js (frontend, user side)
// Updated with VNPay integration support


export function formatPrice(price) {
  if (price === null || price === undefined) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
}

/**
 * Format date to Vietnamese locale
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('vi-VN');
}

/**
 * Format time to Vietnamese locale
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted time string
 */
export function formatTime(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format date and time together
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Build full image path from relative or absolute URL
 * @param {string} imageUrl - Image URL
 * @returns {string} Full image path
 */
export function buildImagePath(imageUrl) {
  if (!imageUrl) return '';
  return imageUrl.startsWith('https')
    ? imageUrl
    : `http://localhost:5000${imageUrl}`;
}

/**
 * Remove extra whitespace from string
 * @param {string} strToFormat - String to clean
 * @returns {string} Cleaned string
 */
export function removeExtraSpaces(strToFormat) {
  if (!strToFormat) return '';
  return strToFormat.trim().replace(/\s+/g, ' ');
}

/**
 * Format VNPay date string to readable format
 * VNPay format: yyyyMMddHHmmss
 * @param {string} vnpayDate - VNPay date string
 * @returns {string} Formatted date string
 */
export function formatVnpayDate(vnpayDate) {
  if (!vnpayDate || vnpayDate.length !== 14) return vnpayDate || '';
  
  const year = vnpayDate.substring(0, 4);
  const month = vnpayDate.substring(4, 6);
  const day = vnpayDate.substring(6, 8);
  const hour = vnpayDate.substring(8, 10);
  const minute = vnpayDate.substring(10, 12);
  const second = vnpayDate.substring(12, 14);
  
  return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
}

/**
 * Truncate string to specified length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
export function truncateString(str, maxLength = 50) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

/**
 * Validate Vietnamese phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Is valid
 */
export function isValidVietnamesePhone(phone) {
  if (!phone) return false;
  const pattern = /^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/;
  return pattern.test(phone.replace(/\s/g, ''));
}

/**
 * Format phone number for display
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Generate a random string (for unique IDs)
 * @param {number} length - Length of string
 * @returns {string} Random string
 */
export function generateRandomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get order status display info
 * @param {string} status - Order status
 * @returns {object} Display info { label, color, icon }
 */
export function getOrderStatusInfo(status) {
  const statusMap = {
    pending: { label: 'Pending', color: '#f59e0b', icon: 'fa-clock' },
    confirmed: { label: 'Confirmed', color: '#3b82f6', icon: 'fa-check' },
    shipped: { label: 'Shipped', color: '#8b5cf6', icon: 'fa-truck' },
    delivered: { label: 'Delivered', color: '#10b981', icon: 'fa-check-circle' },
    cancelled: { label: 'Cancelled', color: '#ef4444', icon: 'fa-times-circle' }
  };
  return statusMap[status] || { label: status, color: '#6b7280', icon: 'fa-question' };
}

/**
 * Get payment status display info
 * @param {string} status - Payment status
 * @returns {object} Display info { label, color, icon }
 */
export function getPaymentStatusInfo(status) {
  const statusMap = {
    pending: { label: 'Pending', color: '#f59e0b', icon: 'fa-clock' },
    paid: { label: 'Paid', color: '#10b981', icon: 'fa-check-circle' },
    refunded: { label: 'Refunded', color: '#8b5cf6', icon: 'fa-undo' },
    failed: { label: 'Failed', color: '#ef4444', icon: 'fa-times-circle' },
    expired: { label: 'Expired', color: '#6b7280', icon: 'fa-clock' }
  };
  return statusMap[status] || { label: status, color: '#6b7280', icon: 'fa-question' };
}