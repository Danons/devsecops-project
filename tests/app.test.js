const request = require('supertest');
// Impor 'pool' untuk bisa menutup koneksi database
const { app, server, pool } = require('../index');

// Gunakan afterAll untuk memastikan server dan koneksi database ditutup setelah semua tes selesai
afterAll(async () => {
    // Menunggu server aplikasi benar-benar tertutup
    if (server) {
        await new Promise(resolve => server.close(resolve));
    }
    // Menutup semua koneksi di pool database
    await pool.end();
});

// Blok describe untuk tes Anda tetap sama
describe('GET /', () => {
    it('should redirect to /login if not authenticated', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(302);
        expect(res.headers.location).toBe('/login');
    });
});

describe('GET /login', () => {
    it('should return login page', async () => {
        const res = await request(app).get('/login');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('<h1>Login</h1>');
    });
});