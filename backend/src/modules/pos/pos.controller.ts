import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { CreateMenuItemDto } from '@modules/pos/dto/create-menu-item.dto';
import { CreatePosOrderDto } from '@modules/pos/dto/create-pos-order.dto';
import { PosService } from '@modules/pos/pos.service';

@ApiTags('POS')
@ApiBearerAuth()
@ApiSecurity('property-id')
@ApiHeader({
  name: 'x-property-id',
  description: 'Active property (tenant) id',
  required: true,
})
@ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
@UseGuards(JwtAuthGuard, PropertyScopeGuard)
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Get('menu')
  @ApiOperation({ summary: 'Fetch menu items categorized for POS' })
  @ApiOkResponse({ description: 'Menu catalog' })
  getMenuItems(@PropertyId() propertyId: string) {
    return this.posService.getMenuItems(propertyId);
  }

  @Post('menu')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a menu item' })
  @ApiCreatedResponse({ description: 'Menu item created' })
  createMenuItem(
    @PropertyId() propertyId: string,
    @Body() dto: CreateMenuItemDto,
  ) {
    return this.posService.createMenuItem(propertyId, dto);
  }

  @Get('in-house')
  @ApiOperation({
    summary: 'List in-house / checked-in rooms for charge-to-room settlement',
  })
  @ApiOkResponse({ description: 'Active folios' })
  getInHouse(@PropertyId() propertyId: string) {
    return this.posService.getInHouseFolios(propertyId);
  }

  @Get('orders')
  @ApiOperation({ summary: "Today's POS orders and sales total" })
  @ApiOkResponse({ description: 'Orders history for today' })
  getOrders(@PropertyId() propertyId: string) {
    return this.posService.getOrders(propertyId);
  }

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Place a POS order (cash, card, or charge to in-house room folio)',
  })
  @ApiCreatedResponse({ description: 'Order created' })
  createOrder(
    @PropertyId() propertyId: string,
    @Body() dto: CreatePosOrderDto,
  ) {
    return this.posService.createOrder(propertyId, dto);
  }
}
