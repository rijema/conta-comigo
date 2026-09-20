/**
 * TEA Profile Analyzer Service
 *
 * Detects child's modality strengths/weaknesses from learning history
 * and updates profile with observed evidence for Learning Analytics
 *
 * [LITERATURA] Vygotsky ZPD - adaptar conteúdo à zona proximal
 * [PROPOSTA CONTA COMIGO] Usar perfil sensório (visual/auditivo/motor) pra recomendar
 * [DECISÃO DE ENGENHARIA] Analisar últimas 20 atividades para detectar padrões
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChildProfile } from '../entities/child-profile.entity';
import { RecommendationOutcome } from '../../learning-events/entities/recommendation-outcome.entity';

export interface ModalityStrength {
  visual: { strength: number; evidence: string[] };
  auditory: { strength: number; evidence: string[] };
  motor: { strength: number; evidence: string[] };
}

export interface TEAProfileAnalysis {
  primaryStrength: 'visual' | 'auditory' | 'motor' | 'mixed';
  primaryWeakness: 'visual' | 'auditory' | 'motor' | 'balanced';
  modalityScores: ModalityStrength;
  confidence: number; // 0-1, based on evidence count
  lastAnalyzedAt: Date;
  sampleSize: number;
}

@Injectable()
export class TEAProfileAnalyzerService {
  constructor(
    @InjectRepository(ChildProfile)
    private childProfileRepo: Repository<ChildProfile>,
    @InjectRepository(RecommendationOutcome)
    private recommendationOutcomeRepo: Repository<RecommendationOutcome>,
  ) {}

  /**
   * Analyze child's performance and detect modality strengths/weaknesses
   * Run after every 5-10 activities
   *
   * [METODOLOGIA] Coleta acurácia por modalidade (visual/auditivo/motor)
   * [DECISÃO DE PROJETO] threshold 0.65 = força, 0.35 = fraqueza (empírico)
   */
  async analyzeAndUpdateProfile(studentId: string, maxSampleSize = 20): Promise<TEAProfileAnalysis> {
    // Get recent outcomes
    const outcomes = await this.recommendationOutcomeRepo.find({
      where: { studentId },
      relations: ['activityId'],
      order: { completedAt: 'DESC' },
      take: maxSampleSize,
    });

    if (outcomes.length < 5) {
      return {
        primaryStrength: 'mixed',
        primaryWeakness: 'balanced',
        modalityScores: {
          visual: { strength: 0.5, evidence: [] },
          auditory: { strength: 0.5, evidence: [] },
          motor: { strength: 0.5, evidence: [] },
        },
        confidence: 0,
        lastAnalyzedAt: new Date(),
        sampleSize: outcomes.length,
      };
    }

    const analysis = this.detectModalityPatterns(outcomes);

    // Update profile so hybrid-recommendation can use it
    const profile = await this.childProfileRepo.findOneBy({ userId: studentId });
    if (profile) {
      profile.ontologyInstanceData = {
        ...profile.ontologyInstanceData,
        // Strengths
        ...(analysis.primaryStrength === 'visual' && { visualstrength: true }),
        ...(analysis.primaryStrength === 'auditory' && { auditivestrength: true }),
        ...(analysis.primaryStrength === 'motor' && { motorstrength: true }),
        
        // Weaknesses
        ...(analysis.primaryWeakness === 'visual' && { visualweakness: true }),
        ...(analysis.primaryWeakness === 'auditory' && { auditiveweakness: true }),
        ...(analysis.primaryWeakness === 'motor' && { motorweakness: true }),
        
        // Metadata for debugging
        teaAnalysis: {
          scores: analysis.modalityScores,
          confidence: analysis.confidence,
          lastUpdated: new Date().toISOString(),
        },
      };
      await this.childProfileRepo.save(profile);
    }

    return analysis;
  }

  private detectModalityPatterns(outcomes: RecommendationOutcome[]): TEAProfileAnalysis {
    const visualResults: boolean[] = [];
    const auditoryResults: boolean[] = [];
    const motorResults: boolean[] = [];

    for (const outcome of outcomes) {
      const activity = outcome.activityId as any;
      if (!activity) continue;

      const targetModalities = activity.targetModalities ?? [];
      const isCorrect = outcome.correct === true;
      const responseTime = outcome.responseTimeMs ?? 0;

      // Visual: images, visual representations
      if (targetModalities.includes('visual')) {
        visualResults.push(isCorrect);
      }

      // Auditory: voice, audio prompts
      if (
        targetModalities.includes('audio') ||
        activity.accessibility?.hasAudio === true
      ) {
        auditoryResults.push(isCorrect);
      }

      // Motor: drag-drop, manipulation (quick + correct = strong motor)
      if (
        targetModalities.includes('sensory') ||
        activity.type === 'drag_drop' ||
        activity.affordances?.requiresDragging === true
      ) {
        motorResults.push(isCorrect && responseTime < 30000); // < 30s
      }
    }

    // Calculate accuracy per modality
    const visualStrength = visualResults.length > 0
      ? visualResults.filter(x => x).length / visualResults.length
      : 0.5;
    
    const auditoryStrength = auditoryResults.length > 0
      ? auditoryResults.filter(x => x).length / auditoryResults.length
      : 0.5;
    
    const motorStrength = motorResults.length > 0
      ? motorResults.filter(x => x).length / motorResults.length
      : 0.5;

    const scores = [
      { modality: 'visual' as const, score: visualStrength },
      { modality: 'auditory' as const, score: auditoryStrength },
      { modality: 'motor' as const, score: motorStrength },
    ];
    
    const sorted = scores.sort((a, b) => b.score - a.score);
    const primaryStrength = sorted[0];
    const primaryWeakness = sorted[sorted.length - 1];

    const variance = this.calculateVariance([visualStrength, auditoryStrength, motorStrength]);
    const confidence = Math.min(1, Math.max(0, variance * 2)); // Higher variance = more confident

    return {
      primaryStrength: primaryStrength.score > 0.65 ? primaryStrength.modality : 'mixed',
      primaryWeakness: primaryWeakness.score < 0.35 ? primaryWeakness.modality : 'balanced',
      modalityScores: {
        visual: {
          strength: visualStrength,
          evidence: visualResults.length > 0 ? [`${visualResults.length} visual activities`] : [],
        },
        auditory: {
          strength: auditoryStrength,
          evidence: auditoryResults.length > 0 ? [`${auditoryResults.length} auditory activities`] : [],
        },
        motor: {
          strength: motorStrength,
          evidence: motorResults.length > 0 ? [`${motorResults.length} motor activities`] : [],
        },
      },
      confidence,
      lastAnalyzedAt: new Date(),
      sampleSize: outcomes.length,
    };
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }
}
