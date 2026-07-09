import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WebhooksProcessor } from './webhooks.processor';
import { EmailService } from '../email/email.service';
import { Job } from 'bullmq';

// Mock Supabase Client
const mockSupabaseUpdate = jest.fn().mockReturnThis();
const mockSupabaseEq = jest.fn().mockResolvedValue({ error: null });

const mockSupabaseClient = {
  from: jest.fn().mockReturnValue({
    update: mockSupabaseUpdate,
    eq: mockSupabaseEq,
  }),
};

// Mock Supabase Module
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

describe('WebhooksProcessor - Retry & DLQ Unit Tests', () => {
  let processor: WebhooksProcessor;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksProcessor,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              if (key === 'SUPABASE_URL') return 'https://mock.supabase.co';
              if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'mock-key';
              return '';
            }),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendAdminAlert: jest.fn().mockResolvedValue(undefined),
            sendPurchaseConfirmation: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    processor = module.get<WebhooksProcessor>(WebhooksProcessor);
    emailService = module.get(EmailService);
  });

  // Test cases go here...
  describe('onFailed Listener', () => {
  it('should update error message for intermediate retry attempts (Attempts < Max)', async () => {
    // Mock job state for attempt 2 of 6
    const mockJob = {
      attemptsMade: 2,
      opts: { attempts: 6 },
      data: { eventId: 'evt_test_123' },
    } as unknown as Job;

    const mockError = new Error('Database connection failed');

    await processor.onFailed(mockJob, mockError);

    // Verify Supabase update was called for intermediate error logging
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('webhook_events');
    expect(mockSupabaseUpdate).toHaveBeenCalledWith({
      attempts: 2,
      error_message: 'Attempt 2 failed: Database connection failed',
      updated_at: expect.any(String),
    });
    expect(mockSupabaseEq).toHaveBeenCalledWith('event_id', 'evt_test_123');

    // Verify Admin Alert Email WAS NOT sent during intermediate retries
    expect(emailService.sendAdminAlert).not.toHaveBeenCalled();
  });

  it('should mark status as "failed" and send admin alert when max attempts reached', async () => {
    // Mock job state on final attempt (Attempt 6 of 6)
    const mockJob = {
      attemptsMade: 6,
      opts: { attempts: 6 },
      data: { eventId: 'evt_test_123' },
    } as unknown as Job;

    const mockError = new Error('Permanent Stripe Processing Failure');

    await processor.onFailed(mockJob, mockError);

    // Verify status updated to 'failed' in Supabase
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('webhook_events');
    expect(mockSupabaseUpdate).toHaveBeenCalledWith({
      status: 'failed',
      attempts: 6,
      updated_at: expect.any(String),
    });

    // Verify Admin Alert Email WAS sent
    expect(emailService.sendAdminAlert).toHaveBeenCalledWith(
      '[DLQ Alert] Stripe Webhook Failed Permanently',
      expect.stringContaining('evt_test_123')
    );
  });
});
    describe('process() - Exception Bubbling', () => {
  it('should bubble up processing errors so BullMQ schedules a retry', async () => {
    const mockJob = {
      attemptsMade: 0,
      data: {
        eventId: 'evt_test_456',
        eventType: 'checkout.session.completed',
        data: { object: { id: 'cs_test_123' } },
      },
    } as unknown as Job;

    // Force handlePaymentSucceeded dependency to throw an error
    jest.spyOn(processor as any, 'handlePaymentSucceeded').mockRejectedValue(
      new Error('Failed to update purchase status')
    );

    // Expect process() to throw without masking the error
    await expect(processor.process(mockJob)).rejects.toThrow(
      'Failed to update purchase status'
    );
  });
});
});