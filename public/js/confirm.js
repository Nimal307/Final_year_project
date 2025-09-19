import { STORAGE_KEYS } from './storageKeys.js';
import { dayDiffInclusive, formatDate } from './utils.js';

// Load all the boking info
export function loadConfirmPage() {
  // Get the selected car info from sessionstorage
  const selectedCar = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.SELECTED_CAR));
  const pickupDate = sessionStorage.getItem(STORAGE_KEYS.PICKUP_DATE);
  const dropDate = sessionStorage.getItem(STORAGE_KEYS.DROP_DATE);
  const pickupTime = sessionStorage.getItem(STORAGE_KEYS.PICKUP_TIME);
  const dropTime = sessionStorage.getItem(STORAGE_KEYS.DROP_TIME);
  const pickupPlace = sessionStorage.getItem(STORAGE_KEYS.PICKUP_PLACE);
  const dropPlace = sessionStorage.getItem(STORAGE_KEYS.DROP_PLACE);
  const selectedOptions = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.SELECTED_OPTIONS) || '[]');

  // Calculate rental days
  const days = dayDiffInclusive(pickupDate, dropDate);
  const dailyPrice = Number(selectedCar.price) || 0;
  const basePrice = dailyPrice * days;

  // Build selected options list
  let optionsTotal = 0;
  let optionsHTML = '';

  selectedOptions.forEach(option => {
    if (option.quantity > 0) {
      const optionTotal = option.isDaily
        ? option.price * days * option.quantity
        : option.price * option.quantity;
      optionsTotal += optionTotal;

      // HTML for each option to show name, quality, daily info, and price
      optionsHTML += `
        <div class="d-flex justify-content-between mb-2">
          <span style="font-weight: 500; font-size: small;">
            ${option.name} ${option.quantity > 1 ? `(x${option.quantity})` : ''}
            ${option.isDaily ? `<br><small class="text-muted">€${option.price} × ${days} days</small>` : ''}
          </span>
          <span style="font-weight: 500; font-size: smaller;">
            €${optionTotal.toFixed(2)}
          </span>
        </div>`;
    }
  });

  const total = basePrice + optionsTotal;

  // Save total amount to sessionstorage
  try {
    sessionStorage.setItem(STORAGE_KEYS.TOTAL_AMOUNT, String(total));
  } catch (e) {
    console.warn('Unable to persist TOTAL_AMOUNT to sessionStorage', e);
  }

  // Find the container to show the booking details
  const confirmDetails = document.getElementById("confirm-details");
  if (!confirmDetails) {
    console.error("Could not find #confirm-details");
    return;
  }

  // Insert all the booking details
  confirmDetails.innerHTML = `
    <div class="text-center mb-4">
      <img src="${selectedCar.image}" class="img-fluid rounded" alt="${selectedCar.model}" style="max-height: 300px; width: auto;">
      <h2 class="mt-3 fw-bold">${selectedCar.make} ${selectedCar.model}</h2>
    </div>
    
    <div class="card shadow-sm">
      <div class="card-header bg-primary text-white">
        <h4 class="mb-0">Booking Details</h4>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <div class="card h-100">
              <div class="card-body">
                <h5 class="card-title text-primary">Pick-up Information</h5>
                <p class="mb-1"><i class="bi bi-calendar-check me-2"></i> ${formatDate(pickupDate)}</p>
                <p class="mb-1"><i class="bi bi-clock me-2"></i> ${pickupTime || '--:--'}</p>
                <p class="mb-0"><i class="bi bi-geo-alt me-2"></i> ${pickupPlace || ''}</p>
              </div>
            </div>
          </div>
          <div class="col-md-6 mt-3 mt-md-0">
            <div class="card h-100">
              <div class="card-body">
                <h5 class="card-title text-primary">Drop-off Information</h5>
                <p class="mb-1"><i class="bi bi-calendar-check me-2"></i> ${formatDate(dropDate)}</p>
                <p class="mb-1"><i class="bi bi-clock me-2"></i> ${dropTime || '--:--'}</p>
                <p class="mb-0"><i class="bi bi-geo-alt me-2"></i> ${dropPlace || ''}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card mt-4">
          <div class="card-header bg-light">
            <h5 class="mb-0">Rental Summary</h5>
          </div>
          <div class="card-body">
            <div class="d-flex justify-content-between mb-2">
              <span>Vehicle:</span>
              <span>${selectedCar.make} ${selectedCar.model}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span>Pickup Date:</span>
              <span>${formatDate(pickupDate)}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span>Return Date:</span>
              <span>${formatDate(dropDate)}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span>Duration:</span>
              <span>${days} day${days > 1 ? 's' : ''}</span>
            </div>
            ${optionsHTML}
            <hr>
            <div class="d-flex justify-content-between fw-bold">
              <span>Total Amount</span>
              <span class="text-primary">€${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

// Initialize phone input
export function phoneInputInit() {
    const input = document.querySelector("#inputPhone");
    if (input) {
      window.intlTelInput(input, {
        initialCountry: "SC", // Seychelles country code
        preferredCountries: ["SC"],
        separateDialCode: true,
        utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js"
      });
    }
  };

  // Fill country dropdown
  export function fillCountryDropdown() {
    const allCountries = window.intlTelInputGlobals.getCountryData();
    const countrySelect = document.querySelector("#userCountry");

    if (countrySelect) {
      allCountries.forEach(c => {
        const option = document.createElement("option");
        option.value = c.iso2; // e.g. "in"
        option.textContent = c.name; // e.g. "India";
        countrySelect.appendChild(option);
      });
    }
}

// Initialize phone input
function initPhoneInput() {
    const phoneInput = document.getElementById('inputPhone');
    if (phoneInput) {
      // Prevent non-numeric characters
      phoneInput.addEventListener('keypress', function(e) {
        // Only allow 0-9
        if (e.key < '0' || e.key > '9') {
          e.preventDefault();
        }
      });
      
      phoneInput.addEventListener('paste', function(e) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        const numbersOnly = text.replace(/\D/g, '');
        document.execCommand('insertText', false, numbersOnly);
      });
    }
  }

  // Handle booking confirmation
  export function confirmBooking() {
    const confirmBtn = document.getElementById('confirmBookingBtn');
    const confirmationMessage = document.getElementById('confirmationMessage');
    const termsCheck = document.getElementById('termsCheck');
    
    // Make sure terms are accepted
    if (!termsCheck.checked) {
      alert('Please accept the Terms & Conditions to continue.');
      return;
    }
    
    // Disable button and show spinner while processing
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Processing...';
    
    // Simulate server call, then show confirmation message
    setTimeout(() => {
      confirmationMessage.classList.remove('d-none');
      setTimeout(() => {
        window.location.href = '/payment.html';
      }, 2000);
    }, 1500);
  }

  // Validate and submit form
  export function validateAndSubmitForm(event) 
  {
    event.preventDefault();
    
    const form = event.target;
    const confirmButton = document.getElementById('confirmButton');
    const buttonText = confirmButton.querySelector('.button-text');
    const spinner = confirmButton.querySelector('.spinner-border');
    
    // Reset previous error
    form.querySelectorAll('.is-invalid').forEach(el => {
      el.classList.remove('is-invalid');
    });
    
    // Define required fields explicitly
    const requiredFields = [
      { id: 'inputFirstName', name: 'First Name' },
      { id: 'inputLastName', name: 'Last Name' },
      { id: 'inputEmail4', name: 'Email', type: 'email' },
      { id: 'inputAddress', name: 'Address' },
      { id: 'inputDOB', name: 'Date of Birth', type: 'date', minAge: 18 },
      { id: 'userCountry', name: 'Country' },
      { id: 'termsCheck', name: 'Terms & Conditions', type: 'checkbox' }
    ];
    
    let isValid = true;
    
    requiredFields.forEach(field => {
      const input = document.getElementById(field.id);
      if (!input) return;
      
      // Check each field
      if ((input.type !== 'checkbox' && !input.value.trim()) || 
          (input.type === 'checkbox' && !input.checked)) {
        
        input.classList.add('is-invalid');
        
        if (input.id === 'termsCheck') {
          showError(input, 'You must accept the terms and conditions to continue');
        } else {
          showError(input, `${field.name} is required`);
        }
        
        isValid = false;
      } 

      else if (field.type === 'email' && input.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(input.value.trim())) {
          input.classList.add('is-invalid');
          showError(input, 'Please enter a valid email address (e.g., example@domain.com)');
          isValid = false;
        }
      }

      // Special validation for date of birth
      else if (field.id === 'inputDOB' && input.value) {
        const dob = new Date(input.value);
        const today = new Date();
        const minAgeDate = new Date();
        minAgeDate.setFullYear(today.getFullYear() - field.minAge);
        
        if (dob > minAgeDate) {
          input.classList.add('is-invalid');
          showError(input, `You must be at least ${field.minAge} years old to rent a car`);
          isValid = false;
        }
      }
    });
    
    // If form is not valid, stop submission
    if (!isValid) {
      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }
    
    confirmButton.disabled = true;
    buttonText.textContent = 'Processing...';
    spinner.classList.remove('d-none');
    
    // Save data to sessionStorage
    const userData = {
      firstName: document.getElementById('inputFirstName')?.value.trim() || '',
      lastName: document.getElementById('inputLastName')?.value.trim() || '',
      email: document.getElementById('inputEmail4')?.value.trim() || '',
      address: document.getElementById('inputAddress')?.value.trim() || '',
      dob: document.getElementById('inputDOB')?.value || '',
      country: document.getElementById('userCountry')?.value || '',
      phone: document.getElementById('inputPhone')?.value?.trim() || ''
    };
    try {
      sessionStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (e) {
      console.warn('Unable to persist USER_DATA to sessionStorage', e);
    }
    
    // Simulate form processing
    setTimeout(() => {
      const confirmationMessage = document.getElementById('confirmationMessage');
      if (confirmationMessage) {
        confirmationMessage.classList.remove('d-none');
        confirmationMessage.scrollIntoView({ behavior: 'smooth' });
      }
      
      setTimeout(() => {
        window.location.href = '/payment.html';
      }, 1500);
      
    }, 2000);
    
    return false;
  }

  // Show confirmation message
  export function showConfirmation() {
    const confirmationMessage = document.getElementById('confirmationMessage');
    if (confirmationMessage) {
      confirmationMessage.classList.remove('d-none');
      confirmationMessage.scrollIntoView({ behavior: 'smooth' });
      
      setTimeout(() => {
        window.location.href = '/payment.html';
      }, 3000);
    }
  }

  // Show error message for a field
export function showError(input, message) {

    const parent = input.type === 'checkbox' ? input.closest('.form-check') : input.parentNode;
    
    const existingError = parent.querySelector('.invalid-feedback');
    if (existingError) {
      existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    
    if (input.type === 'checkbox') {
      const label = parent.querySelector('label');
      if (label) {
        label.insertAdjacentElement('afterend', errorDiv);
      } else {
        parent.appendChild(errorDiv);
      }
    } else {
      parent.appendChild(errorDiv);
    }
  }

  // Initialize confirm page
  export function initConfirmPage() {
    loadConfirmPage();
    phoneInputInit();
    fillCountryDropdown();
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById("confirmPage")) {
        initConfirmPage();
        
        // Hide the confirmation message initially
        const confirmationMessage = document.getElementById('confirmationMessage');
        if (confirmationMessage) {
            confirmationMessage.classList.add('d-none');
        }
    }
    
    // Set up form submission
    const bookingForm = document.getElementById("bookingForm");
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(event) {
            event.preventDefault();
            validateAndSubmitForm(event);
            return false;
        });
    }
    
    // Set up button click
    const confirmButton = document.getElementById("confirmButton");
    if (confirmButton) {
        confirmButton.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            const form = document.getElementById("bookingForm");
            if (form) {
                const submitEvent = new Event('submit', { cancelable: true });
                form.dispatchEvent(submitEvent);
                if (!submitEvent.defaultPrevented) {
                    form.submit();
                }
            }
        });
    }
});
