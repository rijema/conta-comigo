Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateChildProfileDto } from './dto/update-child-profile.dto';
import { UserRole } from './enums/user-role.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PROFESSIONAL)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get(':id/child-profile')
  getChildProfile(@Param('id') id: string) {
    return this.usersService.getChildProfile(id);
  }

  @Put(':id/child-profile')
  updateChildProfile(
    @Param('id') id: string,
    @Body() dto: UpdateChildProfileDto,
  ) {
    return this.usersService.updateChildProfile(id, dto);
  }

  @Post(':id/lgpd-consent')
  @HttpCode(HttpStatus.NO_CONTENT)
  async grantConsent(@Param('id') id: string) {
    return this.usersService.grantLgpdConsent(id);
  }

  @Post(':id/anonymize')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async anonymize(@Param('id') id: string) {
    return this.usersService.anonymizeUser(id);
  }
}