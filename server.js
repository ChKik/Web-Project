if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const initializePassport = require('./lib/dao.js');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const sqlClient = require('./sqlclient');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const crypto = require('crypto');
const helmet = require('helmet');
const morgan = require('morgan');


const PORT = 3000;//3000;
const users = [];

initializePassport(
  passport,
  username => sqlClient.getUserByUsername(username),
  id => sqlClient.getUserById(id)
);

// MIDDLEWARES
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(flash());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); // Assuming you have a public directory for static files
// Use cors middleware
// Define CORS options
console.log('CORS Origin:', process.env.FRONTEND_URL || 'http://127.0.0.1:5500'); // Log the frontend URL for debugging
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://127.0.0.1:5500',//'http://127.0.0.1:5500', //'http://127.0.0.1:3000',  // Allow the frontend to access this
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true // Allow credentials
};

app.use(cors(corsOptions));
//app.options('*', cors(corsOptions)); // Handle preflight requests for all routes
app.use(methodOverride('_method'));

// const jsonParser = bodyParser.json();

// //tesing 
// app.use((req, res, next) => {
//   console.log('Request Headers:', req.headers);
//   console.log('Response Headers:', res.getHeaders());
//   next();
// });


// Session configuration
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);
// app.use(passport.initialize());
// app.use(passport.session());

/*---------------Routes----------------*/
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true,
}));

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    users.push({
      id: Date.now().toString(),
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      password: hashedPassword,
    });
    console.log(users);
    res.redirect('/login');
  } catch (error) {
    console.error(error);
    res.redirect('/register');
  }
});

app.get('/', function (req,res){
  res.header("Access-Control-Allow-Origin", "*");
  res.send('Hello World');
})

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/admin', checkAuthenticated, (req, res) => {  
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/rescuer', checkAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'rescuer.html'));
});



app.get('/announcements', checkAuthenticated, (req, res) => {
  sqlClient.query('SELECT count(*) as count FROM base', (err, results) => {
    if (err) return res.status(500).json({ error: 'Something went wrong' });
    return res.status(200).json({ announcements: results[0].count });
  });
});

app.get('/my-announcements', checkAuthenticated, (req, res) => {
  const { user: userID } = req.cookies;
  sqlClient.query('SELECT * FROM base WHERE responsible_rescuer_id = ?', [userID], (err, results) => {
    if (err) return res.status(500).json({ error: 'Something went wrong' });
    return res.status(200).json({ myTasks: results });
  });
});

app.get('/login.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.css'));
});

app.get('/javascript/:fileName', (req, res) => {
  res.sendFile(path.join(__dirname, 'javascript', req.params.fileName));
});

app.get('/images/:imageName', (req, res) => {
  res.sendFile(path.join(__dirname, 'images', req.params.imageName));
});

app.get('/bx/:bxFileName', (req, res) => {
  res.sendFile(path.join(__dirname, 'bx', req.params.bxFileName));
});

app.get('/:pageName.html', (req, res) => {
  res.sendFile(path.join(__dirname, `${req.params.pageName}.html`));
});

app.get('/:styleName.css', (req, res) => {
  res.sendFile(path.join(__dirname, `${req.params.styleName}.css`));
});

// Assuming you're using MySQL and sqlClient
app.get('/api/admin-profile', (req, res) => {
  const adminId = req.user.admin_id; // Or however you get the admin ID

  const sql = 'SELECT username_adm FROM admin WHERE admin_id = ?';
  sqlClient.query(sql, [adminId], (err, result) => {
    if (err) {
      return res.status(500).send('Error fetching admin data');
    }
    if (result.length > 0) {
      res.json({
        name: result[0].username_adm,
        info: 'Additional admin info here...', // Modify this to include more data as needed
      });
    } else {
      res.status(404).send('Admin not found');
    }
  });
});


/*----------------Sign in------------------*/

