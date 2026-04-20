import { Global, Module } from '@nestjs/common';
import { TenantContextService } from './services/tenant-context.service';
import { StorageService } from './services/storage.service';
import { EncryptionService } from './services/encryption.service';
import { TenantMiddleware } from './middleware/tenant.middleware';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { ResponseWrapperInterceptor } from './interceptors/response-wrapper.interceptor';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Global()
@Module({
  providers: [
    TenantContextService,
    StorageService,
    EncryptionService,
    TenantMiddleware,
    AllExceptionsFilter,
    ResponseWrapperInterceptor,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    TenantContextService,
    StorageService,
    EncryptionService,
    AllExceptionsFilter,
    ResponseWrapperInterceptor,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class CommonModule {}
