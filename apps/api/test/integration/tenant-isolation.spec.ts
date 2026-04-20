import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  Controller,
  Get,
} from '@nestjs/common';
import { CommonModule } from '../../src/common/common.module';
import { TenantMiddleware } from '../../src/common/middleware/tenant.middleware';
import { CurrentTenant } from '../../src/common/decorators/current-tenant.decorator';

const TEST_JWT_SECRET = 'test-secret-min-32-chars-for-test-env';

// Controller minimal pour les tests
@Controller('api/v1/test')
class TestController {
  @Get('tenant')
  getTenant(@CurrentTenant() tenantId: string): { tenantId: string } {
    return { tenantId };
  }
}

// Module de test qui applique TenantMiddleware
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        () => ({
          jwt: { secret: TEST_JWT_SECRET },
          frontendUrl: 'http://localhost:3000',
          port: 3002,
          nodeEnv: 'test',
          database: { url: 'postgresql://test' },
          redis: { url: 'redis://localhost:6379' },
          r2: {
            accountId: 'test-account-id',
            accessKeyId: 'test-access-key',
            secretAccessKey: 'test-secret-key',
          },
          sentry: { dsn: '' },
          encryption: { key: '' },
          twilio: {},
          llm: {},
        }),
      ],
    }),
    CommonModule,
  ],
  controllers: [TestController],
})
class TestAppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: 'api/v1/test/*path', method: RequestMethod.ALL });
  }
}

describe('TenantMiddleware — Isolation (intégration)', () => {
  let app: INestApplication;
  const tenantId = 'tenant-test-uuid-123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  function makeValidJwt(payload: object = {}): string {
    return jwt.sign(
      { sub: 'user-123', tenantId, role: 'OWNER', ...payload },
      TEST_JWT_SECRET,
      { expiresIn: '15m' },
    );
  }

  describe('AC5 — Requête sans access_token → 401', () => {
    it('retourne 401 sans aucun cookie', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/test/tenant')
        .expect(401);
    });

    it('retourne 401 avec un JWT invalide (mauvais secret)', async () => {
      const badToken = jwt.sign(
        { sub: 'user-123', tenantId, role: 'OWNER' },
        'wrong-secret-entirely',
        { expiresIn: '15m' },
      );
      await request(app.getHttpServer())
        .get('/api/v1/test/tenant')
        .set('Cookie', `access_token=${badToken}`)
        .expect(401);
    });

    it('retourne 401 avec un JWT expiré', async () => {
      const expiredToken = jwt.sign(
        { sub: 'user-123', tenantId, role: 'OWNER' },
        TEST_JWT_SECRET,
        { expiresIn: '-1s' }, // déjà expiré
      );
      await request(app.getHttpServer())
        .get('/api/v1/test/tenant')
        .set('Cookie', `access_token=${expiredToken}`)
        .expect(401);
    });

    it('retourne 401 avec un JWT sans tenantId', async () => {
      const tokenWithoutTenant = jwt.sign(
        { sub: 'user-123', role: 'OWNER' }, // pas de tenantId
        TEST_JWT_SECRET,
        { expiresIn: '15m' },
      );
      await request(app.getHttpServer())
        .get('/api/v1/test/tenant')
        .set('Cookie', `access_token=${tokenWithoutTenant}`)
        .expect(401);
    });
  });

  describe('Requête avec JWT valide — middleware passe', () => {
    it('retourne 200 et le tenantId correct avec un JWT valide', async () => {
      const token = makeValidJwt();
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/tenant')
        .set('Cookie', `access_token=${token}`)
        .expect(200);

      expect(response.body).toEqual({ tenantId });
    });
  });
});
