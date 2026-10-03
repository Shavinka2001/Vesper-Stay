import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestUser } from '@common/interfaces/authenticated-request.interface';

export const CurrentUser = createParamDecorator(
  (
    data: keyof RequestUser | undefined,
    ctx: ExecutionContext,
  ): RequestUser | RequestUser[keyof RequestUser] | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;

    if (!user) {
      return undefined;
    }

    return data ? user[data] : user;
  },
);
