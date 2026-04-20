import * as crypto from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionService {
  constructor(private readonly configService: ConfigService) {}

  private get key(): Buffer {
    const k = this.configService.get<string>('encryption.key', '');
    const keyBuffer = Buffer.from(k, 'utf-8');
    if (keyBuffer.length !== 32) {
      throw new Error('ENCRYPTION_KEY doit produire exactement 32 octets (AES-256)');
    }
    return keyBuffer;
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf-8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return [iv, tag, encrypted].map((b) => b.toString('base64')).join(':');
  }

  decrypt(encoded: string): string {
    const parts = encoded.split(':');
    if (parts.length !== 3) {
      throw new Error('Format de données chiffrées invalide');
    }
    const [ivB64, tagB64, ciphertextB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const ciphertext = Buffer.from(ciphertextB64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(ciphertext).toString('utf-8') + decipher.final('utf-8');
  }
}
