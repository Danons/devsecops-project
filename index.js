const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const { Pool } = require('pg');

// Konfigurasi Koneksi Database
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Fungsi untuk Inisialisasi Database
async function initializeDatabase() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(50) NOT NULL
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                completed BOOLEAN DEFAULT false
            );
        `);
        const res = await client.query("SELECT * FROM users WHERE username = 'admin'");
        if (res.rowCount === 0) {
            await client.query("INSERT INTO users (username, password) VALUES ('admin', 'password')");
            console.log("Default user 'admin' created.");
        }
        console.log("Database initialized successfully.");
    } finally {
        client.release();
    }
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware Setup
app.use(helmet());
app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(session({
    secret: process.env.SESSION_SECRET || 'a-very-weak-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// --- Rute-rute aplikasi (tidak ada perubahan di sini) ---
function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.redirect('/login');
}
app.get('/login', (req, res) => res.render('login'));
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
    if (result.rowCount > 0) {
        req.session.user = result.rows[0];
        res.redirect('/');
    } else {
        res.send('Invalid credentials');
    }
});
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});
app.get('/', isAuthenticated, async (req, res) => {
    const result = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
    res.render('index', { tasks: result.rows });
});
app.post('/tasks', isAuthenticated, async (req, res) => {
    const { title } = req.body;
    if (title) await pool.query('INSERT INTO tasks (title) VALUES ($1)', [title]);
    res.redirect('/');
});
app.post('/tasks/:id/toggle', isAuthenticated, async (req, res) => {
    await pool.query('UPDATE tasks SET completed = NOT completed WHERE id = $1', [req.params.id]);
    res.redirect('/');
});
app.post('/tasks/:id/delete', isAuthenticated, async (req, res) => {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.redirect('/');
});

// --- Menjalankan Server ---
// Kita akan membuat variabel server di scope yang lebih luas
let server;

// Fungsi untuk memulai server
async function startServer() {
    await initializeDatabase();
    server = app.listen(port, () => {
        console.log(`App listening at http://localhost:${port}`);
    });
    return server;
}

// Kondisi ini akan menjalankan server hanya jika file dieksekusi langsung (node index.js)
// dan tidak akan berjalan saat di-import oleh file tes
if (require.main === module) {
    startServer().catch(err => {
        console.error("Failed to start server:", err);
        process.exit(1);
    });
}

// Ekspor app dan pool untuk testing. Server akan dikelola oleh file tes.
module.exports = { app, pool };