import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../../activities/entities/activity.entity';
import { OntologyService } from '../../ontology/ontology.service';
import { HybridRecommendationService } from '../../ade/hybrid-recommendation.service';
import { StudentSkillState } from '../../knowledge-tracing/entities/student-skill-state.entity';
import { LearningEvent } from '../entities/learning-event.entity';
import { ReviewType } from '../entities/review-assignment.entity';

export interface ReviewActivitySelection {
  templateId: string;
  instanceId: string;
  activity: Activity;
  reviewType: ReviewType;
  reason: string;
  instanceComparison: 'EXACT_REPEAT' | 'EQUIVALENT_INSTANCE' | 'DIFFICULTY_PROGRESSION' | 'DIFFICULTY_SUPPORT' | 'UNVERIFIED';
}

export interface LearnerProfile {
  studentId: string;
  accessibilityNeeds?: {
    sensoryLoad?: 'low' | 'medium' | 'high';
    motorDemand?: 'low' | 'medium' | 'high';
    languageLoad?: 'low' | 'medium' | 'high';
  };
  preferredModalities?: string[];
  professionalConstraints?: string[];
}

@Injectable()
export class ReviewSelectionService {
  private readonly logger = new Logger(ReviewSelectionService.name);

  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(LearningEvent)
    private readonly eventRepository: Repository<LearningEvent>,
    @InjectRepository(StudentSkillState)
    private readonly skillStateRepository: Repository<StudentSkillState>,
    private readonly ontologyService: OntologyService,
    private readonly hybridRecommendationService: HybridRecommendationService,
  ) {}

  /**
   * Select review activity for a skill based on review type
   */
  async selectReviewActivity(
    studentId: string,
    skillId: string,
    reviewType: ReviewType,
    learnerProfile: LearnerProfile,
  ): Promise<ReviewActivitySelection> {
    // Step 1: Get eligible activities for this skill
    const candidates = await this.getEligibleActivities(skillId);

    if (candidates.length === 0) {
      throw new Error(`No eligible activities found for skill ${skillId}`);
    }

    // Step 2: Apply semantic filtering (hard blocks)
    const semanticallyValid = await this.applySemanticFiltering(candidates, learnerProfile);

    if (semanticallyValid.length === 0) {
      throw new Error(`No semantically valid activities for skill ${skillId}`);
    }

    // Step 3: Filter by review purpose
    const purposeFiltered = this.filterByReviewPurpose(semanticallyValid, reviewType);

    if (purposeFiltered.length === 0) {
      throw new Error(`No activities suitable for ${reviewType} review of skill ${skillId}`);
    }

    // Step 4: Rank by review purpose
    const ranked = await this.rankByReviewType(studentId, purposeFiltered, reviewType);

    // Step 5: Select top candidate
    const selected = ranked[0];

    // Step 6: Generate or select instance
    const instanceComparison = await this.selectInstance(studentId, selected.id, reviewType);

    return {
      templateId: selected.id,
      instanceId: instanceComparison.instanceId,
      activity: instanceComparison.activity,
      reviewType,
      reason: `Selected for ${reviewType} review`,
      instanceComparison: instanceComparison.type,
    };
  }

  /**
   * Get eligible activities for a skill
   * skillId is a UUID referring to StudentSkillState.skillId
   * Must resolve to BNCC code before matching Activity.bnccSkills
   */
  private async getEligibleActivities(skillId: string): Promise<Activity[]> {
    // TODO: Resolve skillId UUID to BNCC code via skill entity lookup
    // For now, use the skillId directly if it's already a BNCC code
    // This is a placeholder that must be fixed with proper skill resolution
    return this.activityRepository.find({
      where: {
        bnccSkills: skillId as any, // Will be fixed to proper BNCC code resolution
        isActive: true,
      },
    });
  }

  /**
   * Apply semantic filtering based on learner profile (hard blocks)
   */
  private async applySemanticFiltering(candidates: Activity[], profile: LearnerProfile): Promise<Activity[]> {
    return candidates.filter((activity) => {
      // Hard blocks for accessibility
      if (profile.accessibilityNeeds?.sensoryLoad === 'low') {
        const sensoryLoad = (activity as any).accessibility?.sensoryLoad;
        if (sensoryLoad === 'high') return false;
      }

      if (profile.accessibilityNeeds?.motorDemand === 'low') {
        const motorDemand = (activity as any).content?.semantic?.motorDemand;
        if (motorDemand === 'high') return false;
      }

      if (profile.accessibilityNeeds?.languageLoad === 'low') {
        const languageLoad = (activity as any).content?.semantic?.languageLoad;
        if (languageLoad === 'high') return false;
      }

      // Professional constraints
      if (profile.professionalConstraints?.includes(activity.id)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Filter activities by review purpose
   */
  private filterByReviewPurpose(candidates: Activity[], reviewType: ReviewType): Activity[] {
    // For now, all semantically valid activities are eligible for any review purpose
    // In future, could add more specific filtering based on activity properties
    return candidates;
  }

  /**
   * Rank activities by review type using HybridRecommendationService
   */
  private async rankByReviewType(studentId: string, candidates: Activity[], reviewType: ReviewType): Promise<Activity[]> {
    // For REMEDIATION: prioritize easier/scaffolded versions
    // For RETENTION: prioritize same difficulty
    // For GENERALIZATION: prioritize same or slightly harder difficulty

    const difficultyOrder = {
      very_easy: 0,
      easy: 1,
      medium: 2,
      hard: 3,
      extreme: 4,
    };

    return candidates.sort((a, b) => {
      const aDiff = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] ?? 2;
      const bDiff = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] ?? 2;

      if (reviewType === ReviewType.REMEDIATION) {
        // Prefer easier activities for remediation
        return aDiff - bDiff;
      } else if (reviewType === ReviewType.RETENTION) {
        // Prefer same difficulty for retention
        return Math.abs(aDiff - 2) - Math.abs(bDiff - 2);
      } else {
        // GENERALIZATION: prefer same or slightly harder
        return Math.abs(aDiff - 2) - Math.abs(bDiff - 2);
      }
    });
  }

  /**
   * Select activity instance for review
   * 
   * RESEARCH DATA CORRECTNESS:
   * - Must return a REAL persisted Activity ID (not generated/fake)
   * - EXACT_REPEAT: same activity as baseline
   * - EQUIVALENT_INSTANCE: different persisted activity, same BNCC skill, comparable difficulty
   * - UNVERIFIED: cannot verify equivalence
   * - Never generates fake activity IDs
   */
  private async selectInstance(
    studentId: string,
    templateId: string,
    reviewType: ReviewType,
  ): Promise<{ instanceId: string; activity: Activity; type: 'EXACT_REPEAT' | 'EQUIVALENT_INSTANCE' | 'DIFFICULTY_PROGRESSION' | 'DIFFICULTY_SUPPORT' | 'UNVERIFIED' }> {
    const template = await this.activityRepository.findOne({ where: { id: templateId } });

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Get recent interactions with this template
    const recentInteractions = await this.eventRepository.find({
      where: {
        studentId,
        activityId: templateId,
      },
      order: { timestamp: 'DESC' },
      take: 5,
    });

    // Determine instance comparison type
    let comparisonType: 'EXACT_REPEAT' | 'EQUIVALENT_INSTANCE' | 'DIFFICULTY_PROGRESSION' | 'DIFFICULTY_SUPPORT' | 'UNVERIFIED' = 'UNVERIFIED';
    let selectedActivity = template;

    if (recentInteractions.length > 0) {
      // Child has seen this activity before
      comparisonType = 'EXACT_REPEAT';
    } else {
      // TODO: In future, search for different persisted activities with:
      // - same BNCC skill
      // - comparable pedagogical difficulty
      // If found and verified equivalent: EQUIVALENT_INSTANCE
      // Otherwise: UNVERIFIED
      comparisonType = 'UNVERIFIED';
    }

    return {
      instanceId: selectedActivity.id, // REAL persisted Activity ID
      activity: selectedActivity,
      type: comparisonType,
    };
  }
}
