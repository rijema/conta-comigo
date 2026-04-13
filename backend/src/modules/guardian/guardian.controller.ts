import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GuardianService } from './guardian.service';

@ApiTags('guardian')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('guardian')
export class GuardianController {
  constructor(private readonly guardianService: GuardianService) {}

  @Get('children-summary')
  @ApiOperation({ summary: 'Get summary of all children for the logged-in guardian' })
  getChildrenSummary(@CurrentUser('userId') userId: string) {
    return this.guardianService.getChildrenSummary(userId);
  }
}