app.post('/signin', checkNotAuthenticated, async (req, res) => {
  try {
    const { username, password,rememberMe } = req.body;

    console.log('Received credentials:', { username, password });

    // Έλεγχος για admin
    sqlClient.query('SELECT * FROM admin WHERE username_adm = ?', [username], async (err, adminResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong!' });
      }

      // testing gia errors apo admin retrieval
       // Test: Log the query results to verify database connection and output
      console.log('Query Results:', adminResults);

      if (rememberMe) {
        const token = crypto.randomBytes(64).toString('hex');
        res.cookie('rememberMeToken', token, { maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 days
        // Store token in database or any secure storage
      } else {
        res.clearCookie('rememberMeToken');
      }

      if (adminResults.length > 0) {
        const admin = adminResults[0];
        console.log('Admin from DB:', admin);
        console.log('Admin hashed password from DB:', admin.password_adm);

        const isPasswordValid = await bcrypt.compare(password, admin.password_adm);
        console.log('Admin password comparison result:', isPasswordValid);

        if (!isPasswordValid) return res.status(401).json({ message: 'Incorrect password' });

        const options = {
          maxAge: 1000 * 60 * 15,
          httpOnly: true,
          secure: false,
        };
        res.cookie('user', admin.admin_id, options);
        return res.status(200).json({ message: 'Admin login successful', redirectUrl: '/admin.html' });
      }

      // Έλεγχος για rescuer
      sqlClient.query('SELECT * FROM rescuer WHERE username_res = ?', [username], async (err, rescuerResults) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Something went wrong!' });
        }

        if (rescuerResults.length > 0) {
          const rescuer = rescuerResults[0];
          console.log('Rescuer from DB:', rescuer);
          console.log('Rescuer hashed password from DB:', rescuer.password_res);

          const isPasswordValid = await bcrypt.compare(password, rescuer.password_res);
          console.log('Rescuer password comparison result:', isPasswordValid);

          if (!isPasswordValid) return res.status(401).json({ message: 'Incorrect password' });

          const options = {
            maxAge: 1000 * 60 * 15,
            httpOnly: true,
            secure: false,
          };
          res.cookie('user', rescuer.rescuer_id, options);
          return res.status(200).json({ message: 'Rescuer login successful', redirectUrl: '/rescuer.html' });
        }

        sqlClient.query('SELECT * FROM citizen WHERE username_citizen = ?', [username], async (err, citizenResults) => {
          if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ message: 'Something went wrong!' });
          }
    
          console.log('Database results:', citizenResults);
    
          if (citizenResults.length > 0) {
            const citizen = citizenResults[0];
            console.log('Citizen from DB:', citizen);
            console.log('Citizen hashed password from DB:', citizen.password_citizen);
    
            // Επαλήθευση του κωδικού πρόσβασης
            const isPasswordValid = await bcrypt.compare(password, citizen.password_citizen);
            console.log('Password comparison result:', isPasswordValid);
    
            if (!isPasswordValid) return res.status(401).json({ message: 'Incorrect password' });
    
            // Ρύθμιση των cookies και επιστροφή της επιτυχίας
            const options = {
              maxAge: 1000 * 60 * 15, // 15 λεπτά
              httpOnly: true,
              secure: false,
            };
            res.cookie('user', citizen.citizen_id, options);
            return res.status(200).json({ message: 'Citizen login successful', redirectUrl: '/citizen.html' });
          }

          return res.status(404).json({ message: 'User not found!' });
        });

      }); 

    }); 

  } catch (error) {
    console.error('Error during sign-in:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});


/*------------------Sign up-------------------*/

app.post('/signup', async (req, res) => {
  try {
    const { username, email, password, firstname, lastname, phoneNumber } = req.body;

    sqlClient.query('SELECT * FROM citizen WHERE username_citizen = ?', [username], async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong!' });
      }

      if (results.length > 0) return res.status(400).json({ message: 'User already exists!' });

      // Hash the password
      const hash = bcrypt.hashSync(password, 10);

      // Insert into citizen table
      sqlClient.query('INSERT INTO citizen (username_citizen, password_citizen, citizen_name, citizen_lname, ph_number, citizen_email) VALUES (?, ?, ?, ?, ?, ?)', [username, hash, firstname, lastname, phoneNumber, email], (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Something went wrong!' });
        }

        console.log({results});
        return res.status(200).json({ success: true, username }); 
      })         
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
});


app.get('/citizen/:username', checkAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'citizen.html'));
});

/*------------------- ADMIN --------------------*/
// Add a new item

app.post('/api/add_item', (req, res) => {
  const { category, name, description, quantity } = req.body;

  // get prod_category_id by category name 
  sqlClient.query('SELECT id FROM category WHERE name = ?', [category], (error, results) => {
    if (error) {
      console.error('Error fetching category ID:', error);
      return res.status(500).json({ message: 'Failed to fetch category ID' });
    }

    const categoryId = results[0].id;

    sqlClient.query('INSERT INTO products (prod_category_id, prod_item, prod_description, totalQuantity) VALUES (?, ?, ?, ?)', 
      [categoryId, name, description, quantity], (error) => {
        if (error) {
          console.error('Error adding item:', error);
          return res.status(500).json({ message: 'Failed to add item' });
        }
        res.status(200).json({ message: 'Item added successfully' });
      }
    );
  });
});


app.post('/categories', (req, res) => {
  const { name } = req.body;
  console.log('Received category:', name);
  sqlClient.query(
    'INSERT INTO category (name) VALUES (?)',
    [name],
    (error, results) => {
      if (error) {
        return res.status(500).json({ message: 'Failed to create category' });
      }
      res.status(201).json({ message: 'Category created successfully', categoryId: results.insertId });
    }
  );
});

app.post('/api/update_item_quantity', (req, res) => {
  console.log(`Received request to update item quantity: ${req.body}`);
  const { itemId, newQuantity } = req.body;
  if (!itemId || !newQuantity) {
    return res.status(400).json({ success: false, message: 'Missing required properties' });
  }
  sqlClient.query(
    'UPDATE products SET totalQuantity = ? WHERE prod_id = ?',
    [newQuantity, itemId],
    (error) => {
      if (error) {
        return res.status(500).json({ success: false, message: 'Failed to update quantity' });
      }
      // Fetch the updated category ID
      sqlClient.query(
        'SELECT prod_category_id FROM products WHERE prod_id = ?',
        [itemId],
        (error, results) => {
          if (error) {
            return res.status(500).json({ success: false, message: 'Failed to fetch category ID' });
          }
          const categoryId = results[0].prod_category_id;
          res.status(200).json({ success: true, message: 'Quantity updated successfully', categoryId: categoryId });
        }
      );
    }
  );
});

