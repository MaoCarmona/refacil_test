import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('API E2E', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    const config = new DocumentBuilder()
      .setTitle('Transaction Service API')
      .setDescription('API para gestión de transacciones, usuarios y fraude')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / debe responder 200', async () => {
    await request(app.getHttpServer()).get('/').expect(200);
  });

  it('Swagger UI disponible en /docs', async () => {
    const res = await request(app.getHttpServer()).get('/docs');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Swagger UI');
  });

  it('POST /transactions crea un depósito válido', async () => {
    const payload = {
      user_id: 'e2e_user_1',
      amount: 100,
      type: 'deposit',
    };
    const res = await request(app.getHttpServer())
      .post('/transactions')
      .send(payload)
      .expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transaction_id).toBeDefined();
  });

  it('POST /transactions rechaza retiro con fondos insuficientes', async () => {
    const deposit = {
      user_id: 'e2e_user_2',
      amount: 50,
      type: 'deposit',
    };
    await request(app.getHttpServer()).post('/transactions').send(deposit).expect(201);

    const withdraw = {
      user_id: 'e2e_user_2',
      amount: 100,
      type: 'withdraw',
    };
    await request(app.getHttpServer()).post('/transactions').send(withdraw).expect(400);
  });

  it('GET /transactions/history retorna historial paginado', async () => {
    const res = await request(app.getHttpServer())
      .get('/transactions/history')
      .query({ user_id: 'e2e_user_1', page: 1, limit: 10 })
      .expect(200);
    expect(res.body).toHaveProperty('transactions');
    expect(res.body).toHaveProperty('total');
  });

  it('GET /users/:userId/balance retorna balance', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/e2e_user_1/balance')
      .expect(200);
    expect(res.body).toHaveProperty('balance');
  });

  it('GET /transactions/:id retorna la transacción por ID', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/transactions')
      .send({
        user_id: 'e2e_user_3',
        amount: 10,
        type: 'deposit',
      })
      .expect(201);
    const txnId = createRes.body.data.transaction_id;

    const res = await request(app.getHttpServer())
      .get(`/transactions/${txnId}`)
      .expect(200);
    expect(res.body.data.transaction_id).toBe(txnId);
  });

  it('GET /fraud-detection/alerts responde 200', async () => {
    await request(app.getHttpServer())
      .get('/fraud-detection/alerts')
      .expect(200);
  });
});
