import { STORAGE_KEYS } from './storageKeys.js';
import { dayDiffInclusive } from './utils.js';

// Format currency
function formatCurrency(amount) {
    return `€${parseFloat(amount).toFixed(2)}`;
}

// Calculate and update booking summary: days, car cost, options cost, total cost and deposit
export function calculateBookingSummary() {
    try {
        // Get values saved in session storage(car,dates, options)
        const selectedCar = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.SELECTED_CAR) || '{}');
        const pickupDate = sessionStorage.getItem(STORAGE_KEYS.PICKUP_DATE);
        const dropDate = sessionStorage.getItem(STORAGE_KEYS.DROP_DATE);
        const selectedOptions = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.SELECTED_OPTIONS) || '[]');

        // Check if values are available
        if (!selectedCar || !pickupDate || !dropDate) {
            console.error('Missing booking information');
            return null;
        }

        // Calculate rental days and base price
        const days = dayDiffInclusive(pickupDate, dropDate);
        const dailyPrice = Number(selectedCar.price) || 0;
        const basePrice = dailyPrice * days;

        // Add cost of each extra option
        let optionsTotal = 0;
        selectedOptions.forEach(option => {
            if (option.quantity > 0) {
                optionsTotal += option.isDaily
                    ? option.price * days * option.quantity
                    : option.price * option.quantity;
            }
        });

        // Calculate total amount and deposit
        const totalAmount = basePrice + optionsTotal;
        const deposit = totalAmount * 0.5; // 50% deposit

        // Return all details to show later
        return {
            days,
            basePrice,
            options: selectedOptions.filter(opt => opt.quantity > 0),
            optionsTotal,
            totalAmount,
            deposit
        };
    } catch (error) {
        console.error('Error calculating booking summary:', error);
        return null;
    }
}

