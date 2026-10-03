import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { PaymentMethod } from '@generated/prisma/client';

const SETTLE_METHODS = [
  PaymentMethod.CASH,
  PaymentMethod.CARD,
  PaymentMethod.BANK_TRANSFER,
  PaymentMethod.ONLINE,
] as const;

export class CheckOutDto {
  @ApiPropertyOptional({
    example: 250,
    description: 'Amount collected now to settle remaining balance',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  settleAmount?: number;

  @ApiPropertyOptional({
    enum: SETTLE_METHODS,
    example: PaymentMethod.CARD,
  })
  @IsOptional()
  @IsEnum(SETTLE_METHODS)
  paymentMethod?: (typeof SETTLE_METHODS)[number];
}
