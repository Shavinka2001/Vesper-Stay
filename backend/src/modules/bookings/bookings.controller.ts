import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { PropertyId } from '@common/decorators/property-id.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PropertyScopeGuard } from '@common/guards/property-scope.guard';
import type { RequestUser } from '@common/interfaces/authenticated-request.interface';
import { BookingsService } from '@modules/bookings/bookings.service';
import { CheckInDto } from '@modules/bookings/dto/check-in.dto';
import { CheckOutDto } from '@modules/bookings/dto/check-out.dto';
import { CreateBookingDto } from '@modules/bookings/dto/create-booking.dto';
import { TimelineQueryDto } from '@modules/bookings/dto/timeline-query.dto';
import { UpdateBookingStatusDto } from '@modules/bookings/dto/update-booking-status.dto';

@ApiTags('Bookings')
@ApiBearerAuth()
@ApiSecurity('property-id')
@ApiHeader({
  name: 'x-property-id',
  description: 'Active property (tenant) id',
  required: true,
})
@ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
@UseGuards(JwtAuthGuard, PropertyScopeGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'List recent bookings for front-desk queue' })
  @ApiOkResponse({ description: 'Bookings list' })
  list(@PropertyId() propertyId: string) {
    return this.bookingsService.listBookings(propertyId);
  }

  @Get('timeline')
  @ApiOperation({
    summary: 'Front-desk tape chart: active bookings in a date window',
  })
  @ApiOkResponse({ description: 'Timeline bookings for the property' })
  getTimeline(
    @PropertyId() propertyId: string,
    @Query() query: TimelineQueryDto,
  ) {
    return this.bookingsService.getBookingsTimeline(
      propertyId,
      query.startDate,
      query.endDate,
    );
  }

  @Get('metrics')
  @ApiOperation({
    summary:
      "Dashboard metrics: today's arrivals, departures, in-house, occupancy, revenue",
  })
  @ApiOkResponse({ description: 'Front-desk dashboard KPIs' })
  getMetrics(@PropertyId() propertyId: string) {
    return this.bookingsService.getDashboardMetrics(propertyId);
  }

  @Get(':id/folio')
  @ApiOperation({ summary: 'Live guest folio with room + POS charges' })
  @ApiOkResponse({ description: 'Folio breakdown' })
  getFolio(
    @PropertyId() propertyId: string,
    @Param('id', ParseUUIDPipe) bookingId: string,
  ) {
    return this.bookingsService.getFolio(propertyId, bookingId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Create a booking with conflict-safe transactional availability check',
  })
  @ApiCreatedResponse({ description: 'Booking created' })
  createBooking(
    @PropertyId() propertyIdFromHeader: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateBookingDto,
  ) {
    const propertyId =
      propertyIdFromHeader?.trim() ||
      user.propertyId ||
      user.propertyIds[0] ||
      null;

    if (!propertyId) {
      throw new BadRequestException(
        'Missing property scope. Set x-property-id or ensure the user has a property membership.',
      );
    }

    return this.bookingsService.createBooking(propertyId, dto);
  }

  @Post(':id/check-in')
  @ApiOperation({
    summary:
      'Complete CRM check-in, collect deposit, occupy room, prepare WhatsApp welcome',
  })
  @ApiOkResponse({ description: 'Guest checked in with WhatsApp payload' })
  checkIn(
    @PropertyId() propertyId: string,
    @Param('id', ParseUUIDPipe) bookingId: string,
    @Body() dto: CheckInDto,
  ) {
    return this.bookingsService.checkIn(propertyId, bookingId, dto);
  }

  @Post(':id/check-out')
  @ApiOperation({
    summary:
      'Settle folio, check out guest, mark room dirty, prepare WhatsApp invoice',
  })
  @ApiOkResponse({ description: 'Guest checked out with folio + WhatsApp' })
  checkOut(
    @PropertyId() propertyId: string,
    @Param('id', ParseUUIDPipe) bookingId: string,
    @Body() dto: CheckOutDto,
  ) {
    return this.bookingsService.checkOut(propertyId, bookingId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary:
      'Update booking status (check-in / check-out / cancel) and sync room status',
  })
  @ApiOkResponse({ description: 'Booking status updated' })
  updateStatus(
    @PropertyId() propertyId: string,
    @Param('id', ParseUUIDPipe) bookingId: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(propertyId, bookingId, dto.status);
  }
}