// Endpoint to upload JSON data and insert into MySQL
app.post('/api/upload-json', (req, res) => {
  const jsonData = req.body; // Expecting JSON data from AJAX POST request

  if (!Array.isArray(jsonData)) {
    return res.status(400).send('Invalid JSON format.');
  }

  // Prepare SQL statement
  const query = 'INSERT INTO products (prod_category_id, prod_item, prod_description, totalQuantity) VALUES ?';
  
  // Map the JSON data to match the table columns
  const values = jsonData.map(item => [
    item.prod_category_id,
    item.prod_item,
    item.prod_description,
    item.totalQuantity
  ]);

  // Execute SQL query
  sqlClient.query(query, [values], (err, result) => {
    if (err) {
      console.log('Error inserting data:', values);
      return res.status(500).send('Error inserting data.');
    }
    res.send('Data inserted successfully.');
  });
});

// RESCUER MAP NEW ------------------------------------------------------ //

app.post('/save-coordinates-citizen', (req, res) => {
  const { citizen_id, latitude, longitude } = req.body;

  if (!citizen_id || !latitude || !longitude) {
    return res.status(400).json({ message: 'Invalid input data' });
  }
  // Update the coordinates in the database
  sqlClient.query('UPDATE citizen_cords SET ctzen_lat  = ?, ctzen_lng  = ? WHERE ctzen_id  = ?', [latitude, longitude, citizen_id], (err, results) => {
      if (err) {
          console.error('Error updating coordinates in post:', err);
          return res.status(500).json({ message: 'Error updating coordinates in post' });
      }
      console.log('Coordinates updated successfully:', results);
      res.status(200).json({ message: 'Coordinates updated successfully!' });
  });
});


app.post('/save-coordinates-worker', (req, res) => {
  const { worker_id, latitude, longitude } = req.body;

  if (!worker_id || !latitude || !longitude) {
    return res.status(400).json({ message: 'Invalid input data' });
  }

  sqlClient.query('UPDATE worker_cords SET wrk_lat = ?, wrk_lng = ? WHERE wrk_id = ?', [latitude, longitude, worker_id], (err, results) => {
      if (err) {
          console.error('Error updating coordinates in post:', err);
          return res.status(500).json({ message: 'Error updating coordinates in post' });
      }
      console.log('Coordinates updated successfully:', results);
      res.status(200).json({ message: 'Coordinates updated successfully!' });
  });
});

app.post('/update-offer-accept',(req,res)=>{
  const {task_id,rescuer,rescuer_vehicle,date}=req.body;

  
  const query=`update offers set offer_vehicle_id=?,offer_status='Accepted',offer_date_withdraw=? where offer_task_id=?`;
  values=[rescuer_vehicle,date,task_id];
  
  sqlClient.query(query,values,(err,result)=>{
    if (err) {
      console.error('Error updating data:', err);
      res.status(500).send('Server error');
      return;
    }
    console.log('update successful:', result);
    res.status(200).json({ message: 'update successful:' });

  });
});

app.post('/update-request-accept',(req,res)=>{
  const {task_id,rescuer,rescuer_vehicle,date}=req.body;

  
  const query=`update requests set req_vehicle_id=?,req_status='Accepted',req_date_withdraw=? where req_task_id=?`;
  values=[rescuer_vehicle,date,task_id];
  
  sqlClient.query(query,values,(err,result)=>{
    if (err) {
      console.error('Error updating data:', err);
      res.status(500).send('Server error');
      return;
    }
    console.log('request update successful:', result);
    res.status(200).json({ message: 'request  update successful:' });

  });
});

app.post('/api/getMarkers', (req, res) => {
  const { requestStatus, offerStatus } = req.body; // Values passed from the client side

  const query = `
    SELECT 
      t.task_id, t.task_type, 
      r.req_status AS status, 
      r.req_item AS item, 
      r.req_quantity AS quantity, 
      r.req_vehicle_id AS vehicle_id,
      wrk.wrk_lat AS latitude, wrk.wrk_lng AS longitude 
    FROM tasks t
    LEFT JOIN requests r ON t.task_id = r.req_task_id
    LEFT JOIN worker_cords wrk ON r.req_vehicle_id = wrk.wrk_id
    WHERE t.task_type = 'request' AND r.req_status IN (?)
    UNION
    SELECT 
      t.task_id, t.task_type, 
      o.offer_status AS status, 
      o.offer_item AS item, 
      o.offer_quantity AS quantity, 
      o.offer_vehicle_id AS vehicle_id,
      wrk.wrk_lat AS latitude, wrk.wrk_lng AS longitude 
    FROM tasks t
    LEFT JOIN offers o ON t.task_id = o.offer_task_id
    LEFT JOIN worker_cords wrk ON o.offer_vehicle_id = wrk.wrk_id
    WHERE t.task_type = 'offer' AND o.offer_status IN (?)
  `;

  sqlClient.query(query, [requestStatus, offerStatus], (err, results) => {
    if (err) {
      console.error('Error fetching markers:', err);
      res.status(500).send('Error fetching markers');
    } else {
      res.json(results);
    }
  });
});

