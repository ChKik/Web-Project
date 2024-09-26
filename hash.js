const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const saltRounds = 8; // Ρύθμιση για salt rounds

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'ceid123@',
  database: 'ResQ'
});

// Υποσχέσεις για τη σύνδεση με το pool
const promisePool = pool.promise();

async function hashPasswordsForRescuers() {
  try {
    // Διαβάστε όλα τα records από τον πίνακα rescuer
    const [results] = await promisePool.query('SELECT rescuer_id, password_res FROM rescuer');

    for (const row of results) {
      try {
        // Κάντε hash το password
        const hashedPassword = await bcrypt.hash(row.password_res, saltRounds);

        // Ενημερώστε το hashed password στη βάση δεδομένων
        await promisePool.query('UPDATE rescuer SET password_res = ? WHERE rescuer_id = ?', [hashedPassword, row.rescuer_id]);
        console.log(`Password for rescuer ID ${row.rescuer_id} updated successfully.`);
      } catch (error) {
        console.error(`Error hashing password for rescuer ID ${row.rescuer_id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in hashPasswordsForRescuers function:', error);
  } finally {
    // Κλείστε το pool
    pool.end();
  }
}

// Εκτέλεση της συνάρτησης
hashPasswordsForRescuers();
