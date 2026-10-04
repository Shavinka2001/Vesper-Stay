import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  decryptWithKey,
  encryptWithKey,
  parseEncryptionKey,
} from '@common/crypto/secret-cipher';

/**
 * Injectable wrapper over the secret cipher. Loads the key once from
 * CREDENTIALS_ENC_KEY. If no key is configured the service stays "unavailable"
 * rather than crashing the app — callers check `isAvailable` and refuse to
 * store secrets with a clear message instead.
 */
@Injectable()
export class SecretCipherService {
  private readonly logger = new Logger(SecretCipherService.name);
  private readonly key: Buffer | null;

  constructor(config: ConfigService) {
    const raw = config.get<string>('CREDENTIALS_ENC_KEY');
    let key: Buffer | null = null;
    try {
      key = parseEncryptionKey(raw);
    } catch {
      this.logger.warn(
        'CREDENTIALS_ENC_KEY not configured — secret encryption disabled',
      );
    }
    this.key = key;
  }

  get isAvailable(): boolean {
    return this.key !== null;
  }

  encrypt(plaintext: string): string {
    if (!this.key) {
      throw new Error('Encryption key not configured');
    }
    return encryptWithKey(plaintext, this.key);
  }

  decrypt(blob: string): string {
    if (!this.key) {
      throw new Error('Encryption key not configured');
    }
    return decryptWithKey(blob, this.key);
  }
}
