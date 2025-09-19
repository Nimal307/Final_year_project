// Add click listener to the search button
document.getElementById('searchBtn').addEventListener('click', async () => {
    const ref = document.getElementById('bookingRef').value.trim();
    const errorEl = document.getElementById('error');
    const resultCard = document.getElementById('resultCard');
  
    errorEl.textContent = '';
    resultCard.classList.add('d-none');
  
    // If the input is empty, show error message
    if (!ref) {
      errorEl.textContent = 'Please enter your booking reference.';
      return;
    }
  
    try {
    // Fetch the booking data from the server
      const res = await fetch(`/bookings/${ref}`);
      if (!res.ok) {
        if (res.status === 404) {
          errorEl.textContent = 'Booking not found.';
        } else {
          errorEl.textContent = 'Something went wrong. Please try again.';
        }
        return;
      }
  
      // Parse the booking data
      const data = await res.json();
      resultCard.classList.remove('d-none');
  
      // Display the booking details
      resultCard.innerHTML = `
         <div class="card shadow">
    <div class="card-header bg-success text-white">
      <h2 class="h4 mb-0">Booking Confirmed!</h2>
    </div>
    <div class="card-body">
      <div class="text-center mb-4">
        <div class="mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="#198754" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
          </svg>
        </div>
        <h3>Thank you for your booking!</h3>
        <p class="text-muted">Your booking has been confirmed. We've sent a confirmation email to <span>${data.email}</span></p>
      </div>

      <div class="row">
        <div class="col-md-6">
          <h4>Booking Details</h4>
          <p><strong>Booking Reference:</strong> ${data.booking_ref}</p>
          <p><strong>Car:</strong> ${data.make} ${data.model}</p>
          <p><strong>Pickup:</strong> ${data.pickup_date} at ${data.pickup_time || 'N/A'} from ${data.pickup_place || 'N/A'}</p>
          <p><strong>Drop-off:</strong> ${data.drop_date} at ${data.drop_time || 'N/A'} at ${data.drop_place || 'N/A'}</p>
          <p><strong>Total Amount:</strong> ${data.total_amount}</p>
          <p><strong>Deposit Amount:</strong> ${data.deposit_amount}</p>
        </div>
        <div class="col-md-6">
          <h4>Customer Information</h4>
          <p><strong>Name:</strong> ${data.first_name} ${data.last_name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>

        </div>
      </div>

      <div class="mt-4">
        <h5>Additional Information</h5>
        <p>Your vehicle will be ready for pickup at the scheduled time. Please bring your driver's license and the credit card used for payment when picking up the vehicle.</p>
        <p>If you have any questions, please contact our customer service at <a href="gmail:carrentalco@gmail.com">carrentalco@gmail.com</a> or call us at +248 2123456.</p>

        <div class="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
          <a href="index.html" class="btn btn-outline-primary me-md-2">Back to Home</a>
          <button id="printBtn" class="btn btn-primary">Print Confirmation</button>
        </div>

        <button id="cancelBookingBtn" class="btn btn-danger mt-3 w-100">Cancel Booking</button>
      </div>
    </div>
  </div>`;
  
      // Handle booking cancellation
      document.getElementById('cancelBookingBtn').addEventListener('click', async () => {
        if (!confirm("Are you sure you want to cancel this booking?")) return;
        try {
          const response = await fetch(`/bookings/${data.booking_ref}`, { method: "DELETE" });
          if (response.ok) {
            alert("Booking cancelled successfully");
            window.location.reload();
          } else {
            const result = await response.json();
            alert(result.message || "Failed to cancel booking");
          }
        } catch (error) {
          console.error(error);
          alert("Error cancelling booking");
        }
      });
  
      // Handle Print button
      document.getElementById('printBtn').addEventListener('click', () => {
        window.print();
      });
  
    } catch (err) {
      console.error(err);
      errorEl.textContent = 'Error fetching booking. Try again later.';
    }
  });
  