////////////////////////////////////////////////////////////////////////////////


app.post('/api/createAnnouncement', (req, res) => {
  const { category, item, newItem } = req.body; // Add newItem to the request

  // Check if new item needs to be added
  if (newItem) {
    // Insert the new item with quantity 0
    sqlClient.query('SELECT name FROM category WHERE id = ?', [category], (error, results) => {
      if (error || results.length === 0) {
        console.error('Error fetching category ID:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch category ID' });
      }
  
      const categoryId = results[0].id;
      console.log('Category ID:', category);

      sqlClient.query(
        'INSERT INTO products (prod_category_id, prod_item, prod_description, totalQuantity) VALUES (?, ?, ?, ?)', 
        [category, newItem, 'Requested product', 0], // Insert with quantity = 0
        (error, result) => {
          if (error) {
            console.error('Error adding new product:', error);
            return res.status(500).json({ success: false, message: 'Failed to add new product' });
          }

          const newProductId = result.insertId; // Get the ID of the newly inserted product

          // Now insert the announcement
          sqlClient.query(
            'INSERT INTO announcement (announcement_cat_id, announcement_prod_id) VALUES (?, ?)',
            [category, newProductId],
            (error, results) => {
              if (error) {
                console.error('Error inserting announcement:', error);
                return res.status(500).json({ success: false, message: 'Failed to create announcement' });
              }
              return res.status(200).json({ success: true, message: 'Announcement created successfully' });
            }
          );
        }
      );
    });
  } else if (item) {
    // Insert the announcement using the selected item
    sqlClient.query(
      'INSERT INTO announcement (announcement_cat_id, announcement_prod_id) VALUES (?, ?)', 
      [category, item],
      (error, results) => {
        if (error) {
          console.error('Error inserting announcement:', error);
          return res.status(500).json({ success: false, message: 'Failed to create announcement' });
        }
        return res.status(200).json({ success: true, message: 'Announcement created successfully' });
      }
    );
  } else {
    return res.status(400).json({ success: false, message: 'You must select an existing item or add a new one' });
  }
});



app.post('/api/updateBaseLocation', function (req, res) {
  const { base_lat, base_lng, base_username } = req.body;

  if (!base_lat || !base_lng || !base_username) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
  }

  sqlClient.query(
      'UPDATE base SET base_lat = ?, base_lng = ? WHERE base_username = ?',
      [base_lat, base_lng, base_username],
      function (err, result) {
          if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ success: false, message: 'Database error' });
          }
          res.json({ success: true, message: 'Base location updated' });
      }
  );
});



// Route to handle POST requests
app.post('/api/create_rescuer', (req, res) => {
  const { firstname, lastname, username, email, password } = req.body;

  if (!firstname || !lastname || !username || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Insert the worker first
  const insertWorkerQuery = 'INSERT INTO worker (wrk_name, wrk_lname, wrk_email) VALUES (?, ?, ?)';
  sqlClient.query(insertWorkerQuery, [firstname, lastname, email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error inserting worker' });
    }

    const workerId = results.insertId;
    const user_type = 'rescuer';

    // Now insert the rescuer with the worker's ID
    const insertRescuerQuery = 'INSERT INTO rescuer (rescuer_id, username_res, password_res) VALUES (?, ?, ?)';
    sqlClient.query(insertRescuerQuery, [workerId, username, password], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Database error inserting rescuer' });
      }

      res.status(201).json({ message: 'Rescuer created successfully' });
    });

    const insertUserQuery = 'INSERT INTO users (username, password, user_type, rescuer_id) VALUES (?, ?, ?, ?)';
    sqlClient.query(insertUserQuery,[username,password,user_type,workerId],(err,results)=>{
      if (err) {
        return res.status(500).json({ message: 'Database error inserting user' });
      }
    });
  });
});

// citizen

app.post("/active-offer", (req, res) => {
  const { item, quantity, date, citizen_id, prod_id } = req.body;


  const query1 = `INSERT INTO tasks VALUES(NULL, ?,"Offer",NULL)`;
  const values1 = [prod_id];

  sqlClient.query(query1, values1, (err, result) => {
    if (err) {
      console.error('Error inserting task:', err);
      return res.status(500).send('Server error');
    }

    const insertedTaskId = result.insertId;  // Get the inserted task ID
    console.log('Task added successfully:', result);


    const query2 = 'INSERT INTO offers VALUES(?,?,?,NULL,?,NULL,"In progress",?)';
    const values2 = [insertedTaskId, citizen_id, date, quantity, item];

    sqlClient.query(query2, values2, (err, result) => {
      if (err) {
        console.error('Error inserting offer:', err);
        return res.status(500).send('Server error');
      }

      console.log('Offer added successfully:', result);

      
     // res.status(200).json({ message: 'Offer added successfully!', offerId: result.insertId });
      return insertedTaskId; //epistrefei to noymero
    });
  });
});



