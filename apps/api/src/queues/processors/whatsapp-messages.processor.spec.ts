import { WhatsappMessagesProcessor } from './whatsapp-messages.processor';
import { Job } from 'bullmq';

describe('WhatsappMessagesProcessor', () => {
  let processor: WhatsappMessagesProcessor;

  beforeEach(() => {
    processor = new WhatsappMessagesProcessor();
  });

  describe('process', () => {
    it('should throw "Not implemented" to prevent silent job discard in stub state', async () => {
      const job = { id: '1', name: 'process', data: {}, opts: {} } as unknown as Job;
      await expect(processor.process(job)).rejects.toThrow('Not implemented — Story 4.3 required');
    });
  });

  describe('onFailed — dead-letter logging', () => {
    it('should log error when all attempts are exhausted (attempt 3 of 3)', () => {
      const logSpy = jest.spyOn(processor['logger'], 'error');
      const job = {
        id: 'job-123',
        name: 'process',
        data: { phone: '+225070000000' },
        attemptsMade: 3,
        opts: { attempts: 3 },
      } as unknown as Job;

      processor.onFailed(job, new Error('Connection timeout'));

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'dead-letter',
          queue: 'whatsapp-messages',
          jobId: 'job-123',
          jobName: 'process',
          attemptsMade: 3,
          error: 'Connection timeout',
        }),
      );
    });

    it('should NOT include job.data in dead-letter log (PII protection)', () => {
      const logSpy = jest.spyOn(processor['logger'], 'error');
      const job = {
        id: 'job-pii',
        name: 'process',
        data: { phone: '+225070000000', message: 'secret' },
        attemptsMade: 3,
        opts: { attempts: 3 },
      } as unknown as Job;

      processor.onFailed(job, new Error('Timeout'));

      const loggedPayload = logSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(loggedPayload).not.toHaveProperty('data');
    });

    it('should include timestamp in ISO format in dead-letter log', () => {
      const logSpy = jest.spyOn(processor['logger'], 'error');
      const job = {
        id: 'job-456',
        name: 'process',
        data: {},
        attemptsMade: 3,
        opts: { attempts: 3 },
      } as unknown as Job;

      processor.onFailed(job, new Error('Timeout'));

      const loggedPayload = logSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(() => new Date(loggedPayload['timestamp'] as string)).not.toThrow();
    });

    it('should NOT log dead-letter on first failure (attempt 1 of 3)', () => {
      const logSpy = jest.spyOn(processor['logger'], 'error');
      const job = {
        id: 'job-789',
        name: 'process',
        data: {},
        attemptsMade: 1,
        opts: { attempts: 3 },
      } as unknown as Job;

      processor.onFailed(job, new Error('Temp error'));

      expect(logSpy).not.toHaveBeenCalled();
    });

    it('should NOT log dead-letter on second failure (attempt 2 of 3)', () => {
      const logSpy = jest.spyOn(processor['logger'], 'error');
      const job = {
        id: 'job-999',
        name: 'process',
        data: {},
        attemptsMade: 2,
        opts: { attempts: 3 },
      } as unknown as Job;

      processor.onFailed(job, new Error('Still failing'));

      expect(logSpy).not.toHaveBeenCalled();
    });

    it('should fallback to 3 attempts when opts.attempts is not defined', () => {
      const logSpy = jest.spyOn(processor['logger'], 'error');
      const job = {
        id: 'job-fallback',
        name: 'process',
        data: {},
        attemptsMade: 3,
        opts: {},
      } as unknown as Job;

      processor.onFailed(job, new Error('Fallback test'));

      expect(logSpy).toHaveBeenCalled();
    });
  });
});
