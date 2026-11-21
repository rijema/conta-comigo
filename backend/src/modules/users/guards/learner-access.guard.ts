import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  applyDecorators,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LearnerAccessService } from '../services/learner-access.service';

const LEARNER_PARAM_KEY = 'learnerAccessParam';

/**
 * Route decorator: the request user must be allowed to access the learner
 * whose id is in the given route parameter (see LearnerAccessService).
 * Must run after JwtAuthGuard (declare it on the method, with JwtAuthGuard
 * on the controller).
 */
export function LearnerScoped(paramName: string) {
  return applyDecorators(
    SetMetadata(LEARNER_PARAM_KEY, paramName),
    UseGuards(LearnerAccessGuard),
  );
}

@Injectable()
export class LearnerAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly learnerAccess: LearnerAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const paramName = this.reflector.get<string>(LEARNER_PARAM_KEY, context.getHandler());
    if (!paramName) return true;
    const request = context.switchToHttp().getRequest();
    await this.learnerAccess.assertCanAccess(request.user, request.params?.[paramName]);
    return true;
  }
}
