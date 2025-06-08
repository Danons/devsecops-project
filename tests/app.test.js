const request = require('supertest');
const { app, server } = require('../index'); // Sesuaikan path

afterAll((done) => {
    server.close(done); // Tutup server setelah semua tes selesai
});

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