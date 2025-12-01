//src/utilities/helper.js
export function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

export function formatTime (dateString) {
  return new Date(dateString).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function buildImagePath (imageUrl) {
  return imageUrl.startsWith('https') ? 
  imageUrl : 
  `http://localhost:5000${imageUrl}`
}

export function removeExtraSpaces (strToFormat) {
  return strToFormat.trim().replace(/\s+/g, ' ')
}