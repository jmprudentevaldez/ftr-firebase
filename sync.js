const express = require('express');
const admin = require('firebase-admin');
const mysql = require('mysql');
const serviceAccount = require('./assets/ftr-services.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://ftrdb-41c53-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

// Create an Express app
const app = express();
const port = 3000; // You can change the port as needed

// Connect to MySQL
const mysqlConnection = mysql.createConnection({
  host: 'localhost',
  database: 'ftr_api',
  user: 'root',
  password: ''
});

mysqlConnection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL!');
});

// Function to get all documents from Firestore and insert them into MySQL
async function getAllDocuments() {
  try {
    const snapshot = await db.collection('Enquiries').get();
    if (snapshot.empty) {
      console.log('No matching documents.');
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const docId = doc.id;

      // Prepare the MySQL query and values
      const query = `
        INSERT INTO tbl_enq_details (
          tracking_no, intake_date, child_id, person_id, contact_no,
          fname_ref, mname_ref, lname_ref, xname, date_of_incident, 
          place_happnd, hw_it_happnd, action_taken, adtnl_info, agency_name, 
          status, deleted, encoded_by, modified_by, rel_ous, date_inserted, 
          date_modified, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // Static data for MySQL query values
      const values = [
        data.mname,              // Static tracking number
        '2024-11-07',            // Static intake_date
        'child001',              // Static child_id
        'person001',             // Static person_id
        '1234567890',            // Static contact_no
        data.fname,              // Static fname_ref
        data.mname,              // Static mname_ref
        'Smith',                 // Static lname_ref
        'Xname',                 // Static xname
        '2024-10-15',            // Static date_of_incident
        'Some Place',            // Static place_happnd
        'Somehow it happened',   // Static hw_it_happnd
        'Action taken details',  // Static action_taken
        'Additional info here', // Static adtnl_info
        'Agency Name',           // Static agency_name
        'active',                // Static status
        0,                       // Static deleted (default 0)
        'user001',               // Static encoded_by
        'user001',               // Static modified_by
        data.rel_ous,           // Static rel_ous
        data.date_inserted,     // Static date_inserted
        data.date_modified,     // Static date_modified
        data.created_at,        // Static created_at
        data.updated_at         // Static updated_at
      ];

      // Insert into MySQL
      mysqlConnection.query(query, values, (error, results) => {
        if (error) {
          console.error('Error inserting data into MySQL:', error);
        } else {
          console.log(`Document ${docId} saved to MySQL.`);
        }
      });
    });
  } catch (error) {
    console.error('Error getting documents:', error);
  }
}

// API endpoint to trigger the Firestore to MySQL sync
app.get('/sync-enquiries', async (req, res) => {
  try {
    console.log('Syncing data from Firestore to MySQL...');
    await getAllDocuments();
    res.status(200).send('Enquiries synced successfully!');
  } catch (error) {
    console.error('Error during sync:', error);
    res.status(500).send('Error syncing enquiries.');
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
