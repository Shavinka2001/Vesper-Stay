import { Global, Module } from '@nestjs/common';
import { SecretCipherService } from '@common/crypto/secret-cipher.service';

/** Global so any module can inject SecretCipherService for secrets at rest. */
@Global()
@Module({
  providers: [SecretCipherService],
  exports: [SecretCipherService],
})
export class CryptoModule {}
