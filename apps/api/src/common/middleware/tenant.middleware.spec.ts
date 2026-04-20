import { TenantContextService } from '../services/tenant-context.service';

describe('TenantContextService', () => {
  let service: TenantContextService;

  beforeEach(() => {
    service = new TenantContextService();
  });

  describe('getTenantId()', () => {
    it('retourne undefined hors contexte AsyncLocalStorage', () => {
      expect(service.getTenantId()).toBeUndefined();
    });

    it('retourne le tenantId dans le contexte run()', (done) => {
      const tenantId = 'tenant-abc-123';
      service.run(tenantId, () => {
        expect(service.getTenantId()).toBe(tenantId);
        done();
      });
    });

    it('isole le contexte entre deux appels run() parallèles', (done) => {
      let count = 0;
      const finish = () => {
        count++;
        if (count === 2) done();
      };

      service.run('tenant-1', () => {
        // Simule un délai async
        setImmediate(() => {
          expect(service.getTenantId()).toBe('tenant-1');
          finish();
        });
      });

      service.run('tenant-2', () => {
        setImmediate(() => {
          expect(service.getTenantId()).toBe('tenant-2');
          finish();
        });
      });
    });

    it('retourne undefined après la fin du contexte run()', () => {
      service.run('tenant-xyz', () => {
        // dans le contexte
        expect(service.getTenantId()).toBe('tenant-xyz');
      });
      // hors du contexte
      expect(service.getTenantId()).toBeUndefined();
    });
  });

  describe('run()', () => {
    it('retourne la valeur de retour du callback', () => {
      const result = service.run('tenant-123', () => 'hello');
      expect(result).toBe('hello');
    });

    it('propage les exceptions du callback', () => {
      expect(() => {
        service.run('tenant-err', () => {
          throw new Error('test error');
        });
      }).toThrow('test error');
    });
  });
});
