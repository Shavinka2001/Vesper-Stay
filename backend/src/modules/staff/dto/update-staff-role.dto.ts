import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { UserRole } from '@generated/prisma/client';
import {
  STAFF_ASSIGNABLE_ROLES,
  type StaffAssignableRole,
} from '@modules/staff/dto/create-staff.dto';

export class UpdateStaffRoleDto {
  @ApiProperty({
    enum: STAFF_ASSIGNABLE_ROLES,
    example: UserRole.MANAGER,
  })
  @IsIn(STAFF_ASSIGNABLE_ROLES)
  role!: StaffAssignableRole;
}
