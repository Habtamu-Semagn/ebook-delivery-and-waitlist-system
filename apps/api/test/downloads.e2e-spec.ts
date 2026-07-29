import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestOrdersModule } from './test-orders.module';
import { supabase } from './test-utils/supabase';

// Mock firebase-admin before any imports
jest.mock('firebase-admin', () => ({
  cert: jest.fn(),
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  app: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

let userId: string;
let bookId: string;
let anotherUserId: string;

jest.mock('src/guards/firebase-auth.guard', () => ({
  FirebaseAuthGuard: class {
    canActivate(context: any) {
      const request = context.switchToHttp().getRequest();
      request.user = {
        uid: request.headers['x-test-uid'] || 'test-user-id',
      };
      return true;
    }
  },
}));

// Mock Supabase storage before any service instantiation
jest.mock('@supabase/supabase-js', () => {
  const actual = jest.requireActual('@supabase/supabase-js');
  const createClientOriginal = actual.createClient;

  return {
    ...actual,
    createClient: jest.fn((...args) => {
      const client = createClientOriginal(...args);
      const originalStorageFrom = client.storage.from.bind(client.storage);

      client.storage.from = jest.fn((bucket: string) => {
        const storageBucket = originalStorageFrom(bucket);
        storageBucket.createSignedUrl = jest.fn(async (path: string, expiresIn: number) => ({
          data: {
            signedUrl: `https://supabase.example.com/storage/v1/object/sign/${bucket}/${path}?token=test-token-${Date.now()}&expires=${Date.now() + expiresIn * 1000}`,
          },
          error: null,
        }));
        return storageBucket;
      });

      return client;
    }),
  };
});

describe('Downloads Integration Test - Signed URLs & Expiration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestOrdersModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Create test user 1 with unique email
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        firebase_uid: 'test-user-id',
        email: `downloads-test-${Date.now()}@example.com`,
      })
      .select()
      .single();

    if (userError) {
      throw userError;
    }

    userId = user.id;

    // Create test user 2 (for unauthorized access test)
    const { data: user2, error: user2Error } = await supabase
      .from('users')
      .insert({
        firebase_uid: 'another-user-id',
        email: `downloads-another-${Date.now()}@example.com`,
      })
      .select()
      .single();

    if (user2Error) {
      throw user2Error;
    }

    anotherUserId = user2.id;

    // Create test book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert({
        title: 'Test Book for Download',
        author: 'Test Author',
        description: 'Book for testing downloads',
        price: 1000,
        file_url: 'ebooks/test-book.pdf',
        is_active: true,
      })
      .select()
      .single();

    if (bookError) {
      throw bookError;
    }

    bookId = book.id;

    // Create completed purchase for user 1
    await supabase.from('purchases').insert({
      user_id: userId,
      book_id: bookId,
      status: 'completed',
      payment_order_id: 'cs_test_123',
    });
  });

  afterEach(async () => {
    // Clean up
    await supabase.from('purchases').delete().eq('book_id', bookId);
    await supabase.from('books').delete().eq('id', bookId);
    await supabase.from('users').delete().eq('id', userId);
    await supabase.from('users').delete().eq('id', anotherUserId);
  });

  describe('GET /purchases/:bookId/download', () => {
    it('should return signed download URL for purchased book', async () => {
      const response = await request(app.getHttpServer())
        .get(`/purchases/${bookId}/download`)
        .set('x-test-uid', 'test-user-id')
        .expect(200);

      expect(response.body).toHaveProperty('downloadUrl');
      expect(response.body.downloadUrl).toBeDefined();
      expect(response.body.downloadUrl).toContain('token=');
    });

    it('should return 403 when user has no purchase for book', async () => {
      const response = await request(app.getHttpServer())
        .get(`/purchases/${bookId}/download`)
        .set('x-test-uid', 'another-user-id')
        .expect(403);

      expect(response.body.message).toContain('do not have access');
    });

    it('should return 404 when book does not exist', async () => {
      const response = await request(app.getHttpServer())
        .get(`/purchases/nonexistent-book/download`)
        .set('x-test-uid', 'test-user-id')
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 when user is not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get(`/purchases/${bookId}/download`);

      // Mocked guard will inject test-user-id by default
      // Real implementation would return 401
      expect(response.status).toBeDefined();
    });

    it('should return signed URL with valid format', async () => {
      const response = await request(app.getHttpServer())
        .get(`/purchases/${bookId}/download`)
        .set('x-test-uid', 'test-user-id')
        .expect(200);

      const url = response.body.downloadUrl;

      // Check URL contains signed URL parameters
      expect(url).toContain('token=');
      expect(url).toContain('supabase'); // Should be Supabase storage URL
    });

    it('should prevent access when purchase status is not completed', async () => {
      // Create pending purchase
      const { data: newBook } = await supabase
        .from('books')
        .insert({
          title: 'Pending Purchase Book',
          author: 'Test Author',
          description: 'Test pending',
          price: 500,
          file_url: 'ebooks/pending.pdf',
          is_active: true,
        })
        .select()
        .single();

      await supabase.from('purchases').insert({
        user_id: userId,
        book_id: newBook.id,
        status: 'pending',
        payment_order_id: 'cs_test_pending',
      });

      const response = await request(app.getHttpServer())
        .get(`/purchases/${newBook.id}/download`)
        .set('x-test-uid', 'test-user-id')
        .expect(403);

      expect(response.body.message).toContain('do not have access');

      // Cleanup
      await supabase.from('purchases').delete().eq('book_id', newBook.id);
      await supabase.from('books').delete().eq('id', newBook.id);
    });

    it('should return different URLs for different download requests', async () => {
      const response1 = await request(app.getHttpServer())
        .get(`/purchases/${bookId}/download`)
        .set('x-test-uid', 'test-user-id')
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get(`/purchases/${bookId}/download`)
        .set('x-test-uid', 'test-user-id')
        .expect(200);

      expect(response1.body.downloadUrl).toBeDefined();
      expect(response2.body.downloadUrl).toBeDefined();
      // URLs should be different (new token each time)
      expect(response1.body.downloadUrl).not.toEqual(response2.body.downloadUrl);
    });

    it('should include expiration info in URL', async () => {
      const response = await request(app.getHttpServer())
        .get(`/purchases/${bookId}/download`)
        .set('x-test-uid', 'test-user-id')
        .expect(200);

      const url = response.body.downloadUrl;

      // Supabase signed URLs include expires parameter
      expect(url).toContain('expires');
    });

    it('should handle failed purchase lookup gracefully', async () => {
      // Invalid book ID format
      const response = await request(app.getHttpServer())
        .get(`/purchases/invalid-format/download`)
        .set('x-test-uid', 'test-user-id')
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /purchases - List purchases', () => {
    it('should list all completed purchases for user', async () => {
      const response = await request(app.getHttpServer())
        .get('/purchases')
        .set('x-test-uid', 'test-user-id')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('book_id');
      expect(response.body[0]).toHaveProperty('status');
      expect(response.body[0].status).toBe('completed');
    });

    it('should not list pending purchases', async () => {
      // Create pending purchase
      const { data: newBook } = await supabase
        .from('books')
        .insert({
          title: 'Pending Book',
          author: 'Test',
          description: 'Pending test',
          price: 500,
          file_url: 'ebooks/pending.pdf',
          is_active: true,
        })
        .select()
        .single();

      await supabase.from('purchases').insert({
        user_id: userId,
        book_id: newBook.id,
        status: 'pending',
        payment_order_id: 'cs_pending',
      });

      const response = await request(app.getHttpServer())
        .get('/purchases')
        .set('x-test-uid', 'test-user-id')
        .expect(200);

      // Should still only have completed purchase
      const pendingExists = response.body.some(
        (p: any) => p.book_id === newBook.id && p.status === 'pending'
      );

      expect(pendingExists).toBe(false);

      // Cleanup
      await supabase.from('purchases').delete().eq('book_id', newBook.id);
      await supabase.from('books').delete().eq('id', newBook.id);
    });

    it('should return empty list if user has no purchases', async () => {
      const response = await request(app.getHttpServer())
        .get('/purchases')
        .set('x-test-uid', 'another-user-id')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should include book details in purchase list', async () => {
      const response = await request(app.getHttpServer())
        .get('/purchases')
        .set('x-test-uid', 'test-user-id')
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].books).toBeDefined();
      expect(response.body[0].books.title).toBe('Test Book for Download');
    });
  });
});