// Show booking summary on the webpage
export function updateBookingSummary() {
    const carName = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.SELECTED_CAR) || ' ');
    const summary = calculateBookingSummary();
    if (!summary) return;

    // Show car image and name
    const summaryDetails = document.getElementById('SummaryDetails');
    if (summaryDetails && carName) {
        summaryDetails.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-body p-3">
                    <div class="text-center mb-3">
                        <img src="${carName.image || '/img/car-placeholder.jpg'}" 
                             class="img-fluid rounded" 
                             alt="${carName.model || 'Selected Car'}"
                             style="max-height: 180px; width: auto; object-fit: cover;">
                    </div>
                    <h5 class="card-title text-center mb-3">${carName.make} ${carName.model || 'Car not selected'}</h5>
                </div>
            </div>
        `;
    }

    // Show total and deposit amounts in the payment box
    const totalElement = document.getElementById('totalAmount');
    const depositElement = document.getElementById('depositAmount');
    
    if (totalElement) {
        totalElement.textContent = formatCurrency(summary.totalAmount);
    }
    
    if (depositElement) {
        depositElement.textContent = formatCurrency(summary.deposit);
    }
}

// Format card number with spaces every 4 digits
function formatCardNumber(cardNumber) {
    const digits = cardNumber.replace(/\D/g, '');

    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}



// Validate expiry date
function validateExpiryDate(input) {
    const value = input.value;
    if (!value) return false;
    
    const [monthStr, yearStr] = value.split('/');
    const month = parseInt(monthStr, 10);
    const year = 2000 + parseInt(yearStr || '0', 10);
    
    if (month < 1 || month > 12 || isNaN(year) || value.length < 5) {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        return false;
    }
    
    // Check if date is in the future
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const isValid = (year > currentYear) || 
                   (year === currentYear && month >= currentMonth);
    
    input.classList.toggle('is-valid', isValid);
    input.classList.toggle('is-invalid', !isValid);
    
    return isValid;
}

// Validate card number has exactly 16 digits
function validateCardNumber(input) {
    const value = input.value.replace(/\s+/g, '');
    const isValid = /^\d{16}$/.test(value);
    
    input.classList.toggle('is-valid', isValid);
    input.classList.toggle('is-invalid', !isValid && input.value.length > 0);
    
    return isValid;
}

// Initialize card payment form
function initCardPaymentForm() {
    const cardNumberInput = document.getElementById('cardNumber');
    const expiryDateInput = document.getElementById('expiryDate');
    const cvvInput = document.getElementById('cvv');
    const paymentForm = document.getElementById('paymentForm');

    // Card number input formatting and validation
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', (e) => {
            const cursorPosition = e.target.selectionStart;
            const inputValue = e.target.value;
            const formattedValue = formatCardNumber(inputValue);
            
            // Calculate new cursor position
            let newCursorPosition = cursorPosition;
            const inputDigit = (inputValue.slice(0, cursorPosition).match(/\d/g) || []).length;
            
            const spacesBeforeCursor = (inputValue.slice(0, cursorPosition).match(/\s/g) || []).length;
            const newSpacesBeforeCursor = Math.floor(inputDigit / 4);
            
            newCursorPosition = cursorPosition + (newSpacesBeforeCursor - spacesBeforeCursor);
            
            e.target.value = formattedValue;
            e.target.setSelectionRange(newCursorPosition, newCursorPosition);
            
            validateCardNumber(e.target);
        });
        
        // Only numbers allowed
        cardNumberInput.addEventListener('keydown', (e) => {
            // Allow: backspace, delete, tab, escape, enter, arrows, home, end
            if ([8, 9, 27, 13, 46, 37, 38, 39, 40, 35, 36].includes(e.keyCode)) {
                return;
            }
            
            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].includes(e.keyCode)) {
                return;
            }
            
            // Only allow numbers
            if ((e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        });
        
        cardNumberInput.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const numbers = paste.replace(/\D/g, '');
            const formatted = formatCardNumber(numbers);
            
            const start = cardNumberInput.selectionStart;
            const end = cardNumberInput.selectionEnd;
            const value = cardNumberInput.value;
            
            cardNumberInput.value = value.substring(0, start) + formatted + value.substring(end);
            
            const newCursorPosition = start + formatted.length;
            cardNumberInput.setSelectionRange(newCursorPosition, newCursorPosition);
            
            validateCardNumber(cardNumberInput);
        });
    }
    
    // Expiry date input handling
    if (expiryDateInput) {
        expiryDateInput.addEventListener('input', (e) => {
            const cursorPosition = e.target.selectionStart;
            const inputValue = e.target.value;
            const previousValue = e.target.dataset.previousValue || '';
            
            // Get only digits and limit to 4
            const digits = inputValue.replace(/\D/g, '').slice(0, 4);
            let formattedValue = digits;
            
            if (digits.length >= 2) {
                formattedValue = `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
            }
            
            e.target.value = formattedValue;
            
            let newCursorPosition = cursorPosition;
            if (digits.length === 2 && inputValue.length === 2) {
                newCursorPosition = 3;
            }
            else if (digits.length === 2 && previousValue.length === 3) {
                newCursorPosition = 2;
            }
            else if (cursorPosition === 3 && digits.length === 3) {
                newCursorPosition = 4;
            }
            else if (cursorPosition >= 2 && digits.length > 2) {
                newCursorPosition = cursorPosition + 1;
            }

            e.target.dataset.previousValue = formattedValue;
            newCursorPosition = Math.min(newCursorPosition, formattedValue.length);
            e.target.setSelectionRange(newCursorPosition, newCursorPosition);
            
            validateExpiryDate(e.target);
        });
        
        // Only numbers allowed for expiry date
        expiryDateInput.addEventListener('keydown', (e) => {
            if (![37, 38, 39, 40, 8, 46, 9, 13, 27, 35, 36].includes(e.keyCode)) {
                expiryDateInput.dataset.previousValue = expiryDateInput.value;
            }
            if ([8, 9, 27, 13, 46, 37, 38, 39, 40, 35, 36].includes(e.keyCode)) {
                return;
            }
            if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].includes(e.keyCode)) {
                return;
            }
            if ((e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        });
        
        expiryDateInput.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const digits = paste.replace(/\D/g, '');
            
            if (digits.length >= 2) {
                const month = digits.slice(0, 2);
                const year = digits.slice(2, 4);
                expiryDateInput.value = `${month}/${year}`;
                validateExpiryDate(expiryDateInput);
            }
        });
    }
    
    // Payment form submission
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.button-text');
            const spinner = submitBtn.querySelector('.spinner-border');
            
            // Validate all fields
            const isCardValid = validateCardNumber(cardNumberInput);
            const isExpiryValid = validateExpiryDate(expiryDateInput);
            const isCVVValid = validateCVV(cvvInput);
            
            if (isCardValid && isExpiryValid && isCVVValid) {
                try {
                    submitBtn.disabled = true;
                    btnText.textContent = 'Processing...';
                    spinner.classList.remove('d-none');

                    // Simulate payment
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Save customer info to backend
                    try {
                        const userData = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
                        if (userData && userData.email) {
                            const res = await fetch('/customers', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    firstName: userData.firstName || '',
                                    lastName: userData.lastName || '',
                                    email: userData.email,
                                    phone: userData.phone || '',
                                    address: userData.address || '',
                                    dob: userData.dob || '',
                                    country: userData.country || ''
                                })
                            });
                            const data = await res.json().catch(() => ({}));
                            if (res.ok && data && typeof data.id !== 'undefined') {
                                sessionStorage.setItem('customerId', String(data.id));
                            }
                        }
                    } catch (err) {
                        console.error('Error saving customer to DB:', err);
                    }
                    
                    // Show success modal
                    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
                    successModal.show();
                    
                    // Handle booking save after OK
                    const handleOkClick = async () => {
                        try {
                            // Get all booking info
                            const selectedCar = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.SELECTED_CAR) || '{}');
                            const carId = selectedCar?.id || Number(sessionStorage.getItem(STORAGE_KEYS.SELECTED_CAR_ID));
                            const pickupDate = sessionStorage.getItem(STORAGE_KEYS.PICKUP_DATE);
                            const dropDate = sessionStorage.getItem(STORAGE_KEYS.DROP_DATE);
                            const pickupTime = sessionStorage.getItem(STORAGE_KEYS.PICKUP_TIME);
                            const dropTime = sessionStorage.getItem(STORAGE_KEYS.DROP_TIME);
                            const pickupPlace = sessionStorage.getItem(STORAGE_KEYS.PICKUP_PLACE);
                            const dropPlace = sessionStorage.getItem(STORAGE_KEYS.DROP_PLACE);
                            const customerId = Number(sessionStorage.getItem('customerId'));
                            const address = sessionStorage.getItem(STORAGE_KEYS.ADDRESS);
                            const userData = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
                            const customerEmail = userData.email || '';
                            const customerName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
                    
                            if (!customerId || !carId || !pickupDate || !dropDate || !customerEmail || !customerName) {
                                alert('Missing required booking information. Please make sure all fields are filled.');
                                return;
                            }
                    
                            // Create booking reference if missing
                            let bookingRef = sessionStorage.getItem(STORAGE_KEYS.BOOKING_REF);
                            if (!bookingRef) {
                                const now = new Date();
                                const year = now.getFullYear().toString().slice(-2);
                                const month = String(now.getMonth() + 1).padStart(2, '0');
                                const day = String(now.getDate()).padStart(2, '0');
                                const hours = String(now.getHours()).padStart(2, '0');
                                const minutes = String(now.getMinutes()).padStart(2, '0');
                                const seconds = String(now.getSeconds()).padStart(2, '0');
                                const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
                                const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                                
                                bookingRef = `BK${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}${random}`;
                                sessionStorage.setItem(STORAGE_KEYS.BOOKING_REF, bookingRef);
                            }
                    
                            // Get total and deposit amount
                            const summary = calculateBookingSummary();
                            const totalAmountStored = sessionStorage.getItem(STORAGE_KEYS.TOTAL_AMOUNT);
                            const totalAmount = totalAmountStored ? Number(totalAmountStored) : (summary?.totalAmount || 0);
                            const depositAmount = summary?.deposit || (totalAmount * 0.5);
                    
                            // Save booking to backend
                            const res = await fetch('/bookings', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    customerId,
                                    carId,
                                    pickupDate,
                                    dropDate,
                                    pickupTime,
                                    dropTime,
                                    pickupPlace,
                                    dropPlace,
                                    totalAmount,
                                    depositAmount,
                                    bookingRef,
                                    customerEmail,
                                    customerName,
                                    address
                                })
                            });
                    
                            if (!res.ok) {
                                const errText = await res.text().catch(() => '');
                                throw new Error(`Failed to save booking: ${res.status} ${errText}`);
                            }
                    
                            const data = await res.json().catch(() => ({}));
                            const bookingId = (data && typeof data.id !== 'undefined') ? String(data.id) : null;
                            const serverBookingRef = (data && data.bookingRef) ? data.bookingRef : bookingRef;
                    
                            sessionStorage.setItem('bookingId', bookingId || `temp-${Date.now()}`);
                            sessionStorage.setItem(STORAGE_KEYS.BOOKING_REF, serverBookingRef);
                            if (!totalAmountStored) {
                                sessionStorage.setItem(STORAGE_KEYS.TOTAL_AMOUNT, String(totalAmount));
                            }
                    
                            window.location.href = 'booking-confirmation.html';
                    
                        } catch (error) {
                            console.error('Error processing booking:', error);
                            alert('An error occurred while saving your booking. Please contact support if this persists.');
                        } finally {
                            okButton.removeEventListener('click', handleOkClick);
                            const modal = bootstrap.Modal.getInstance(document.getElementById('successModal'));
                            if (modal) modal.hide();
                        }
                    };
                    
                    
                    const okButton = document.getElementById('successOkBtn');
                    if (okButton) {
                        okButton.addEventListener('click', handleOkClick, { once: true });
                    }
                    
                } catch (error) {
                    console.error('Payment error:', error);
                } finally {

                    submitBtn.disabled = false;
                    btnText.textContent = 'Pay Now';
                    spinner.classList.add('d-none');
                }
            }
        });
    }
}

function validateCVV(input) {
    const value = input.value.trim();
    const isValid = /^\d{3}$/.test(value);
    
    input.classList.toggle('is-valid', isValid);
    input.classList.toggle('is-invalid', !isValid && value.length > 0);
    
    return isValid;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    updateBookingSummary();
    initCardPaymentForm();
});

export default {
    calculateBookingSummary,
    updateBookingSummary,
    initCardPaymentForm
};
