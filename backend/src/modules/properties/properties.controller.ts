import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { PropertyId } from '@common/decorators/property-id.decorator';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PropertyScopeGuard } from '@common/guards/property-scope.guard';
import { UpdateWhatsAppConfigDto } from '@modules/properties/dto/update-whatsapp-config.dto';
import { PropertiesService } from '@modules/properties/properties.service';

@ApiTags('Properties')
@ApiBearerAuth()
@ApiSecurity('property-id')
@ApiHeader({
  name: 'x-property-id',
  description: 'Active property (tenant) id',
  required: true,
})
@UseGuards(JwtAuthGuard, PropertyScopeGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @ApiOperation({ summary: 'List properties for the authenticated tenant scope' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.propertiesService.findAll(query);
  }

  @Get('whatsapp')
  @ApiOperation({ summary: 'Get the property WhatsApp config (token never returned)' })
  getWhatsApp(@PropertyId() propertyId: string) {
    return this.propertiesService.getWhatsAppConfig(propertyId);
  }

  @Patch('whatsapp')
  @ApiOperation({ summary: 'Update WhatsApp Cloud API credentials (token encrypted at rest)' })
  updateWhatsApp(
    @PropertyId() propertyId: string,
    @Body() dto: UpdateWhatsAppConfigDto,
  ) {
    return this.propertiesService.updateWhatsAppConfig(propertyId, dto);
  }
}
