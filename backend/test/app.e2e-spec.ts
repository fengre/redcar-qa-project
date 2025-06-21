import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body.status).toBe('ok');
          expect(typeof res.body.timestamp).toBe('string');
          expect(new Date(res.body.timestamp).getTime()).not.toBeNaN();
        });
    });

    it('/ (GET)', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Company Question Analyzer API is running!');
    });
  });

  describe('Questions API', () => {
    it('/questions/analyze (POST) - should analyze question with valid domain', () => {
      const questionData = {
        question: 'What does example.com do?',
      };

      return request(app.getHttpServer())
        .post('/questions/analyze')
        .send(questionData)
        .expect(200)
        .expect('Content-Type', /text\/plain/);
    });

    it('/questions/analyze (POST) - should reject question without domain', () => {
      const questionData = {
        question: 'What is the weather like?',
      };

      return request(app.getHttpServer())
        .post('/questions/analyze')
        .send(questionData)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Please include a company domain in your question');
        });
    });

    it('/questions/analyze (POST) - should reject question with invalid domain format', () => {
      const questionData = {
        question: 'What does invalid-domain do?',
      };

      return request(app.getHttpServer())
        .post('/questions/analyze')
        .send(questionData)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid domain format');
        });
    });

    it('/questions/analyze (POST) - should handle empty question', () => {
      const questionData = {
        question: '',
      };

      return request(app.getHttpServer())
        .post('/questions/analyze')
        .send(questionData)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Please include a company domain in your question');
        });
    });

    it('/questions/analyze (POST) - should handle various domain formats', () => {
      const testCases = [
        { question: 'What does https://example.com do?', expectedStatus: 200 },
        { question: 'Tell me about www.google.com', expectedStatus: 200 },
        { question: 'Analyze sub.example.com', expectedStatus: 200 },
        { question: 'What about EXAMPLE.COM?', expectedStatus: 200 },
      ];

      const promises = testCases.map((testCase) =>
        request(app.getHttpServer())
          .post('/questions/analyze')
          .send({ question: testCase.question })
          .expect(testCase.expectedStatus)
      );

      return Promise.all(promises);
    });

    it('/questions/analyze (POST) - should handle special characters', () => {
      const questionData = {
        question: 'What does example.com do? 🚀',
      };

      return request(app.getHttpServer())
        .post('/questions/analyze')
        .send(questionData)
        .expect(200)
        .expect('Content-Type', /text\/plain/);
    });

    it('/questions/analyze (POST) - should handle long questions', () => {
      const longQuestion = 'A'.repeat(1000);
      const questionData = {
        question: longQuestion,
      };

      return request(app.getHttpServer())
        .post('/questions/analyze')
        .send(questionData)
        .expect(400); // Should fail because no domain in long string
    });

    it('/questions/analyze (POST) - should handle malformed JSON', () => {
      return request(app.getHttpServer())
        .post('/questions/analyze')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('/questions/analyze (POST) - should handle missing question field', () => {
      const questionData = {};

      return request(app.getHttpServer())
        .post('/questions/analyze')
        .send(questionData)
        .expect(400);
    });
  });

  describe('History API', () => {
    it('/history (GET) - should return history items', () => {
      return request(app.getHttpServer())
        .get('/history')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('/history (POST) - should save history item', () => {
      const historyData = {
        question: 'What does example.com do?',
        domain: 'example.com',
        answer: 'Example.com is a technology company.',
      };

      return request(app.getHttpServer())
        .post('/history')
        .send(historyData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('question');
          expect(res.body).toHaveProperty('domain');
          expect(res.body).toHaveProperty('answer');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body.question).toBe(historyData.question);
          expect(res.body.domain).toBe(historyData.domain);
          expect(res.body.answer).toBe(historyData.answer);
        });
    });

    it('/history (POST) - should handle empty strings', () => {
      const historyData = {
        question: '',
        domain: '',
        answer: '',
      };

      return request(app.getHttpServer())
        .post('/history')
        .send(historyData)
        .expect(201)
        .expect((res) => {
          expect(res.body.question).toBe('');
          expect(res.body.domain).toBe('');
          expect(res.body.answer).toBe('');
        });
    });

    it('/history (POST) - should handle long strings', () => {
      const longQuestion = 'A'.repeat(1000);
      const longAnswer = 'B'.repeat(2000);
      const historyData = {
        question: longQuestion,
        domain: 'example.com',
        answer: longAnswer,
      };

      return request(app.getHttpServer())
        .post('/history')
        .send(historyData)
        .expect(201)
        .expect((res) => {
          expect(res.body.question).toBe(longQuestion);
          expect(res.body.answer).toBe(longAnswer);
        });
    });

    it('/history (POST) - should handle special characters', () => {
      const historyData = {
        question: 'What does example.com do? 🚀',
        domain: 'example.com',
        answer: 'Example.com is a technology company! 💻',
      };

      return request(app.getHttpServer())
        .post('/history')
        .send(historyData)
        .expect(201)
        .expect((res) => {
          expect(res.body.question).toBe(historyData.question);
          expect(res.body.answer).toBe(historyData.answer);
        });
    });

    it('/history (POST) - should handle malformed JSON', () => {
      return request(app.getHttpServer())
        .post('/history')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('/history (POST) - should handle missing required fields', () => {
      const historyData = {
        question: 'What does example.com do?',
        // Missing domain and answer
      };

      return request(app.getHttpServer())
        .post('/history')
        .send(historyData)
        .expect(400);
    });

    it('/history (GET) - should return history after saving', async () => {
      const historyData = {
        question: 'What does test.com do?',
        domain: 'test.com',
        answer: 'Test.com is a test company.',
      };

      // First save a history item
      await request(app.getHttpServer())
        .post('/history')
        .send(historyData)
        .expect(201);

      // Then get history and verify it contains the saved item
      return request(app.getHttpServer())
        .get('/history')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          const savedItem = res.body.find((item: any) => item.question === historyData.question);
          expect(savedItem).toBeDefined();
          expect(savedItem.domain).toBe(historyData.domain);
          expect(savedItem.answer).toBe(historyData.answer);
        });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', () => {
      return request(app.getHttpServer())
        .get('/non-existent-route')
        .expect(404);
    });

    it('should handle unsupported HTTP methods', () => {
      return request(app.getHttpServer())
        .put('/health')
        .expect(404);
    });

    it('should handle malformed request body', () => {
      return request(app.getHttpServer())
        .post('/questions/analyze')
        .send('{"question": "test"') // Malformed JSON
        .set('Content-Type', 'application/json')
        .expect(400);
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app.getHttpServer())
          .get('/health')
          .expect(200)
      );

      await Promise.all(requests);
    });

    it('should handle rapid successive requests', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .get('/health')
          .expect(200);
      }
    });
  });
}); 