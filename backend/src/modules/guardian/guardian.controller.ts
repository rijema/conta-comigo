import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString, MinLength, IsInt, Min, Max } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GuardianService } from './guardian.service';

export class AddChildDto {
  @IsString()
  childName: string;

  @IsInt()
  @Min(4)
  @Max(12)
  age: number;

  @IsString()
  @MinLength(4)
  childPassword: string;
}

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

  @Post('children')
  @ApiOperation({ summary: 'Add a child account linked to the logged-in guardian' })
  addChild(
    @CurrentUser('userId') guardianId: string,
    @Body() dto: AddChildDto,
  ) {
    return this.guardianService.addChild(guardianId, dto.childName, dto.childPassword, dto.age);
  }
}
