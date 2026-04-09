import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ChildProfile } from './entities/child-profile.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, ChildProfile])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}