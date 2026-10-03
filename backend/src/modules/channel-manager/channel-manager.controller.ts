import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { PropertyId } from '@common/decorators/property-id.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PropertyScopeGuard } from '@common/guards/property-scope.guard';
import { ChannelManagerService } from '@modules/channel-manager/channel-manager.service';

@ApiTags('Channel Manager')
@ApiBearerAuth()
@ApiSecurity('property-id')
@ApiHeader({
  name: 'x-property-id',
  description: 'Active property (tenant) id',
  required: true,
})
@UseGuards(JwtAuthGuard, PropertyScopeGuard)
@Controller('channel-manager')
export class ChannelManagerController {
  constructor(
    private readonly channelManagerService: ChannelManagerService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'OTA channel connection status for a property' })
  getStatus(@PropertyId() propertyId: string) {
    return this.channelManagerService.getStatus(propertyId);
  }
}
