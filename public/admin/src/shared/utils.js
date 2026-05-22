// src/shared/utils.js

export const formatCurrency = (amount) => {
    const num = Number(amount);
    if (isNaN(num)) return 'ZAR 0.00';
    return new Intl.NumberFormat('en-ZA', { 
        style: 'currency', 
        currency: 'ZAR',
        minimumFractionDigits: 2
    }).format(num);
};

// **NEW: Compact formatter for cards (e.g. 1.2k, 1M)**
export const formatCompactNumber = (amount) => {
    const num = Number(amount);
    if (isNaN(num) || num === 0) return 'R 0';
    
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1
    }).format(num);
};

export const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};
export const validateSAID = (id) => {
    if (!id) return false;
    const str = id.toString().trim();
    if (str.length !== 13 || isNaN(Number(str))) return false;
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        let digit = parseInt(str[i]);
        if (i % 2 !== 0) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(str[12]);
};
