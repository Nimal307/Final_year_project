import { STORAGE_KEYS } from './storageKeys.js';

document.addEventListener('DOMContentLoaded', () => {
    // Get all saved booking from sessionStorage so we can show it on the confirmation page
    const bookingRef = sessionStorage.getItem(STORAGE_KEYS.BOOKING_REF);
    const customerId = sessionStorage.getItem('customerId');
    const selectedCar = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.SELECTED_CAR));
    const pickupDate = sessionStorage.getItem(STORAGE_KEYS.PICKUP_DATE);
    const dropDate = sessionStorage.getItem(STORAGE_KEYS.DROP_DATE);
    const pickupTime = sessionStorage.getItem(STORAGE_KEYS.PICKUP_TIME);
    const dropTime = sessionStorage.getItem(STORAGE_KEYS.DROP_TIME);
    const pickupPlace = sessionStorage.getItem(STORAGE_KEYS.PICKUP_PLACE);
    const dropPlace = sessionStorage.getItem(STORAGE_KEYS.DROP_PLACE);
    const totalAmount = sessionStorage.getItem(STORAGE_KEYS.TOTAL_AMOUNT);

    // Format date for display
    function formatDisplayDate(dateString) {
        if (!dateString) return '';
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Format time for display
    function formatDisplayTime(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    }

    // Put all the booking details on the page
    function updateBookingDetails() {
        // Show booking reference number
        const bookingIdEl = document.getElementById('bookingId');
        if (bookingIdEl) bookingIdEl.textContent = bookingRef || 'N/A';

        // Show selected car details
        const carDetailsEl = document.getElementById('carDetails');
        if (carDetailsEl) carDetailsEl.textContent = 
            `${selectedCar?.make || ''} ${selectedCar?.model || ''} (${selectedCar?.year || ''})`;
        
        // Show pickup and dropoff details
        const pickupInfoEl = document.getElementById('pickupInfo');
        if (pickupInfoEl) pickupInfoEl.textContent = 
            `${formatDisplayDate(pickupDate)} at ${formatDisplayTime(pickupTime)} - ${pickupPlace || ''}`;
        
        const dropoffInfoEl = document.getElementById('dropoffInfo');
        if (dropoffInfoEl) dropoffInfoEl.textContent = 
            `${formatDisplayDate(dropDate)} at ${formatDisplayTime(dropTime)} - ${dropPlace || ''}`;
        
        // Show total amount
        const totalAmountEl = document.getElementById('totalAmount');
        if (totalAmountEl) totalAmountEl.textContent = 
            totalAmount ? `€${parseFloat(totalAmount).toFixed(2)}` : 'N/A';
    }

    // Load customer details
    async function loadCustomerDetails() {
        const nameEl = document.getElementById('customerName');
        const emailEl = document.getElementById('customerEmail');
        const phoneEl = document.getElementById('customerPhone');
        const addressEl = document.getElementById('customerAddress');
        const userEmailBannerEl = document.getElementById('userEmail');

        // Defaults
        if (nameEl) nameEl.textContent = 'N/A';
        if (emailEl) emailEl.textContent = 'N/A';
        if (phoneEl) phoneEl.textContent = 'N/A';
        if (addressEl) addressEl.textContent = 'N/A';
        if (userEmailBannerEl) userEmailBannerEl.textContent = 'your email';

        if (!customerId) return;

        try {
            // Load customer details from API
            const res = await fetch(`/customers/${encodeURIComponent(customerId)}`);
            if (!res.ok) return;
            const data = await res.json();
            const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();

            if (nameEl) nameEl.textContent = fullName || 'N/A';
            if (emailEl) emailEl.textContent = data.email || 'N/A';
            if (phoneEl) phoneEl.textContent = data.phone || 'N/A';
            if (addressEl) addressEl.textContent = data.address || 'N/A';
            if (userEmailBannerEl) userEmailBannerEl.textContent = data.email || 'your email';
        } catch (e) {
            console.warn('Failed to load customer details:', e);
        }
    }

    // Check if we have the minimum required data
    if (!selectedCar || !pickupDate || !dropDate) {
        window.location.href = 'index.html';
        return;
    }

    // show booking details
    updateBookingDetails();
    // show customer details
    loadCustomerDetails();
});
