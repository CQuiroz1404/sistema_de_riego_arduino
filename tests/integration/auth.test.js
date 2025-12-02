const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');
const request = require('supertest');
const app = require('../../server');

describe('Authentication API', () => {
    let authToken;
    let testUser = {
        nombre: 'Test User',
        email: `test${Date.now()}@test.com`,
        password: 'Test123!@#',
        rol: 'usuario'
    };

    afterAll(async () => {
        // Cleanup
        const { closePool, closeSequelize } = require('../../src/config/baseDatos');
        await closePool();
        await closeSequelize();
    });

    describe('POST /auth/register', () => {
        test('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send(testUser)
                .expect('Content-Type', /html/);

            expect(response.status).toBe(302); // Redirect after success
        });

        test('should fail with duplicate email', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send(testUser)
                .expect('Content-Type', /html/);

            expect(response.status).toBe(400);
        });

        test('should fail with invalid email format', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({
                    ...testUser,
                    email: 'invalid-email'
                });

            expect(response.status).toBe(400);
        });

        test('should fail with short password', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({
                    ...testUser,
                    email: 'another@test.com',
                    password: '123'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /auth/login', () => {
        test('should login successfully with valid credentials', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(response.status).toBe(302); // Redirect to dashboard
            expect(response.headers['set-cookie']).toBeDefined();
            
            // Extract token from cookies
            const cookies = response.headers['set-cookie'];
            authToken = cookies.find(cookie => cookie.startsWith('token='));
        });

        test('should fail with invalid credentials', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
        });

        test('should fail with non-existent email', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'password123'
                });

            expect(response.status).toBe(401);
        });

        test('should fail with missing fields', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email
                    // Missing password
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /auth/logout', () => {
        test('should logout successfully', async () => {
            const response = await request(app)
                .get('/auth/logout')
                .set('Cookie', authToken);

            expect(response.status).toBe(302); // Redirect to login
        });
    });
});
