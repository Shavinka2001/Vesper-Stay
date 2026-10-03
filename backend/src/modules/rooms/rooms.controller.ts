import {
  Body,
  Controller,
  Delete,
  Get,
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
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PropertyId } from '@common/decorators/property-id.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PropertyScopeGuard } from '@common/guards/property-scope.guard';
import { CreateRoomDto } from '@modules/rooms/dto/create-room.dto';
import { CreateRoomTypeDto } from '@modules/rooms/dto/create-room-type.dto';
import { UpdateRoomStatusDto } from '@modules/rooms/dto/update-room-status.dto';
import { UpdateRoomTypeDto } from '@modules/rooms/dto/update-room-type.dto';
import { RoomsService } from '@modules/rooms/rooms.service';

@ApiTags('Rooms')
@ApiBearerAuth()
@ApiSecurity('property-id')
@ApiHeader({
  name: 'x-property-id',
  description: 'Active property (tenant) id',
  required: true,
})
@ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
@UseGuards(JwtAuthGuard, PropertyScopeGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @ApiOperation({
    summary: 'List rooms grouped by room type with live housekeeping status',
  })
  @ApiOkResponse({ description: 'Rooms grouped by room type' })
  getRoomsByProperty(@PropertyId() propertyId: string) {
    return this.roomsService.getRoomsByProperty(propertyId);
  }

  @Get('types')
  @ApiOperation({ summary: 'List room types for the active property' })
  @ApiOkResponse({ description: 'Room type catalog' })
  getRoomTypes(@PropertyId() propertyId: string) {
    return this.roomsService.getRoomTypes(propertyId);
  }

  @Post('types')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a room type / category' })
  @ApiCreatedResponse({ description: 'Room type created' })
  createRoomType(
    @PropertyId() propertyId: string,
    @Body() dto: CreateRoomTypeDto,
  ) {
    return this.roomsService.createRoomType(propertyId, dto);
  }

  @Patch('types/:id')
  @ApiOperation({ summary: 'Update a room type' })
  @ApiOkResponse({ description: 'Room type updated' })
  updateRoomType(
    @PropertyId() propertyId: string,
    @Param('id', ParseUUIDPipe) roomTypeId: string,
    @Body() dto: UpdateRoomTypeDto,
  ) {
    return this.roomsService.updateRoomType(propertyId, roomTypeId, dto);
  }

  @Delete('types/:id')
  @ApiOperation({ summary: 'Soft-delete a room type (no active rooms allowed)' })
  @ApiOkResponse({ description: 'Room type deactivated' })
  deleteRoomType(
    @PropertyId() propertyId: string,
    @Param('id', ParseUUIDPipe) roomTypeId: string,
  ) {
    return this.roomsService.deleteRoomType(propertyId, roomTypeId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new room or cabana for the property' })
  @ApiCreatedResponse({ description: 'Room created' })
  createRoom(
    @PropertyId() propertyId: string,
    @Body() dto: CreateRoomDto,
  ) {
    return this.roomsService.createRoom(propertyId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update room housekeeping / maintenance status',
  })
  @ApiOkResponse({ description: 'Room status updated' })
  updateRoomStatus(
    @PropertyId() propertyId: string,
    @Param('id', ParseUUIDPipe) roomId: string,
    @Body() dto: UpdateRoomStatusDto,
  ) {
    return this.roomsService.updateRoomStatus(propertyId, roomId, dto.status);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Soft-delete a physical room (blocked if active bookings exist)',
  })
  @ApiOkResponse({ description: 'Room deactivated' })
  deleteRoom(
    @PropertyId() propertyId: string,
    @Param('id', ParseUUIDPipe) roomId: string,
  ) {
    return this.roomsService.deleteRoom(propertyId, roomId);
  }
}
