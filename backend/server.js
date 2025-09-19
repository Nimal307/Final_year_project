const express = require("express");
const connection = require("./db");// MySQL connection
const path = require("path");
const app = express();
const nodemailer = require("nodemailer");

// Set up email sending using Nodemailer(Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "carrentalco.test@gmail.com",
    pass: "vsvynhzxmcsvmimv" // App password for Gmail
  }
});

app.use(express.json()); // Parse JSON request bodies
app.use(express.static(path.join(__dirname, "../public")));

//API: Get available cars
app.get("/available-cars", async (req, res) => {
  try {
    const { pickup_date, drop_date } = req.query;

    if (!pickup_date || !drop_date) {
      return res.status(400).json({ error: "pickup_date and drop_date are required" });
    }

    // Get available cars
    const query = `
      SELECT * FROM cars
      WHERE id NOT IN (
        SELECT car_id FROM bookings
        WHERE pickup_date <= ? AND drop_date >= ?
      )
    `;

    const [rows] = await connection.promise().query(query, [drop_date, pickup_date]);
    res.json(rows);
  } catch (error) {
    console.error("/available-cars error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API: Create customer details
app.post("/customers", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, dob, country, zip_code, city, flight } = req.body || {};

    // Validate required fields
    if (!email || !address || !country || !dob || !firstName || !lastName) {
      return res.status(400).json({ error: "firstName, lastName, email, address, country, dob are required" });
    }

    const insertSql = `
      INSERT INTO customers (first_name, last_name, email, address, zip_code, country, dob, city, phone, flight)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      firstName,
      lastName,
      email,
      address,
      zip_code || null,
      country,
      dob,
      city || null,
      phone || null,
      flight || null
    ];

    try {
      const [result] = await connection.promise().execute(insertSql, params);
      // Return the customer id
      return res.status(201).json({ id: result.insertId });
    } catch (err) {
      if (err && err.code === 'ER_DUP_ENTRY') {
        try {
          const [rows] = await connection.promise().query('SELECT id FROM customers WHERE email = ? LIMIT 1', [email]);
          if (rows && rows[0] && rows[0].id != null) {
            return res.status(200).json({ id: rows[0].id, existed: true });
          }
        } catch (lookupErr) {
          console.error('Lookup existing customer failed:', lookupErr);
        }
        
        return res.status(409).json({ error: "Customer with this email already exists" });
      }
      throw err;
    }
  } catch (error) {
    console.error("/customers error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// API: Get a customer by ID
app.get('/customers/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid customer id' });
    }
    const [rows] = await connection.promise().query(
      'SELECT id, first_name, last_name, email, phone, address FROM customers WHERE id = ? LIMIT 1',
      [id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const c = rows[0];
    return res.json({
      id: c.id,
      firstName: c.first_name,
      lastName: c.last_name,
      email: c.email,
      phone: c.phone,
      address: c.address
    });
  } catch (error) {
    console.error('/customers/:id error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API: Create a booking
app.post('/bookings', async (req, res) => {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const {
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
        bookingRef: originalBookingRef,
        customerEmail,
        customerName,
      } = req.body || {};

      // Validate required fields
      if (!customerId || !carId || !pickupDate || !dropDate || !customerEmail || !customerName) {
        return res.status(400).json({ error: 'Required fields missing' });
      }

      // Generate unique bookingRef if needed
      let bookingRef = originalBookingRef;
      if (!bookingRef || retryCount > 0) {
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
      }

      // Check for duplicate bookingRef
      const [existingBooking] = await connection.promise().query(
        'SELECT booking_id FROM bookings WHERE booking_ref = ?',
        [bookingRef]
      );
      if (existingBooking.length > 0) {
        retryCount++;
        if (retryCount >= maxRetries) throw new Error('Failed to generate unique bookingRef');
        continue;
      }

      // Insert booking into DB
      const insertSql = `
        INSERT INTO bookings (
          booking_ref, customer_id, car_id, pickup_date, drop_date, pickup_time,
          drop_time, pickup_place, drop_place, total_amount, deposit_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        bookingRef,
        Number(customerId),
        Number(carId),
        pickupDate,
        dropDate,
        pickupTime || null,
        dropTime || null,
        pickupPlace || null,
        dropPlace || null,
        totalAmount != null ? Number(totalAmount) : null,
        depositAmount != null ? Number(depositAmount) : null
      ];

      const [result] = await connection.promise().execute(insertSql, params);

      // Send confirmation email using Nodemailer
      const mailOptions = {
        from: '"Car Rental Co." <yourgmail@gmail.com>',
        to: customerEmail,
        subject: "Booking Confirmation",
        text: `Hello ${customerName},

Thank you for choosing Spring Car Hire. Your booking has been successfully confirmed.

Booking Reference: ${bookingRef}

--- Check Your Booking ---
You can view your current booking status and details anytime in the "My Booking" section of our website by entering your booking reference code (${bookingRef}).

--- Cancellation & Refund ---
If you need to cancel your booking, please go to the "My Booking" section, enter your booking reference code, and select "Cancel Booking".  
We’ll process your refund within 2 business days from the date of cancellation.

Thank you once again for choosing us. We look forward to serving you!


For assistance, contact us:
Email: carrentalco@gamil.com
Phone: +248 123 4567

Best regards,
Spring Car Hire Team`
      };

      await transporter.sendMail(mailOptions);

      return res.status(201).json({ 
        id: result.insertId, 
        bookingRef,
        message: 'Booking created and confirmation email sent'
      });

    } catch (error) {
      console.error('/bookings error:', error);
      retryCount++;
      if (retryCount >= maxRetries) {
        return res.status(500).json({ 
          error: 'Failed to create booking or send email',
          details: error.message
        });
      }
    }
  }
});


// API: Get booking details by booking_ref
app.get('/bookings/:bookingRef', async (req, res) => {
  try {
    const bookingRef = req.params.bookingRef;
    console.log('GET /bookings : bookingRef =', bookingRef);

    const query = `
      SELECT 
        b.booking_ref,
        b.pickup_date,
        b.drop_date,
        b.pickup_time,
        b.drop_time,
        b.pickup_place,
        b.drop_place,
        b.total_amount,
        b.deposit_amount,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        car.make,
        car.model,
        car.car_code
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN cars car ON b.car_id = car.id
      WHERE b.booking_ref = ?
      LIMIT 1
    `;

    const [rows] = await connection.promise().query(query, [bookingRef]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('/bookings/:bookingRef error:', error);
    // Temporarily send error.message so you can see the DB error while debugging.
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// API: Cancel a booking
app.delete("/bookings/:bookingRef", async (req, res) => {
  const bookingRef = req.params.bookingRef;

  try {
    const [result] = await connection.promise().query(
      "DELETE FROM bookings WHERE booking_ref = ?",
      [bookingRef]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error cancelling booking" });
  }
});



// Start server
app.listen(3001, () => console.log("Server running on http://localhost:3001"));