app.post('/cancel-offer', (req, res) => {
  const {offer_id} = req.body;

  if (!offer_id) {
    return res.status(400).json({ message: 'Offer ID is required' });
  }

  const query = 'update offers set offer_status = "Cancelled" where offer_task_id = ?';

  sqlClient.query(query, [offer_id], (err, results) => {
    if (err) {
      console.error('Error updating offer:', err);
      res.status(500).send('Server error');
      return;
    }
    res.status(200).json({ message: 'Offer canceled successfully!' });
  });
});

app.post('/accept-offer', (req, res) => {
  const {offer_id} = req.body;

  if (!offer_id) {
    return res.status(400).json({ message: 'Offer ID is required' });
  }

  const query = 'update offers set offer_status = "Accepted" where offer_task_id = ?';

  sqlClient.query(query, [offer_id], (err, results) => {
    if (err) {
      console.error('Error updating offer:', err);
      res.status(500).send('Server error');
      return;
    }
    res.status(200).json({ message: 'Offer accepted by rescuer successfully!' });
  });
});

// GET NEW MAP ------------------------------------------------------- //

//select items from the announcement.
app.get('/get-shortage-items', async (req, res) => {
  const sqlQuery = `
  select  pr.prod_item,prod_category,ann.created_at from announcement ann
  inner join category cat on ann.announcement_cat_id=cat.id
  inner join products pr on ann.announcement_prod_id=pr.prod_id
  where ann.status='Posted';`
  
  sqlClient.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).json({ message: 'Error fetching data' });
    }
    res.json(results);
  });
});

//THELEI ALLAGH GIA NA VRISKEI TA PROIONTA
app.get('/citizen-categories', (req, res) => {
  sqlClient.query('SELECT DISTINCT prod_category FROM products', (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Database query failed' });
      return;
    }
    res.json(results.map(row => row.prod_category));  //turns it into an array
  });
});

//PREPEI NA TO VALW NA DEIXNEI MONO TA OFFERS GIA TO DIKO TOY ID ARGOTERA
app.get('/in-progress-offers', (req, res) => {
  var citizen_id=15; 
  const query = 'select offer_item,offer_quantity,offer_task_id from offers where offer_status = "In progress" or offer_status="Accepted" and offer_citizen_id=?';
  const values=[citizen_id];
  sqlClient.query(query,values, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Server error');
      return;
    }
    res.status(200).json(results);
  });
});

app.get('/get-products', (req, res) => {
  const category = req.query.category;
  const query = req.query.query;

  console.log('Request URL:', req.url);
  console.log('Received category:', category);
  console.log('Received query:', query);

  if (!category || !query) {
    return res.status(400).json({ error: 'Category and query are required' });
  }

  const sql = "SELECT prod_item FROM products WHERE prod_category = ? AND prod_item LIKE ? LIMIT 10";
  const values = [category, `%${query}%`];

  sqlClient.query(sql, values, (err, results) => {
    if (err) {
      console.error('Database query failed:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }

    console.log('Query Results:', results);
    res.json(results.map(row => row.prod_item));
    console.log("res json "+res);
  });
});

//psaxnei gia to product id afoy epilexthei
app.get('/get-product-id', (req, res) => {
  const prodItem = req.query.prod_item;

  if (!prodItem) {
    return res.status(400).json({ error: 'Missing prod_item in query params' });
  }

  sqlClient.query('SELECT prod_id FROM products WHERE prod_item = ?', [prodItem], (err, results) => {
    if (err) {
      console.error('Error fetching product:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ prod_id: results[0].prod_id });
  });
});



app.get('/get-citizen-offers', (req, res) => {
  const query = `
   SELECT 
    off.offer_task_id,
    off.offer_date_record,
    off.offer_date_withdraw,
    off.offer_quantity,
    off.offer_vehicle_id,
    off.offer_item,
    off.offer_status,
    cit.citizen_name,
    cit.citizen_lname,
    cit.ph_number,
    cc.ctzen_lat,
    cc.ctzen_lng,
    cc.ctzen_id
  FROM 
    offers AS off
  INNER JOIN 
    citizen AS cit 
    ON cit.citizen_id = off.offer_citizen_id
  INNER JOIN 
    citizen_cords AS cc  
    ON cc.ctzen_id = cit.citizen_id
  WHERE 
    off.offer_status = 'In progress' or off.offer_status = 'Accepted';
`;
 

  sqlClient.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Server error');
      return;
    }
    res.status(200).json(results);
  });
});


//fetches all the offers with Requests
app.get('/get-citizen-requests', (req, res) => {
  const query = `
  SELECT 
    req.req_task_id,
    req.req_date_record,
    req.req_date_withdraw,
    req.req_quantity,
    req.req_vehicle_id,
    req.req_item,
    req.req_status,
    cit.citizen_name,
    cit.citizen_lname,
    cit.ph_number,
    cc.ctzen_lat,
    cc.ctzen_lng
  FROM 
    requests AS req
  INNER JOIN 
    citizen AS cit 
    ON cit.citizen_id = req.req_citizen_id
  INNER JOIN 
    citizen_cords AS cc  
    ON cc.ctzen_id = cit.citizen_id
  WHERE 
    req.req_status = 'In progress' or req.req_status = 'Accepted' ;
`;

 
  sqlClient.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Server error');
      return;
    }
    res.status(200).json(results);
  });
});

