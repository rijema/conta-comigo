import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CycleManagementService } from './services/cycle-management.service';

@ApiTags('Cycles')
@Controller('cycles')
@UseGuards(AuthGuard('jwt'))
export class CyclesController {
  constructor(private readonly cycleService: CycleManagementService) {}

  /**
   * Get current cycle progress and state
   * Returns: cycle position, completion status, next exercise
   */
  @Get(':islandId/:cycleNumber/progress')
  @ApiOperation({ summary: 'Get cycle progress (position, completion, next exercise)' })
  async getCycleProgress(
    @CurrentUser('userId') userId: string,
    @Param('islandId') islandId: string,
    @Param('cycleNumber') cycleNumber: number,
  ) {
    return this.cycleService.getCycleProgress(userId, islandId, cycleNumber);
  }

  /**
   * Get current cycle state (compact info)
   */
  @Get(':islandId/:cycleNumber')
  @ApiOperation({ summary: 'Get cycle state (status, position, skill)' })
  async getCycleState(
    @CurrentUser('userId') userId: string,
    @Param('islandId') islandId: string,
    @Param('cycleNumber') cycleNumber: number,
  ) {
    return this.cycleService.getCycleState(userId, islandId, cycleNumber);
  }
}

