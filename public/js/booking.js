import { STORAGE_KEYS } from './storageKeys.js';

const pickupDateInput = document.getElementById("pickupDate");
const dropDateInput = document.getElementById("dropDate");
const pickupTimeInput = document.getElementById("pickupTime");
const dropTimeInput = document.getElementById("dropTime");
const pickupLocationInput = document.getElementById("pickupLocation");
const dropLocationInput = document.getElementById("dropLocation");
const bookingForm = document.getElementById("bookingForm");

export function initBookingForm() {
  const today = new Date();
  pickupDateInput.min = today.toISOString().split("T")[0];

  function apply2DaysRule() {
    if (!pickupDateInput.value) return;
    const pickupDate = new Date(pickupDateInput.value);
    const minDropDate = new Date(pickupDate);
    minDropDate.setDate(pickupDate.getDate() + 2);
    dropDateInput.min = minDropDate.toISOString().split("T")[0];
    if (!dropDateInput.value || new Date(dropDateInput.value) < minDropDate) {
      dropDateInput.value = minDropDate.toISOString().split("T")[0];
    }
  }
  pickupDateInput.addEventListener("change", apply2DaysRule);
  apply2DaysRule();

  bookingForm.addEventListener("submit", e => {
    e.preventDefault();
    const formData = {
      [STORAGE_KEYS.PICKUP_DATE]: pickupDateInput.value,
      [STORAGE_KEYS.PICKUP_TIME]: pickupTimeInput.value,
      [STORAGE_KEYS.DROP_DATE]: dropDateInput.value,
      [STORAGE_KEYS.DROP_TIME]: dropTimeInput.value,
      [STORAGE_KEYS.PICKUP_PLACE]: pickupLocationInput.value,
      [STORAGE_KEYS.DROP_PLACE]: dropLocationInput.value
      
    };
    Object.entries(formData).forEach(([k, v]) => sessionStorage.setItem(k, v));
    window.location.href = "car_selection.html";
  });
}
