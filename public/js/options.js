import { STORAGE_KEYS } from './storageKeys.js';
import { dayDiffInclusive } from './utils.js';

// Load options page with selected car and extras
export function loadOptionsPage() {

  // Get the selected car and rental dates
  const selectedCar = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.SELECTED_CAR));
  const pickupDate = sessionStorage.getItem(STORAGE_KEYS.PICKUP_DATE);
  const dropDate = sessionStorage.getItem(STORAGE_KEYS.DROP_DATE);

  // If no car is selected, redirect to car selection page
  if (!selectedCar) {
    window.location.href = 'car_selection.html';
    return;
  }

  // Calculate rental days and store
  const days = dayDiffInclusive(pickupDate, dropDate);
  sessionStorage.setItem(STORAGE_KEYS.RENTAL_DAYS, days.toString());

  // Display car details
  const carDetailsDiv = document.getElementById('car-details');
  if (carDetailsDiv) {
    carDetailsDiv.innerHTML = `
      <div class="card mb-4 border-0">
        <div class="row g-0 align-items-center">
          <div class="col-12 text-center mb-3">
            <img src="${selectedCar.image}" class="img-fluid" alt="${selectedCar.model}" style="max-height: 400px; width: auto;">
          </div>
          <div class="col-12 text-center">
            <h2 class="mt-3 fw-bold">${selectedCar.make}  ${selectedCar.model}</h2>
          </div>
        </div>
      </div>
    `;
  }

  // Display base price for the renal period
  const basePriceElement = document.getElementById('basePrice');
  if (basePriceElement) {
    basePriceElement.textContent = `€${selectedCar.price * days}`;
  }

  // Set up listeners for options checkboxes and quantity inputs
  setupOptionListeners();
  updateTotal();

  // Update total price whenever an option is changed
  document.querySelectorAll('.option input').forEach(input => {
    input.addEventListener('change', updateTotal);
  });
}

// Set up listeners for all options checkboxes and quantity inputs
function setupOptionListeners() {
  // make sure seat options have the 'option' class
  const boosterSeatDiv = document.querySelector('label[for="boosterSeat"]')?.closest('.form-check');
  const babySeatDiv = document.querySelector('label[for="babySeat"]')?.closest('.form-check');
  if (boosterSeatDiv) boosterSeatDiv.classList.add('option');
  if (babySeatDiv) babySeatDiv.classList.add('option');

  const optionInputs = document.querySelectorAll('.option input[type="checkbox"], .option input[type="number"]');
  const days = parseInt(sessionStorage.getItem(STORAGE_KEYS.RENTAL_DAYS)) || 1;

  // Restore saved options from session storage
  const savedOptions = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.SELECTED_OPTIONS) || '[]');

  optionInputs.forEach(input => {
    const savedOption = savedOptions.find(opt => opt.id === input.id);
    if (savedOption) {
      if (input.type === 'checkbox') {
        input.checked = true;
      } else {
        input.value = savedOption.quantity || 0;
      }
    }

    // Handle option changes
    input.addEventListener('change', () => {
      // If CDW options, only one can be selected at a time
      if (input.type === 'checkbox' && input.name.startsWith('cdw_')) {
        document.querySelectorAll('input[name^="cdw_"]').forEach(cdwInput => {
          if (cdwInput !== input) cdwInput.checked = false;
        });
      }

      // Collect selected options
      const options = Array.from(document.querySelectorAll('.option input')).map(input => {
        const price = parseFloat(input.dataset.price) || 0;
        const isDaily = input.dataset.daily === 'true';
        const quantity = input.type === 'checkbox' ? (input.checked ? 1 : 0) : parseInt(input.value) || 0;

        return {
          id: input.id,
          name: input.dataset.name || '',
          price: price,
          daily: isDaily,
          quantity: quantity,
          total: isDaily ? price * days * quantity : price * quantity
        };
      }).filter(opt => opt.quantity > 0);

      // Save selected options and update total
      sessionStorage.setItem(STORAGE_KEYS.SELECTED_OPTIONS, JSON.stringify(options));
      updateTotal();
    });
  });
}

// Update total price based on selected options
function updateTotal() {
  const selectedCar = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.SELECTED_CAR));
  const days = parseInt(sessionStorage.getItem(STORAGE_KEYS.RENTAL_DAYS)) || 1;
  if (!selectedCar) return;

  let total = selectedCar.price * days;
  const selectedOptions = [];

document.querySelectorAll('.option input').forEach(input => {
    if (input.type === 'checkbox' && input.checked) {
        var price = parseFloat(input.dataset.price);
        if (isNaN(price)) {
            price = 0;
        }

        var isDaily = false;
        if (input.dataset.daily === 'true') {
            isDaily = true;
        }

        var optionTotal = 0;
        if (isDaily) {
            optionTotal = price * days;
        } else {
            optionTotal = price;
        }

        total += optionTotal;

        selectedOptions.push({
            id: input.id,
            name: input.dataset.name || '',
            price: price,
            isDaily: isDaily,
            quantity: 1,
            total: optionTotal
        });

    } else if (input.type === 'number') {
        var quantity = parseInt(input.value);
        if (isNaN(quantity)) {
            quantity = 0;
        }

        if (quantity > 0) {
            var price = parseFloat(input.dataset.price);
            if (isNaN(price)) {
                price = 0;
            }

            var isDaily = false;
            if (input.dataset.daily === 'true') {
                isDaily = true;
            }

            var optionTotal = 0;
            if (isDaily) {
                optionTotal = price * days * quantity;
            } else {
                optionTotal = price * quantity;
            }

            total += optionTotal;

            selectedOptions.push({
                id: input.id,
                name: input.dataset.name || '',
                price: price,
                isDaily: isDaily,
                quantity: quantity,
                total: optionTotal
            });
        }
    }
});


  const totalPriceElement = document.getElementById('totalPrice');
  if (totalPriceElement) {
    totalPriceElement.textContent = `€${total.toFixed(2)}`;
  }

  // Store the total amount in sessionStorage
  sessionStorage.setItem(STORAGE_KEYS.TOTAL_AMOUNT, total.toFixed(2));
  
  sessionStorage.setItem(STORAGE_KEYS.SELECTED_OPTIONS, JSON.stringify(selectedOptions));
}
