import { initBookingForm } from './booking.js';
import { loadPickupDropInfo } from './carSelection.js';
import { loadOptionsPage } from './options.js';
import { initConfirmPage } from './confirm.js';
import { confirmBooking } from './confirm.js';
import { calculateBookingSummary} from './payment.js';
import { updateBookingSummary} from './payment.js';



document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("bookingForm")) initBookingForm();
  if (document.getElementById("car-container")) loadPickupDropInfo();
  if (document.getElementById("car-details")) loadOptionsPage();
  if (document.getElementById("confirmPage")) initConfirmPage();
  if (document.getElementById("confirmBookingBtn")) confirmBooking();
  
  if (document.getElementById("paymentForm")) updateBookingSummary();
  if (document.getElementById("paymentForm")) calculateBookingSummary();
});