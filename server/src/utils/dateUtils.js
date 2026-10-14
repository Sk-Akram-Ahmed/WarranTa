function calculateExpiryDate(purchaseDateInput, value, unit) {
  const pDate = new Date(purchaseDateInput);
  if (isNaN(pDate.getTime())) {
    throw new Error('Invalid purchase date');
  }

  const numVal = parseInt(value, 10);
  if (isNaN(numVal) || numVal <= 0) {
    throw new Error('Warranty period must be a positive integer');
  }

  const year = pDate.getUTCFullYear();
  const month = pDate.getUTCMonth();
  const day = pDate.getUTCDate();

  let targetYear = year;
  let targetMonth = month;

  if (unit === 'years') {
    targetYear += numVal;
  } else if (unit === 'months') {
    targetMonth += numVal;
    targetYear += Math.floor(targetMonth / 12);
    targetMonth = targetMonth % 12;
  } else {
    throw new Error("Invalid unit. Unit must be either 'months' or 'years'");
  }

  const maxDaysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(day, maxDaysInTargetMonth);

  return new Date(Date.UTC(targetYear, targetMonth, targetDay, 23, 59, 59, 999));
}

function computeWarrantyStatus(expiryDateInput, now = new Date()) {
  const exp = new Date(expiryDateInput);
  const diffMs = exp.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let status = 'Active';
  if (daysRemaining < 0) {
    status = 'Expired';
  } else if (daysRemaining <= 30) {
    status = 'Expiring Soon';
  } else {
    status = 'Active';
  }

  return {
    status,
    daysRemaining,
  };
}

module.exports = {
  calculateExpiryDate,
  computeWarrantyStatus,
};