app.get('/get-rescuer-info', (req, res) => {
  const rescuer_id = req.query.rescuer_id;

  if (!rescuer_id) {
    res.status(400).send('rescuer_id is required');
    return;
  }

  const query = `
    SELECT 
      *
    FROM 
      rescuer
    WHERE 
      rescuer_id = ?;
  `;

  sqlClient.query(query, [rescuer_id], (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Server error');
      return;
    }
    res.status(200).json(results);
  });
});

/////////////////////////////////////////////////////////////////////////////////////

//THELEI ALLAGH GIA NA VRISKEI TA PROIONTA
app.get('/citizen-categories', (req, res) => {
  sqlClient.query('SELECT DISTINCT prod_category FROM products', (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Database query failed' });
      return;
    }
    res.json(results.map(row => row.prod_category));  //turns it into an array
  });
});

// Route to handle GET requests
app.get('/api/get_rescuers', (req, res) => {                           // gia show rescuers
  const query = 'SELECT * FROM rescuer';
  sqlClient.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error fetching rescuers' });
    }

    res.status(200).json(results);
  });
});

// to see all rescuers on admin map
app.get('/api/getRescuerLocations', (req, res) => {
  const query = `
      SELECT worker_cords.wrk_lat, worker_cords.wrk_lng
      FROM rescuer
      JOIN worker_cords ON rescuer.rescuer_id = worker_cords.wrk_id
  `;
  sqlClient.query(query, (err, results) => {
      if (err) {
          console.error('Error fetching rescuer locations:', err);
          return res.status(500).json({ success: false, message: 'Error fetching rescuer locations' });
      }
      res.json({ success: true, locations: results });
  });
});

//see rescuer info

app.get('/api/getRescuerDetails', (req, res) => {
  const query = `
    SELECT 
      rescuer.username_res,
      rescuer.vehicle_id,
      rescuer_tasks.task_id,
      tasks.task_type, 
      worker_cords.wrk_lat,
      worker_cords.wrk_lng
    FROM rescuer
    LEFT JOIN worker_cords ON rescuer.rescuer_id = worker_cords.wrk_id
    LEFT JOIN rescuer_tasks ON rescuer.rescuer_id = rescuer_tasks.rescuer_id
    LEFT JOIN tasks ON rescuer_tasks.task_id = tasks.task_id
    LEFT JOIN vehicles ON rescuer.vehicle_id = vehicles.vehicle_id;
  `;

  sqlClient.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching rescuer details:', err);
      return res.status(500).json({ success: false, message: 'Error fetching rescuer details' });
    }

    // Transform results to include additional details
    const transformedResults = results.map(row => ({
      username: row.username_res,
      vehicle_id: row.vehicle_id,
      task_id: row.task_id,
      task_description: row.task_type,
      lat: row.wrk_lat,
      lng: row.wrk_lng,
    }));

    res.json({ success: true, details: transformedResults });
  });
});



app.get('/api/getAdminAnnouncements', (req, res) => {
  try {
    // Debugging
    console.log('Fetching admin announcements...');

    // Query to get the announcements with the related product and category info
    const query = `
      SELECT 
        a.announcement_id, 
        p.prod_item AS product_needed, 
        c.name AS product_category, 
        a.created_at, 
        a.status
      FROM 
        announcement a
      JOIN 
        products p ON a.announcement_prod_id = p.prod_id
      JOIN 
        category c ON a.announcement_cat_id = c.id
      ORDER BY 
        a.created_at DESC
    `;

    // Execute the query
    sqlClient.query(query, (error, results) => {
      if (error) {
        // Log the error for debugging
        console.error('Error executing query:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch announcements' });
      }

      // Debugging: Log the fetched results
      console.log('Fetched announcements:', results);

      // Send the retrieved announcements as JSON response
      res.status(200).json(results);
    });
  } catch (err) {
    // Log the error if something went wrong outside the query
    console.error('Error in /api/getAdminAnnouncements route:', err);
    res.status(500).json({ success: false, message: 'An unexpected error occurred' });
  }
});


// Fetch items
app.get('/api/get_items', (req, res) => {
  sqlClient.query('SELECT prod_id, prod_category, prod_item FROM products', (error, results) => {
    if (error) {
      console.error('Error fetching items:', error);
      return res.status(500).json({ message: 'Failed to fetch items' });
    }
    res.status(200).json(results.rows);
  });
});

