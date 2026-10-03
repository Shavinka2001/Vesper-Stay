import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiHeader,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { PropertyId } from '@common/decorators/property-id.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PropertyScopeGuard } from '@common/guards/property-scope.guard';
import { ChannelManagerService } from '@modules/channel-manager/channel-manager.service';
import { CreateChannelConnectionDto } from '@modules/channel-manager/dto/create-channel-connection.dto';
import { UpdateChannelConnectionDto } from '@modules/channel-manager/dto/update-channel-connection.dto';

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
  constructor(private readonly channelManagerService: ChannelManagerService) {}

  @Get('status')
  @ApiOperation({ summary: 'OTA channel connection status for a property' })
  getStatus(@PropertyId() propertyId: string) {
    return this.channelManagerService.getStatus(propertyId);
  }

  @Get('connections')
  @ApiOperation({ summary: 'List channel connections' })
  listConnections(@PropertyId() propertyId: string) {
    return this.channelManagerService.listConnections(propertyId);
  }

  @Post('connections')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Connect an OTA channel (iCal import/export)' })
  createConnection(
    @PropertyId() propertyId: string,
    @Body() dto: CreateChannelConnectionDto,
  ) {
    return this.channelManagerService.createConnection(propertyId, dto);
  }

  @Patch('connections/:id')
  @ApiOperation({ summary: 'Update a channel connection' })
  updateConnection(
    @PropertyId() propertyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChannelConnectionDto,
  ) {
    return this.channelManagerService.updateConnection(propertyId, id, dto);
  }

  @Delete('connections/:id')
  @ApiOperation({ summary: 'Remove a channel connection' })
  deleteConnection(
    @PropertyId() propertyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.channelManagerService.deleteConnection(propertyId, id);
  }

  @Post('connections/:id/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pull the external iCal feed now and block matching dates',
  })
  syncConnection(
    @PropertyId() propertyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.channelManagerService.syncConnection(propertyId, id);
  }
}

/**
 * Public iCal export feed — no auth. OTAs subscribe to this URL to read our
 * busy dates. The room UUID in the path is the feed secret; the payload carries
 * no guest PII (every block is just "Reserved").
 */
@ApiTags('Channel Manager')
@Controller('channel-manager/ical')
export class ChannelIcalController {
  constructor(private readonly channelManagerService: ChannelManagerService) {}

  @Get('export/:roomId')
  @ApiExcludeEndpoint()
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Header('Content-Disposition', 'inline; filename="vesperstay.ics"')
  @Header('Cache-Control', 'public, max-age=300')
  exportRoomFeed(@Param('roomId') roomId: string): Promise<string> {
    // The feed URL ends in ".ics"; strip it to recover the room id.
    const id = roomId.replace(/\.ics$/i, '');
    return this.channelManagerService.buildRoomExportFeed(id);
  }
}
