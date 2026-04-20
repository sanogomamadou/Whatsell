import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { InternalServerErrorException } from '@nestjs/common';
import { QueuesService } from './queues.service';

describe('QueuesService', () => {
  let service: QueuesService;

  const makeMockQueue = () => ({ add: jest.fn() });
  let mockWhatsappQueue: ReturnType<typeof makeMockQueue>;
  let mockStockQueue: ReturnType<typeof makeMockQueue>;
  let mockAdvisorQueue: ReturnType<typeof makeMockQueue>;
  let mockTrialQueue: ReturnType<typeof makeMockQueue>;
  let mockHealthQueue: ReturnType<typeof makeMockQueue>;

  beforeEach(async () => {
    mockWhatsappQueue = makeMockQueue();
    mockStockQueue = makeMockQueue();
    mockAdvisorQueue = makeMockQueue();
    mockTrialQueue = makeMockQueue();
    mockHealthQueue = makeMockQueue();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueuesService,
        { provide: getQueueToken('whatsapp-messages'), useValue: mockWhatsappQueue },
        { provide: getQueueToken('stock-alerts'), useValue: mockStockQueue },
        { provide: getQueueToken('advisor-alerts'), useValue: mockAdvisorQueue },
        { provide: getQueueToken('trial-expiry'), useValue: mockTrialQueue },
        { provide: getQueueToken('whatsapp-health-check'), useValue: mockHealthQueue },
      ],
    }).compile();

    service = module.get<QueuesService>(QueuesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enqueueWhatsappMessage', () => {
    it('should call queue.add with job name "process" and the provided data', async () => {
      const data = { phone: '+2250700000000', message: 'Bonjour' };
      await service.enqueueWhatsappMessage(data);
      expect(mockWhatsappQueue.add).toHaveBeenCalledWith('process', data);
    });

    it('should throw InternalServerErrorException when queue.add fails', async () => {
      mockWhatsappQueue.add.mockRejectedValueOnce(new Error('Redis down'));
      await expect(service.enqueueWhatsappMessage({})).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('enqueueStockAlert', () => {
    it('should call queue.add with job name "check" and the provided data', async () => {
      const data = { productId: 'prod-abc', tenantId: 'tenant-xyz' };
      await service.enqueueStockAlert(data);
      expect(mockStockQueue.add).toHaveBeenCalledWith('check', data);
    });

    it('should throw InternalServerErrorException when queue.add fails', async () => {
      mockStockQueue.add.mockRejectedValueOnce(new Error('Redis down'));
      await expect(service.enqueueStockAlert({})).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('enqueueAdvisorAlert', () => {
    it('should call queue.add with job name "alert" and the provided data', async () => {
      const data = { tenantId: 'tenant-xyz', alertType: 'low-stock' };
      await service.enqueueAdvisorAlert(data);
      expect(mockAdvisorQueue.add).toHaveBeenCalledWith('alert', data);
    });

    it('should throw InternalServerErrorException when queue.add fails', async () => {
      mockAdvisorQueue.add.mockRejectedValueOnce(new Error('Redis down'));
      await expect(service.enqueueAdvisorAlert({})).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('enqueueTrialExpiry', () => {
    it('should call queue.add with job name "notify" and the provided data', async () => {
      const data = { tenantId: 'tenant-xyz', daysLeft: 2 };
      await service.enqueueTrialExpiry(data);
      expect(mockTrialQueue.add).toHaveBeenCalledWith('notify', data);
    });

    it('should throw InternalServerErrorException when queue.add fails', async () => {
      mockTrialQueue.add.mockRejectedValueOnce(new Error('Redis down'));
      await expect(service.enqueueTrialExpiry({})).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('enqueueHealthCheck', () => {
    it('should call queue.add with job name "check" and the provided data', async () => {
      const data = { tenantId: 'tenant-xyz' };
      await service.enqueueHealthCheck(data);
      expect(mockHealthQueue.add).toHaveBeenCalledWith('check', data);
    });

    it('should throw InternalServerErrorException when queue.add fails', async () => {
      mockHealthQueue.add.mockRejectedValueOnce(new Error('Redis down'));
      await expect(service.enqueueHealthCheck({})).rejects.toThrow(InternalServerErrorException);
    });
  });
});
