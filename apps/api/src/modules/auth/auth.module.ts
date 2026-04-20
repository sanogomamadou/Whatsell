import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') ?? '',
        // expiresIn géré explicitement dans AuthService.generateTokens()
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, JwtStrategy, JwtAuthGuard],
  exports: [JwtStrategy, PassportModule, JwtAuthGuard],
})
export class AuthModule {}
