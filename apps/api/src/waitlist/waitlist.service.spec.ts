import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from 'src/email/email.service';
import { WaitlistService } from './waitlist.service';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));
import { createClient } from '@supabase/supabase-js';

/**
 * The real Supabase query builder is "thenable" — you can either keep
 * chaining filters (.select().eq().lte()) OR await it directly, which
 * triggers the actual HTTP request. joinWaitlist() does both depending
 * on the branch, so our fake builder needs to support both styles:
 *  - chain methods (select/eq/lte/insert) return `this`
 *  - awaiting the builder directly resolves via `.then`
 *  - .maybeSingle() / .single() resolve explicitly, like the real client
 */
function makeQueryResult(resolvedValue: any) {
  const builder: any = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    lte: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    maybeSingle: jest.fn().mockResolvedValue(resolvedValue),
    single: jest.fn().mockResolvedValue(resolvedValue),
    then: (resolve: any) => resolve(resolvedValue),
  };
  return builder;
}

describe('WaitlistService', () => {
  let service: WaitlistService;
  let mockSupabaseFrom: jest.Mock;
  let mockSendWaitlistConfirmation: jest.Mock;

  beforeEach(async () => {
    mockSupabaseFrom = jest.fn();
    (createClient as jest.Mock).mockReturnValue({ from: mockSupabaseFrom });

    mockSendWaitlistConfirmation = jest.fn().mockResolvedValue(undefined);

    const configValues: Record<string, string> = {
      SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_SERVICE_ROLE_KEY: 'fake-service-role-key',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaitlistService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: (key: string) => configValues[key] },
        },
        {
          provide: EmailService,
          useValue: { sendWaitlistConfirmation: mockSendWaitlistConfirmation },
        },
      ],
    }).compile();

    service = module.get(WaitlistService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('joinWaitlist — duplicate email', () => {
    it('returns "already on the list" with position, and does NOT insert or email again', async () => {
      // Call order inside joinWaitlist for an existing email. Note this is
      // NOT top-to-bottom reading order — to call `.lte(a, b)`, JS must
      // first fully evaluate the base object it's called on (the outer
      // count query) before it evaluates the arguments (which includes
      // the inner single() query as an awaited expression). So:
      // 1. select('id').eq(...).maybeSingle()          -> row found
      // 2. select('*', {count, head})  [outer, base of .lte()]
      // 3. select('created_at').eq(...).single()       -> row's timestamp [argument to .lte()]
      mockSupabaseFrom
        .mockReturnValueOnce(makeQueryResult({ data: { id: 'existing-row' }, error: null }))
        .mockReturnValueOnce(makeQueryResult({ count: 3, error: null }))
        .mockReturnValueOnce(makeQueryResult({ data: { created_at: '2026-01-01T00:00:00Z' }, error: null }));

      const result = await service.joinWaitlist('already@signed-up.com');

      expect(result).toEqual({
        message: "You're already on the list!",
        position: 3,
      });

      // The critical assertions: a duplicate signup must not create a new
      // row or trigger a second confirmation email.
      const insertCalls = mockSupabaseFrom.mock.results
        .map((r) => r.value.insert.mock.calls.length)
        .reduce((a, b) => a + b, 0);
      expect(insertCalls).toBe(0);
      expect(mockSendWaitlistConfirmation).not.toHaveBeenCalled();
    });
  });

  describe('joinWaitlist — new email', () => {
    it('inserts the row, sends a confirmation email, and returns the position', async () => {
      // Call order for a brand-new email:
      // 1. select('id').eq(...).maybeSingle()  -> no existing row
      // 2. insert({ email })                   -> success
      // 3. select('*', {count, head})          -> total count after insert
      mockSupabaseFrom
        .mockReturnValueOnce(makeQueryResult({ data: null, error: null }))
        .mockReturnValueOnce(makeQueryResult({ error: null }))
        .mockReturnValueOnce(makeQueryResult({ count: 5, error: null }));

      const result = await service.joinWaitlist('new@example.com');

      expect(result).toEqual({
        message: "You're #5 on the list!",
        position: 5,
      });
      expect(mockSendWaitlistConfirmation).toHaveBeenCalledWith('new@example.com');
    });

    it('throws if the insert fails', async () => {
      mockSupabaseFrom
        .mockReturnValueOnce(makeQueryResult({ data: null, error: null }))
        .mockReturnValueOnce(makeQueryResult({ error: { message: 'insert failed' } }));

      await expect(service.joinWaitlist('broken@example.com')).rejects.toThrow(
        'Failed to join waitlist: insert failed',
      );
      expect(mockSendWaitlistConfirmation).not.toHaveBeenCalled();
    });
  });
});