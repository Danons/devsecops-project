const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const { Pool } = require('pg'); // Import library pg

// --- Konfigurasi Koneksi Database ---
// Menggunakan variabel lingkungan untuk koneksi
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// --- Fungsi untuk Inisialisasi Database ---
// Membuat tabel jika belum ada saat aplikasi pertama kali berjalan
async function initializeDatabase() {
    const client = await pool.connect();
    try {
        // Membuat tabel users (jika belum ada)
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(50) NOT NULL 
            );
        `);
        // Membuat tabel tasks (jika belum ada)
        await client.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                completed BOOLEAN DEFAULT false
            );
        `);
        
        // Menambahkan user 'admin' jika belum ada
        const res = await client.query("SELECT * FROM users WHERE username = 'admin'");
        if (res.rowCount === 0) {
            // Di aplikasi nyata, password HARUS di-hash menggunakan bcrypt
            await client.query("INSERT INTO users (username, password) VALUES ('admin', 'password')");
            console.log("Default user 'admin' created.");
        }
        console.log("Database initialized successfully.");
    } finally {
        client.release();
    }
}


const app = express();
const port = 3000;

// --- Middleware Setup ---
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

// --- Middleware Autentikasi ---
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// --- Rute Autentikasi ---
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
        if (result.rowCount > 0) {
            req.session.user = result.rows[0];
            res.redirect('/');
        } else {
            res.send('Invalid credentials');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// --- Rute Aplikasi Utama ---
app.get('/', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
        res.render('index', { tasks: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// --- Rute CRUD (menggunakan SQL) ---
app.post('/tasks', isAuthenticated, async (req, res) => {
    const { title } = req.body;
    if (title) {
        try {
            await pool.query('INSERT INTO tasks (title) VALUES ($1)', [title]);
        } catch (err) {
            console.error(err);
        }
    }
    res.redirect('/');
});

app.post('/tasks/:id/toggle', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('UPDATE tasks SET completed = NOT completed WHERE id = $1', [id]);
    } catch (err) {
        console.error(err);
    }
    res.redirect('/');
});

app.post('/tasks/:id/delete', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    } catch (err) {
        console.error(err);
    }
    res.redirect('/');
});

// --- Menjalankan Server ---
app.listen(port, async () => {
    try {
        await initializeDatabase(); // Panggil inisialisasi database sebelum server siap
        console.log(`App listening at http://localhost:${port}`);
    } catch (err) {
        console.error("Failed to initialize database:", err);
        process.exit(1); // Keluar jika database gagal diinisialisasi
    }
});