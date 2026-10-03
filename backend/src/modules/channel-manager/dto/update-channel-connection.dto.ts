import { PartialType } from '@nestjs/swagger';
import { CreateChannelConnectionDto } from '@modules/channel-manager/dto/create-channel-connection.dto';

/** All fields optional — PATCH a connection. */
export class UpdateChannelConnectionDto extends PartialType(
  CreateChannelConnectionDto,
) {}