app.get('/api/get_items_by_category/:categoryId', (req, res) => {
  const categoryId = req.params.categoryId;

  // Fetch items from the database where the categoryId matches
  sqlClient.query(
    'SELECT prod_id, prod_item, prod_description, totalQuantity FROM products WHERE prod_category_id = ?',
    [categoryId],
    (error, items) => {
      if (error) {
        console.error('Error fetching items by category:', error);
        return res.status(500).json({ message: 'An error occurred while fetching items.' });
      }

      // Check if any items were found
      if (items.length === 0) {
        return res.status(404).json({ message: 'No items found for this category.' });
      }

      // Send the items as a response
      res.json(items);
    }
  );
});

// Fetch categories
app.get('/api/get_categories', (req, res) => {       // i get a 404 
  //console.log('Fetching categories...');
  sqlClient.query(
    'SELECT id, name FROM category',
    (error, results) => {
      if (error) {
        // If there's a database error, send a 500 response
        //console.error('Error fetching categories:', err);
        return res.status(500).json({ message: 'Failed to fetch categories' });
      }
      // If successful, send back the results
      res.status(200).json(results);
    }
  );
});

app.get('/api/filter_products', (req, res) => {
  try {
    // Parse the categories from the query string
    const selectedCategoryIds = req.query.categories ? req.query.categories.split(',') : null;

    if (!selectedCategoryIds || selectedCategoryIds.length === 0) {
      console.log('No categories selected');
      return res.status(400).json({ message: 'No categories selected' });
    }

    console.log('Received categories:', req.query.categories);
    console.log('Parsed selectedCategoryIds:', selectedCategoryIds);

    // Create placeholders for the IN clause
    const placeholders = selectedCategoryIds.map(() => '?').join(', ');

    // SQL query with placeholders  // added prod_id just to check
    const sqlQuery = `   
      SELECT p.prod_id,p.prod_item, p.prod_category_id, p.prod_description, 
             p.totalQuantity 
      FROM products p
      JOIN category c ON p.prod_category_id = c.id
      WHERE p.prod_category_id IN (${placeholders})
    `;

    // Debug the SQL query and the parameters
    console.log('SQL Query:', sqlQuery);
    console.log('Category IDs:', selectedCategoryIds);

    // Execute the query
    sqlClient.query(sqlQuery, selectedCategoryIds, (error, results) => {
      if (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({ error: 'Error fetching products' });
      }

      res.json(results);
      console.log('Query Results:', results);
    });
  } catch (err) {
    // Catch any unexpected errors and log them
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

app.get('/get-numtask-rescuer', (req, res) => {
  const rescuer_id = req.query.rescuer_id;

  if (!rescuer_id) {
    res.status(400).send('rescuer_id is required');
    return;
  }

  const query = `
    select COUNT(*) as numtasks
    FROM 
      rescuer_tasks
    WHERE 
      rescuer_id = ?;
  `;

  sqlClient.query(query, [rescuer_id], (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Server error');
      return;
    }
    res.status(200).json(results[0]);
  });
});

//pairnei ta task poy exdei na kanei o rescuer gia na ta valei sto polyline.
app.get('/get-rescuer-tasks-cords', (req, res) => {
  const rescuer_id = req.query.rescuer_id;

  if (!rescuer_id) {
    res.status(400).send('rescuer_id is required');
    return;
  }

  const query = `
    SELECT task_lat, task_lng
    FROM rescuer_tasks
    WHERE rescuer_id = ?;
  `;

  sqlClient.query(query, [rescuer_id], (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Server error');
      return;
    }


    const latLngs = results.map(row => [row.task_lat, row.task_lng]);
    res.status(200).json(latLngs);  // epistrefei array of [lat, lng] points
  });
});



// ------------- ADMIN STATS ---------------------------------------------------- //

app.get('/api/getStats', (req, res) => {
  console.log('Received request to /api/getStats');

  // Retrieve the time period from the query parameters
  const timePeriod = req.query.timePeriod;
  const now = new Date();
  let startDate;

  // Calculate the start date based on the selected time period
  switch (timePeriod) {
      case '0': // Today
          startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString().slice(0, 19).replace('T', ' ');
          break;
      case '3': // Last 3 days
          startDate = new Date(now.setDate(now.getDate() - 3)).toISOString().slice(0, 19).replace('T', ' ');
          break;
      case '7': // Last 7 days
          startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().slice(0, 19).replace('T', ' ');
          break;
      case '30': // Last 30 days
          startDate = new Date(now.setDate(now.getDate() - 30)).toISOString().slice(0, 19).replace('T', ' ');
          break;
      case 'all': // All Time
          startDate = '1970-01-01 00:00:00'; // Default to very early date
          break;
      default:
          return res.status(400).send('Invalid time period');
  }

  const stats = {
      newRequests: 0,
      newOffers: 0,
      processedRequests: 0,
      processedOffers: 0
  };

  // Queries to get statistics filtered by the time period
  const requestsQuery = `
      SELECT 
          SUM(CASE WHEN req_status = 'In progress' THEN 1 ELSE 0 END) AS newRequests,
          SUM(CASE WHEN req_status = 'Accepted' THEN 1 ELSE 0 END) AS processedRequests
      FROM requests
      WHERE req_date_record >= ?;
  `;

  const offersQuery = `
      SELECT 
          SUM(CASE WHEN offer_status = 'In progress' THEN 1 ELSE 0 END) AS newOffers,
          SUM(CASE WHEN offer_status = 'Accepted' THEN 1 ELSE 0 END) AS processedOffers
      FROM offers
      WHERE offer_date_record >= ?;
  `;

  sqlClient.query(requestsQuery, [startDate], (err, requestResults) => {
      if (err) {
          console.error('Error fetching request stats:', err.message);
          return res.status(500).send('Error fetching request stats');
      }

      sqlClient.query(offersQuery, [startDate], (err, offerResults) => {
          if (err) {
              console.error('Error fetching offer stats:', err.message);
              return res.status(500).send('Error fetching offer stats');
          }

          // Prepare the stats object based on actual data
          stats.newRequests = requestResults[0].newRequests || 0;
          stats.processedRequests = requestResults[0].processedRequests || 0;
          stats.newOffers = offerResults[0].newOffers || 0;
          stats.processedOffers = offerResults[0].processedOffers || 0;

          // Log the stats object before sending
          console.log('Sending stats:', stats);

          res.json(stats);
      });
  });
});

// app.get('/api/getStats', (req, res) => {
//   console.log('Received request to /api/getStats');

//   const stats = {
//       newRequests: 0,
//       newOffers: 0,
//       processedRequests: 0,
//       processedOffers: 0
//   };

//   const requestsQuery = `
//       SELECT 
//           SUM(CASE WHEN req_status = 'In progress' THEN 1 ELSE 0 END) AS newRequests,
//           SUM(CASE WHEN req_status = 'Accepted' THEN 1 ELSE 0 END) AS processedRequests
//       FROM requests;
//   `;

//   const offersQuery = `
//       SELECT 
//           SUM(CASE WHEN offer_status = 'In progress' THEN 1 ELSE 0 END) AS newOffers,
//           SUM(CASE WHEN offer_status = 'Accepted' THEN 1 ELSE 0 END) AS processedOffers
//       FROM offers;
//   `;

//   sqlClient.query(requestsQuery, (err, requestResults) => {
//       if (err) {
//           console.error('Error fetching request stats:', err.message);
//           return res.status(500).send('Error fetching request stats');
//       }

//       sqlClient.query(offersQuery, (err, offerResults) => {
//           if (err) {
//               console.error('Error fetching offer stats:', err.message);
//               return res.status(500).send('Error fetching offer stats');
//           }

//           // Log the results to inspect the format
//           console.log('Request results:', requestResults);
//           console.log('Offer results:', offerResults);

//           if (requestResults.length === 0 || offerResults.length === 0) {
//               return res.status(500).send('No data returned from queries');
//           }

//           // Prepare the stats object based on actual data
//           stats.newRequests = requestResults[0].newRequests || 0;
//           stats.processedRequests = requestResults[0].processedRequests || 0;
//           stats.newOffers = offerResults[0].newOffers || 0;
//           stats.processedOffers = offerResults[0].processedOffers || 0;

//           // Log the stats object before sending
//           console.log('Sending stats:', stats);

//           res.json(stats);
//       });
//   });
// });

app.get('/api/getBaseLocation', function (req, res) {
  const base_username = 'Base A'; // Use your base's identifier

  sqlClient.query(
      'SELECT base_lat, base_lng FROM base WHERE base_username = ?',
      [base_username],
      function (err, results) {
          if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ success: false, message: 'Database error' });
          }
          if (results.length > 0) {
              res.json({ success: true, location: results[0] });
          } else {
              res.status(404).json({ success: false, message: 'Base not found' });
          }
      }
  );
});


