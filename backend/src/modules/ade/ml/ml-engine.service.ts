import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface MlPredictions {
  masteryProbability: number;
  engagementScore: number;
  modalityRecommendation: string;
  confidence: number;
  fallback?: boolean;
}

@Injectable()
export class MlEngineService {
  private readonly logger = new Logger(MlEngineService.name);
  private readonly mlServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.mlServiceUrl = this.configService.get<string>(
      'ML_SERVICE_URL',
      'http://localhost:8001',
    );
  }

  async predict(input: {
    userId: string;
    recentAttempts: Array<{
      isCorrect: boolean;
      timeSpentSeconds: number;
      hintsUsed: number;
      interactionSignals: any;
    }>;
    currentSkillCode: string;
    bnccSkills: string[];
    asdSupportLevel: string;
    strengths: Record<string, boolean>;
    weaknesses: Record<string, boolean>;
  }): Promise<MlPredictions> {
    try {
      const response = await firstValueFrom(
        this.httpService
          .post(`${this.mlServiceUrl}/predict`, input)
          .pipe(
            timeout(5000), // 5s timeout — never block ADE
            catchError((err) => {
              this.logger.warn(`ML service unavailable: ${err.message}. Using fallback.`);
              return of({ data: this.getFallbackPredictions(input) });
            }),
          ),
      );

      return response.data;
    } catch (err) {
      const error = err as any;
      this.logger.error(`ML Engine error: ${error.message}`);
      return this.getFallbackPredictions(input);
    }
  }

  /**
   * Fallback predictions using simple heuristics when ML service is unavailable.
   * Ensures ADE never blocks on ML failures.
   */
  private getFallbackPredictions(input: any): MlPredictions {
    const attempts = input.recentAttempts || [];
    const correct = attempts.filter((a: any) => a.isCorrect).length;
    const accuracy = attempts.length > 0 ? correct / attempts.length : 0.5;

    // Simple BKT fallback: accuracy approximation
    const masteryProbability = Math.min(0.9, 0.3 + accuracy * 0.6);
    const engagementScore = accuracy > 0.6 ? 0.7 : 0.4;

    return {
      masteryProbability,
      engagementScore,
      modalityRecommendation: 'visual',
      confidence: 0.3,
      fallback: true,
    };
  }
}