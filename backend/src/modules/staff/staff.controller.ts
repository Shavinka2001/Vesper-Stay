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
import { UserRole } from '@generated/prisma/client';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { PropertyId } from '@common/decorators/property-id.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PropertyScopeGuard } from '@common/guards/property-scope.guard';
import type { RequestUser } from '@common/interfaces/authenticated-request.interface';
import { CreateStaffDto } from '@modules/staff/dto/create-staff.dto';
import { ResetStaffPasswordDto } from '@modules/staff/dto/reset-staff-password.dto';
import { ToggleStaffStatusDto } from '@modules/staff/dto/toggle-staff-status.dto';
import { UpdateStaffRoleDto } from '@modules/staff/dto/update-staff-role.dto';
import { StaffService } from '@modules/staff/staff.service';

@ApiTags('Staff')
@ApiBearerAuth()
@ApiSecurity('property-id')
@ApiHeader({
  name: 'x-property-id',
  description: 'Active property (tenant) id',
  required: true,
})
@ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
@Roles(UserRole.HOTEL_OWNER, UserRole.MANAGER)
@UseGuards(JwtAuthGuard, PropertyScopeGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @ApiOperation({ summary: 'List all staff members for the property' })
  @ApiOkResponse({ description: 'Staff roster' })
  getStaffMembers(@PropertyId() propertyId: string) {
    return this.staffService.getStaffMembers(propertyId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create / invite a staff member' })
  @ApiCreatedResponse({ description: 'Staff member created' })
  createStaffMember(
    @PropertyId() propertyId: string,
    @Body() dto: CreateStaffDto,
  ) {
    return this.staffService.createStaffMember(propertyId, dto);
  }

  @Patch(':staffId/status')
  @ApiOperation({ summary: 'Activate or deactivate staff login access' })
  @ApiOkResponse({ description: 'Updated staff member' })
  toggleStaffStatus(
    @PropertyId() propertyId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Body() dto: ToggleStaffStatusDto,
  ) {
    return this.staffService.toggleStaffStatus(
      propertyId,
      staffId,
      dto.isActive,
    );
  }

  @Patch(':staffId/role')
  @ApiOperation({ summary: 'Update staff member role' })
  @ApiOkResponse({ description: 'Updated staff member' })
  updateStaffRole(
    @PropertyId() propertyId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Body() dto: UpdateStaffRoleDto,
  ) {
    return this.staffService.updateStaffRole(propertyId, staffId, dto);
  }

  @Patch(':staffId/password')
  @ApiOperation({ summary: 'Reset staff temporary password' })
  @ApiOkResponse({ description: 'Password reset' })
  resetStaffPassword(
    @PropertyId() propertyId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Body() dto: ResetStaffPasswordDto,
  ) {
    return this.staffService.resetStaffPassword(propertyId, staffId, dto);
  }

  @Delete(':staffId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove staff access (cannot delete hotel owner)' })
  @ApiOkResponse({ description: 'Staff removed' })
  deleteStaffMember(
    @PropertyId() propertyId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.staffService.deleteStaffMember(
      propertyId,
      staffId,
      actor.id,
    );
  }
}
