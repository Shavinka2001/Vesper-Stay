import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import type { ApiSuccessResponse } from '@common/interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<T> | T>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T> | T> {
    const request = context.switchToHttp().getRequest<{ url?: string }>();
    const url = request.url ?? '';

    if (url.includes('/docs')) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // Auth (and similar) handlers may already return a success envelope.
        if (
          data !== null &&
          typeof data === 'object' &&
          'success' in data &&
          typeof (data as { success: unknown }).success === 'boolean'
        ) {
          return data;
        }

        return {
          success: true as const,
          data,
        };
      }),
    );
  }
}
