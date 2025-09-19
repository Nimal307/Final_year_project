import { STORAGE_KEYS } from './storageKeys.js';
import { formatDate } from './utils.js';

const carsContainer = document.getElementById("car-container");

export function loadPickupDropInfo() {
  // Get stored values
  const pickupDate = sessionStorage.getItem(STORAGE_KEYS.PICKUP_DATE) || "";
  const pickupTime = sessionStorage.getItem(STORAGE_KEYS.PICKUP_TIME) || "";
  const dropDate = sessionStorage.getItem(STORAGE_KEYS.DROP_DATE) || "";
  const dropTime = sessionStorage.getItem(STORAGE_KEYS.DROP_TIME) || "";
  const pickupPlace = sessionStorage.getItem(STORAGE_KEYS.PICKUP_PLACE) || "";
  const dropPlace = sessionStorage.getItem(STORAGE_KEYS.DROP_PLACE) || "";

  // Update the display elements
  const pickupDateDisplay = document.getElementById("pickupDateDisplay");
  const pickupTimeDisplay = document.getElementById("pickupTimeDisplay");
  const dropDateDisplay = document.getElementById("dropDateDisplay");
  const dropTimeDisplay = document.getElementById("dropTimeDisplay");
  const pickupPlaceDisplay = document.getElementById("pickupPlaceDisplay");
  const dropPlaceDisplay = document.getElementById("dropPlaceDisplay");

  if (pickupDateDisplay) pickupDateDisplay.textContent = formatDate(pickupDate);
  if (pickupTimeDisplay) pickupTimeDisplay.textContent = pickupTime;
  if (dropDateDisplay) dropDateDisplay.textContent = formatDate(dropDate);
  if (dropTimeDisplay) dropTimeDisplay.textContent = dropTime;
  if (pickupPlaceDisplay) pickupPlaceDisplay.textContent = pickupPlace;
  if (dropPlaceDisplay) dropPlaceDisplay.textContent = dropPlace;

  // Load available cars
  fetch(`/available-cars?pickup_date=${pickupDate}&drop_date=${dropDate}`)
    .then(res => res.json())
    .then(cars => displayCars(cars))
    .catch(err => console.log("Error fetching cars:", err));
}

function displayCars(cars) {
  const carsContainer = document.getElementById("car-container");
  carsContainer.innerHTML = "";
  if (!Array.isArray(cars)) return;

  cars.forEach(car => {
    const col = document.createElement("div");
    col.className = "col-md-4 wi";
    col.innerHTML = `
      <br>
      <div class="card mb-3 shadow-sm">
        <img src="${car.image}" class="card-img-top" alt="${car.model}" style="width: 50%; height: auto;">
        <div class="card-body">
          <h5 class="card-title fw-bold" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${car.make} ${car.model}</h5>
          <p>
            <span data-bs-toggle="tooltip" data-bs-placement="top" title="${car.seat} Seats">
              <img src="img/r_car-seat.png" class="interiorParts">
            </span>
            <span><img src="img/r_snowflake.png" class="interiorParts" data-bs-toggle="tooltip" data-bs-placement="top" title="${car.air_conditioning}"></span>
            <span><img src="img/r_gas-pump-icon.webp" class="interiorParts" data-bs-toggle="tooltip" data-bs-placement="top" title="${car.fuel}"></span>
            <span><img src="img/r_trans.png" class="interiorParts" data-bs-toggle="tooltip" data-bs-placement="top" title="${car.transmission}"></span>
            <span><img src="img/r_airbag.png" class="interiorParts" data-bs-toggle="tooltip" data-bs-placement="top" title="${car.airbag}"></span>
            <span><img src="img/r_baggage-icon-png-33.png" class="interiorParts" data-bs-toggle="tooltip" data-bs-placement="top" title="Luggage Capacity: ${car.baggage}"></span>
          </p>
          <p class="card-text fw-bold" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">Price per day: <span style="color: green">&euro;${car.price}</span></p>
          <button class="btn btn-success book-now" data-car-id="${car.id}">Continue</button>
        </div>
      </div>
    `;

    const tooltipTriggerList = [].slice.call(col.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    const btn = col.querySelector(".book-now");
    btn.addEventListener("click", () => {
      sessionStorage.setItem(STORAGE_KEYS.SELECTED_CAR_ID, String(car.id));
      sessionStorage.setItem(STORAGE_KEYS.SELECTED_CAR, JSON.stringify(car));
      window.location.href = "options.html";
    });
    carsContainer.appendChild(col);
  });
}