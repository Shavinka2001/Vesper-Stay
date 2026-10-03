import { Module } from '@nestjs/common';
import { PropertiesController } from '@modules/properties/properties.controller';
import { PropertiesService } from '@modules/properties/properties.service';

@Module({
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
