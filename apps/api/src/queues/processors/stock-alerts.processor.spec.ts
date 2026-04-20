import { StockAlertsProcessor } from './stock-alerts.processor';
import { Job } from 'bullmq';

describe('StockAlertsProcessor', () => {
  let processor: StockAlertsProcessor;

  beforeEach(() => {
    processor = new StockAlertsProcessor();
  });

  describe('process', () => {
    it('should throw "Not implemented" to prevent silent job discard in stub state', async () => {
      const job = { id: '1', name: 'check', data: {}, opts: {} } as unknown as Job;
      await expect(processor.process(job)).rejects.toThrow('Not implemented — Story 3.5 required');
    });
  });

  describe('onFailed — dead-letter logging', () => {
    it('should log dead-letter when all attempts exhausted', () => {
      const logSpy = jest.spyOn(processor['logger'], 'error');
      const job = {
        id: 'stock-job-1',
        name: 'check',
        data: { productId: 'prod-abc' },
        attemptsMade: 3,
        opts: { attempts: 3 },
      } as unknown as Job;

      processor.onFailed(job, new Error('Redis down'));

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'dead-letter',
          queue: 'stock-alerts',
          jobId: 'stock-job-1',
          attemptsMade: 3,
          error: 'Redis down',
        }),
      );
    });

    it('should NOT include job.data in dead-letter log (PII protection)', () => {
      const logSpy = jest.spyOn(processor['logger'], 'error');
      const job = {
        id: 'stock-job-pii',
        name: 'check',
        data: { productId: 'prod-abc', tenantId: 'tenant-xyz' },
        attemptsMade: 3,
        opts: { attempts: 3 },
      } as unknown as Job;

      processor.onFailed(job, new Error('Timeout'));

      const loggedPayload = logSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(loggedPayload).not.toHaveProperty('data');
    });

    it('should NOT log dead-letter on intermediate failure', () => {
      const logSpy = jest.spyOn(processor['logger'], 'error');
      const job = {
        id: 'stock-job-2',
        name: 'check',
        data: {},
        attemptsMade: 1,
        opts: { attempts: 3 },
      } as unknown as Job;

      processor.onFailed(job, new Error('Temp'));
      expect(logSpy).not.toHaveBeenCalled();
    });
  });
});
