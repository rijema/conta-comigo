import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../../activities/entities/activity.entity';
import { OntologyService } from '../../ontology/ontology.service';
import { HybridRecommendationService } from '../../ade/hybrid-recommendation.service';
import { RuntimeSemanticAdapter } from '../../ontology/runtime-semantic.adapter';
import { StudentSkillState } from '../../knowledge-tracing/entities/student-skill-state.entity';
import { BnccSkill } from '../../ontology/entities/bncc-skill.entity';
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
    @InjectRepository(BnccSkill)
    private readonly bnccSkillRepository: Repository<BnccSkill>,
    private readonly ontologyService: OntologyService,
    private readonly runtimeSemanticAdapter: RuntimeSemanticAdapter,
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
   * [INTEGRATION 2]: Real BNCC skill resolution
   * skillId is a UUID referring to StudentSkillState.skillId
   * Resolves to BNCC code before matching Activity.bnccSkills
   */
  private async getEligibleActivities(skillId: string): Promise<Activity[]> {
    // Resolve UUID skillId to BNCC code
    const bnccSkill = await this.bnccSkillRepository.findOne({
      where: { id: skillId },
    });

    if (!bnccSkill) {
      this.logger.warn(`BNCC skill not found for UUID: ${skillId}`);
      return [];
    }

    // Query activities by BNCC code using PostgreSQL JSONB contains
    return this.activityRepository.find({
      where: {
        bnccSkills: bnccSkill.code as any, // TypeORM JSONB array contains
        isActive: true,
      },
    });
  }

  /**
   * Apply semantic filtering using real OntologyService
   * [INTEGRATION 3B.1]: Uses actual semantic runtime, not local manual filter
   */
  private async applySemanticFiltering(candidates: Activity[], profile: LearnerProfile): Promise<Activity[]> {
    // Resolve BNCC code from skillId if available
    let bnccCode: string | null = null;
    if (candidates.length > 0 && candidates[0].bnccSkills && candidates[0].bnccSkills.length > 0) {
      bnccCode = candidates[0].bnccSkills[0];
    }

    if (!bnccCode) {
      this.logger.warn('Cannot determine BNCC code for semantic filtering');
      return candidates;
    }

    // Build hard constraints from learner profile
    const hardConstraints = {
      disallowDragging: profile.accessibilityNeeds?.motorDemand === 'low',
      requireAudio: false, // Not specified in profile
    };

    // Build observed learner evidence from profile
    const observedLearnerEvidence = {
      sensorystrength: profile.accessibilityNeeds?.sensoryLoad === 'low',
      motorweakness: profile.accessibilityNeeds?.motorDemand === 'low',
      languageweakness: profile.accessibilityNeeds?.languageLoad === 'low',
    };

    // [INTEGRATION 3B.1]: Use real RuntimeSemanticAdapter to materialize facts
    const facts = this.runtimeSemanticAdapter.materialize({
      studentId: profile.studentId,
      targetSkill: bnccCode,
      activities: candidates,
      masteryProbability: null, // Will be populated from StudentSkillState if needed
      recentAccuracy: null,
      observedLearnerEvidence,
      hardConstraints,
    });

    // [INTEGRATION 3B.1]: Use actual OntologyService semantic validation
    const semanticResult = this.ontologyService.getValidActivityCandidates(facts);
    const validIds = new Set(semanticResult.validCandidateIds);

    // Filter to only semantically valid candidates
    const semanticallyValid = candidates.filter((activity) => validIds.has(activity.id));

    if (semanticallyValid.length === 0) {
      this.logger.warn(
        `No semantically valid activities for review after ontology filtering. ` +
        `Excluded: ${semanticResult.excludedCandidateIds.join(', ')}`
      );
    }

    return semanticallyValid;
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
   * Rank activities using HybridRecommendationService
   * [INTEGRATION 3B.1]: Uses real ranking, not simple difficulty sort
   */
  private async rankByReviewType(studentId: string, candidates: Activity[], reviewType: ReviewType): Promise<Activity[]> {
    // [INTEGRATION 3B.1]: Use HybridRecommendationService for ranking
    // This reuses the existing recommendation ranking logic
    const ranking = this.hybridRecommendationService.rank({
      candidates,
      masteryProbability: null, // Will be populated from StudentSkillState if needed
      semanticTrace: null as any, // Optional - can be null for review context
      recentActivityIds: [],
      recentlyRejectedActivityIds: [],
      observedEvidenceTypes: [],
      recentActivities: [],
      preferences: undefined,
    });

    // Sort candidates by HybridRecommendationService scores
    const candidatesById = new Map(candidates.map((c) => [c.id, c]));
    const scored = ranking.candidates.map((scored) => ({
      activity: candidatesById.get(scored.activityId),
      score: scored.finalScore,
    })).filter((item): item is { activity: Activity; score: number } => item.activity !== undefined);

    // Return sorted by score (highest first)
    return scored.sort((a, b) => b.score - a.score).map((item) => item.activity);
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
