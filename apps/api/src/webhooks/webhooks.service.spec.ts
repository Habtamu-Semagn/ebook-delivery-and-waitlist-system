import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import Stripe from 'stripe';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))
describe('WebhooksService', () => {
  let service: WebhooksService;
  let mockQueue: { add: jest.Mock };
  let mockSupabaseFrom: jest.Mock;

  const STRIPE_SECRET_KEY = 'sk_test_fake_key_for_tests';
  const STRIPE_WEBHOOK_SECRET = 'whsec_test_fake_secret';

  beforeEach(async () => {
    mockQueue = { add: jest.fn().mockResolvedValue(undefined) };

    const chain: any = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
    };
    mockSupabaseFrom = jest.fn().mockReturnValue(chain);
    (createClient as jest.Mock).mockReturnValue({ from: mockSupabaseFrom });

    const configValues: Record<string, string> = {
      STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET,
      SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_SERVICE_ROLE_KEY: 'fake-service-role-key',
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: (key: string) => configValues[key] },
        },
        // Nest identifies injected BullMQ queues by a generated token —
        // this is how we swap the real Redis-backed queue for our mock.
        { provide: getQueueToken('webhook-events'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('verifySignature', () => {
    const stripe = new Stripe(STRIPE_SECRET_KEY);

    it('returns the parsed event when the signature is valid', () => {
       const payload = JSON.stringify({
        id: 'evt_test_1',
        type: 'checkout.session.completed',
      });

      const header = stripe.webhooks.generateTestHeaderString({
        payload,
        secret: STRIPE_WEBHOOK_SECRET,
      });

      const event = service.verifySignature(Buffer.from(payload), header);

      expect(event.id).toBe('evt_test_1');
      expect(event.type).toBe('checkout.session.completed');
    })

    it('throws when the payload was signed with a different secret', () => {
      const payload = JSON.stringify({ id: 'evt_test_2' });
      const header = stripe.webhooks.generateTestHeaderString({
        payload,
        secret: 'whsec_wrong_secret',
      });
 
      expect(() =>
        service.verifySignature(Buffer.from(payload), header),
      ).toThrow();
    });

    it('throws when the signature header is malformed or missing', () => {
      const payload = JSON.stringify({ id: 'evt_test_3' });
 
      expect(() =>
        service.verifySignature(Buffer.from(payload), 'not-a-real-signature'),
      ).toThrow();
    });

    it('throws when the raw body has been tampered with after signing', () => {
      const originalPayload = JSON.stringify({ id: 'evt_test_4', amount: 1000 });
      const header = stripe.webhooks.generateTestHeaderString({
        payload: originalPayload,
        secret: STRIPE_WEBHOOK_SECRET,
      });
 
      // Attacker (or a proxy/middleware bug) changes the body after signing
      const tamperedPayload = JSON.stringify({ id: 'evt_test_4', amount: 100000 });
 
      expect(() =>
        service.verifySignature(Buffer.from(tamperedPayload), header),
      ).toThrow();
    });
  })

  describe('isEventAlreadyProcessed', () => {
    it('returns true when a matching row exists', async () => {
      const chain = mockSupabaseFrom('webhook_events');
      chain.maybeSingle.mockResolvedValue({ data: { id: 'row_1' }, error: null });
 
      const result = await service.isEventAlreadyProcessed('evt_123');
 
      expect(result).toBe(true);
      expect(mockSupabaseFrom).toHaveBeenCalledWith('webhook_events');
      expect(chain.eq).toHaveBeenCalledWith('event_id', 'evt_123');
    });
 
    it('returns false when no row exists', async () => {
      const chain = mockSupabaseFrom('webhook_events');
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });
 
      const result = await service.isEventAlreadyProcessed('evt_456');
 
      expect(result).toBe(false);
    });
  })

  describe('processEvent (idempotency guarantee)', () => {
    const event = {
      id: 'evt_789',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_1' } },
    } as Stripe.Event;

    it('does NOT save or enqueue when the event was already processed', async () => {
      const chain = mockSupabaseFrom('webhook_events');
      chain.maybeSingle.mockResolvedValue({ data: { id: 'row_1' }, error: null });
 
      await service.processEvent(event, 'corr-1');
 
      // This is the actual idempotency contract: a duplicate Stripe delivery
      // must never insert a second row or queue a second job.
      expect(chain.insert).not.toHaveBeenCalled();
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('saves the event and enqueues a job on first arrival', async () => {
      const chain = mockSupabaseFrom('webhook_events');
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });
      chain.insert.mockResolvedValue({ error: null });
 
      await service.processEvent(event, 'corr-2');
 
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_id: 'evt_789',
          status: 'pending',
          attempts: 0,
        }),
      );
      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-webhook',
        expect.objectContaining({
          eventId: 'evt_789',
          eventType: 'checkout.session.completed',
        }),
        expect.objectContaining({ attempts: 5 }),
      );
    });

    it('does not throw when the queue fails to accept the job (fire-and-forget)', async () => {
      const chain = mockSupabaseFrom('webhook_events');
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });
      chain.insert.mockResolvedValue({ error: null });
      mockQueue.add.mockRejectedValue(new Error('redis connection lost'));
 
      // processEvent intentionally does NOT await queue.add() — a queue
      // hiccup must not turn into a failed webhook response to Stripe.
      await expect(service.processEvent(event, 'corr-3')).resolves.not.toThrow();
    });
  })
});
