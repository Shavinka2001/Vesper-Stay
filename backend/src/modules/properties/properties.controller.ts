import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { PropertiesService } from '@modules/properties/properties.service';

@ApiTags('Properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @ApiOperation({ summary: 'List properties for the authenticated tenant scope' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.propertiesService.findAll(query);
  }
}
