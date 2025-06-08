// Import dependencies
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config(); // Untuk memuat environment variables

const app = express();
const port = 3000;

// In-memory "database" untuk kesederhanaan
let tasks = [
    { id: 1, title: 'Setup project', completed: true },
    { id: 2, title: 'Write code', completed: false }
];
let nextTaskId = 3;

// Middleware Setup
app.use(helmet()); // Keamanan dasar: set HTTP headers
app.use(morgan('combined')); // Logging
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Melayani file statis (CSS, JS)
app.set('view engine', 'ejs'); // Set view engine

// Konfigurasi Session
// SECURITY: Gunakan secret yang kuat dan simpan di environment variable
app.use(session({
    secret: process.env.SESSION_SECRET || 'a-very-weak-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set 'true' jika menggunakan HTTPS
}));

// Middleware untuk memeriksa autentikasi
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// Routes
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    // SECURITY: Validasi input sederhana. Di aplikasi nyata, gunakan library seperti express-validator.
    const { username, password } = req.body;
    // Autentikasi dummy
    if (username === 'admin' && password === 'password') {
        req.session.user = { username: 'admin' };
        res.redirect('/');
    } else {
        res.send('Invalid credentials');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Halaman utama (dilindungi autentikasi)
app.get('/', isAuthenticated, (req, res) => {
    res.render('index', { tasks: tasks });
});

// API Endpoints untuk CRUD
// Create
app.post('/tasks', isAuthenticated, (req, res) => {
    const { title } = req.body;
    if (title) { // SECURITY: Validasi input dasar
        const newTask = { id: nextTaskId++, title, completed: false };
        tasks.push(newTask);
    }
    res.redirect('/');
});

// Update
app.post('/tasks/:id/toggle', isAuthenticated, (req, res) => {
    const task = tasks.find(t => t.id === parseInt(req.params.id));
    if (task) {
        task.completed = !task.completed;
    }
    res.redirect('/');
});

// Delete
app.post('/tasks/:id/delete', isAuthenticated, (req, res) => {
    tasks = tasks.filter(t => t.id !== parseInt(req.params.id));
    res.redirect('/');
});

// Jalankan server
const server = app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});

module.exports = { app, server }; // Ekspor untuk testing