import { Controller, Get, Post, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
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

export class ChatDto {
  @IsString()
  question: string;

  @IsString()
  childId: string;
}

export class ChildChatDto {
  @IsString()
  question: string;
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

  @Get('children/:childId')
  @ApiOperation({ summary: 'Get detailed data for a specific child' })
  getChildDetail(
    @CurrentUser('userId') guardianId: string,
    @Param('childId') childId: string,
  ) {
    return this.guardianService.getChildDetail(guardianId, childId);
  }

  @Post('children')
  @ApiOperation({ summary: 'Add a child account linked to the logged-in guardian' })
  addChild(
    @CurrentUser('userId') guardianId: string,
    @Body() dto: AddChildDto,
  ) {
    return this.guardianService.addChild(guardianId, dto.childName, dto.childPassword, dto.age);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Ask AI a question about child progress (RAG-based)' })
  chat(
    @CurrentUser('userId') guardianId: string,
    @Body() dto: ChatDto,
  ) {
    return this.guardianService.chatWithContext(guardianId, dto.childId, dto.question);
  }

  @Post('child-chat')
  @ApiOperation({ summary: 'Child asks motivational question to AI (uses own profile)' })
  childChat(
    @CurrentUser('userId') childId: string,
    @Body() dto: ChildChatDto,
  ) {
    return this.guardianService.childChatWithContext(childId, dto.question);
  }
}
