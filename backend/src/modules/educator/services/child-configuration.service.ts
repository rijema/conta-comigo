import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChildProfile } from '../../users/entities/child-profile.entity';
import { User } from '../../users/entities/user.entity';
import {
  UpdateChildSupportLevelDto,
  UpdateChildModalityPreferencesDto,
} from '../dto/update-child-support-level.dto';

@Injectable()
export class ChildConfigurationService {
  constructor(
    @InjectRepository(ChildProfile)
    private childProfileRepository: Repository<ChildProfile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Update ASD support level for a child
   * Only the assigned educator can update this
   */
  async updateSupportLevel(
    childId: string,
    educatorId: string,
    dto: UpdateChildSupportLevelDto,
  ): Promise<ChildProfile> {
    // Verify child exists
    const child = await this.userRepository.findOne({
      where: { id: childId },
    });

    if (!child) {
      throw new NotFoundException('Criança não encontrada');
    }

    // Verify educator has permission (should be assigned to this child)
    // TODO: Implement proper permission check based on educator-child assignment

    // Get or create child profile
    let profile = await this.childProfileRepository.findOne({
      where: { userId: childId },
    });

    if (!profile) {
      profile = this.childProfileRepository.create({
        userId: childId,
      });
    }

    // Update support level
    profile.asdSupportLevel = dto.supportLevel;
    profile.updatedAt = new Date();

    return this.childProfileRepository.save(profile);
  }

  /**
   * Update modality preferences (strengths and difficulties)
   * These are set by the educator based on observations
   */
  async updateModalityPreferences(
    childId: string,
    educatorId: string,
    dto: UpdateChildModalityPreferencesDto,
  ): Promise<ChildProfile> {
    // Verify child exists
    const child = await this.userRepository.findOne({
      where: { id: childId },
    });

    if (!child) {
      throw new NotFoundException('Criança não encontrada');
    }

    // Get or create child profile
    let profile = await this.childProfileRepository.findOne({
      where: { userId: childId },
    });

    if (!profile) {
      profile = this.childProfileRepository.create({
        userId: childId,
      });
    }

    // Update strengths based on preferences
    if (dto.visual || dto.auditive || dto.logical || dto.motor || dto.sensory) {
      profile.strengths = {
        visual: dto.visual?.strength ?? profile.strengths?.visual,
        auditive: dto.auditive?.strength ?? profile.strengths?.auditive,
        logical: dto.logical?.strength ?? profile.strengths?.logical,
        motor: dto.motor?.strength ?? profile.strengths?.motor,
        sensory: dto.sensory?.strength ?? profile.strengths?.sensory,
      };

      // Update weaknesses (difficulties)
      profile.weaknesses = {
        visual:
          dto.visual?.difficulty === 'difficulty'
            ? true
            : profile.weaknesses?.visual,
        auditive:
          dto.auditive?.difficulty === 'difficulty'
            ? true
            : profile.weaknesses?.auditive,
        logical:
          dto.logical?.difficulty === 'difficulty'
            ? true
            : profile.weaknesses?.logical,
        motor:
          dto.motor?.difficulty === 'difficulty'
            ? true
            : profile.weaknesses?.motor,
        sensory:
          dto.sensory?.difficulty === 'difficulty'
            ? true
            : profile.weaknesses?.sensory,
      };
    }

    profile.updatedAt = new Date();
    return this.childProfileRepository.save(profile);
  }

  /**
   * Get current configuration for a child
   */
  async getChildConfiguration(childId: string): Promise<ChildProfile | null> {
    return this.childProfileRepository.findOne({
      where: { userId: childId },
    });
  }

  /**
   * Reset all preferences to default (neutral)
   */
  async resetPreferences(childId: string): Promise<ChildProfile> {
    let profile = await this.childProfileRepository.findOne({
      where: { userId: childId },
    });

    if (!profile) {
      profile = this.childProfileRepository.create({
        userId: childId,
      });
    }

    profile.strengths = {
      visual: false,
      auditive: false,
      logical: false,
      motor: false,
      sensory: false,
    };

    profile.weaknesses = {
      visual: false,
      auditive: false,
      logical: false,
      motor: false,
      sensory: false,
    };

    profile.asdSupportLevel = 'mild';
    profile.updatedAt = new Date();

    return this.childProfileRepository.save(profile);
  }

  /**
   * Bulk update preferences for multiple children
   * Useful for educators managing multiple students
   */
  async bulkUpdatePreferences(
    childIds: string[],
    dto: UpdateChildModalityPreferencesDto,
  ): Promise<ChildProfile[]> {
    const profiles = await this.childProfileRepository.find({
      where: childIds.map((id) => ({ userId: id })),
    });

    const updated = profiles.map((profile) => {
      if (dto.visual || dto.auditive || dto.logical || dto.motor || dto.sensory) {
        profile.strengths = {
          visual: dto.visual?.strength ?? profile.strengths?.visual,
          auditive: dto.auditive?.strength ?? profile.strengths?.auditive,
          logical: dto.logical?.strength ?? profile.strengths?.logical,
          motor: dto.motor?.strength ?? profile.strengths?.motor,
          sensory: dto.sensory?.strength ?? profile.strengths?.sensory,
        };

        profile.weaknesses = {
          visual:
            dto.visual?.difficulty === 'difficulty'
              ? true
              : profile.weaknesses?.visual,
          auditive:
            dto.auditive?.difficulty === 'difficulty'
              ? true
              : profile.weaknesses?.auditive,
          logical:
            dto.logical?.difficulty === 'difficulty'
              ? true
              : profile.weaknesses?.logical,
          motor:
            dto.motor?.difficulty === 'difficulty'
              ? true
              : profile.weaknesses?.motor,
          sensory:
            dto.sensory?.difficulty === 'difficulty'
              ? true
              : profile.weaknesses?.sensory,
        };
      }

      profile.updatedAt = new Date();
      return profile;
    });

    return this.childProfileRepository.save(updated);
  }
}
