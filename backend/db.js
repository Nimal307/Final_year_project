const mysql = require('mysql2');

// Create a connection pool to the database
const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'nimal',
  database: 'car_rental_app',
});

module.exports = connection;