/*-------------------FUNCTIONS--------------------*/

app.delete('/logout', (req, res) => {
  res.clearCookie('user'); // Clear the cookie
  req.session.destroy((err) => { // Destroy the session
    if (err) {
      return res.status(500).json({ message: 'Failed to log out' });
    }
    return res.status(200).json({ message: 'Successful logout' });
  });
});

app.delete('/api/delete_item/:itemId', (req, res) => {
  const itemId = req.params.itemId;
  sqlClient.query(
    'DELETE FROM products WHERE prod_id = ?',
    [itemId],
    (error) => {
      if (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete item' });
      }
      // Fetch the updated category ID
      sqlClient.query(
        'SELECT category_id FROM products WHERE prod_id = ?',
        [itemId],
        (error, results) => {
          if (error) {
            return res.status(500).json({ success: false, message: 'Failed to fetch category ID' });
          }
          res.status(200).json({ success: true, message: 'Item deleted successfully', categoryId: results[0].category_id });
        }
      );
    }
  );
});


app.get('/check-auth', (req, res) => {
  if (req.cookies.user) {
    res.status(200).json({ message: 'Authenticated' });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});


function checkAuthenticated(req, res, next) {
  if (req.cookies.user) {
    return next();
  }
  res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
  if (req.cookies.user) {
    return res.redirect('/');
  }
  next();
}

/*-------------------ERROR PAGE--------------------*/
app.get('*', (req, res) => {
  res.status(404).send('Sorry, requested page not found.');
});



app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
