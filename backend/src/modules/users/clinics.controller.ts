import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from './enums/user-role.enum';
import { ClinicsService } from './services/clinics.service';

export class ClaimClinicDto {
  @IsString()
  @MaxLength(255)
  name: string;
}

@ApiTags('clinics')
@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Get()
  @ApiOperation({ summary: 'List registered clinics (id and name only) for the guardian sign-up' })
  list() {
    return this.clinicsService.listForSelection();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clinic linked to the logged-in user' })
  mine(@CurrentUser('userId') userId: string) {
    return this.clinicsService.getForUser(userId);
  }

  @Post('claim')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register the clinic of a professional who has none yet (e.g. Google sign-up)' })
  async claim(@CurrentUser('userId') userId: string, @Body() dto: ClaimClinicDto) {
    const clinic = await this.clinicsService.claimForProfessional(userId, dto.name);
    return { id: clinic.id, name: clinic.name };
  }
}
