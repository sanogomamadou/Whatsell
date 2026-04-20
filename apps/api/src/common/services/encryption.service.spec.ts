import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

const VALID_KEY = 'a'.repeat(32); // 32 chars valides

describe('EncryptionService', () => {
  let service: EncryptionService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    configService = {
      get: jest.fn().mockReturnValue(VALID_KEY),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  it('encrypt/decrypt round-trip retourne la valeur originale', () => {
    const original = 'https://fcm.googleapis.com/fcm/send/test-endpoint';
    const encrypted = service.encrypt(original);
    expect(service.decrypt(encrypted)).toBe(original);
  });

  it('chaque appel encrypt produit un IV différent (ciphertext différent)', () => {
    const plaintext = 'même-texte-clair';
    const enc1 = service.encrypt(plaintext);
    const enc2 = service.encrypt(plaintext);
    expect(enc1).not.toBe(enc2);
    // Mais les deux se déchiffrent correctement
    expect(service.decrypt(enc1)).toBe(plaintext);
    expect(service.decrypt(enc2)).toBe(plaintext);
  });

  it('decrypt avec format invalide throw une erreur', () => {
    expect(() => service.decrypt('donnees-non-formatees')).toThrow(
      'Format de données chiffrées invalide',
    );
  });

  it('decrypt avec données corrompues throw une erreur (auth tag invalide)', () => {
    const encrypted = service.encrypt('test');
    // Corrompre le ciphertext
    const parts = encrypted.split(':');
    parts[2] = Buffer.from('corrupted').toString('base64');
    expect(() => service.decrypt(parts.join(':'))).toThrow();
  });

  it('clé de mauvaise longueur throw une erreur', () => {
    configService.get.mockReturnValue('cle-trop-courte');
    expect(() => service.encrypt('test')).toThrow(
      'ENCRYPTION_KEY doit être exactement 32 caractères',
    );
  });
});
