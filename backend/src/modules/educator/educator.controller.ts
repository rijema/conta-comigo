import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EducatorService } from './educator.service';

@ApiTags('educator')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('educator')
export class EducatorController {
  constructor(private readonly educatorService: EducatorService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get educator dashboard stats with learner profiles' })
  getStats() {
    return this.educatorService.getStats();
  }
}
