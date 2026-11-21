import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Post,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateChildProfileDto } from './dto/update-child-profile.dto';
import { UserRole } from './enums/user-role.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LearnerScoped } from './guards/learner-access.guard';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Every user in the system: admin only (professionals list their clinic's
  // children through GET /educator/learners).
  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @LearnerScoped('id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get(':id/child-profile')
  @LearnerScoped('id')
  getChildProfile(@Param('id') id: string) {
    return this.usersService.getChildProfile(id);
  }

  @Put(':id/child-profile')
  @LearnerScoped('id')
  updateChildProfile(
    @Param('id') id: string,
    @Body() dto: UpdateChildProfileDto,
  ) {
    return this.usersService.updateChildProfile(id, dto);
  }

  @Post(':id/lgpd-consent')
  @HttpCode(HttpStatus.NO_CONTENT)
  async grantConsent(@Param('id') id: string, @CurrentUser() user: any) {
    // A user may only grant LGPD consent for their own account — without
    // this check, any authenticated user could pass another user's id and
    // silently mark their consent as given.
    if (user.userId !== id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only grant consent for your own account');
    }
    return this.usersService.grantLgpdConsent(id);
  }

  @Post(':id/anonymize')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async anonymize(@Param('id') id: string) {
    return this.usersService.anonymizeUser(id);
  }
}