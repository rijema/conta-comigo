import { Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { ChildProfile } from '../users/entities/child-profile.entity';
import { AnalyticsSnapshot } from '../analytics/entities/analytics-snapshot.entity';
import { AdeDecision } from '../ade/entities/ade-decision.entity';
import { ActivityAttempt } from '../activities/entities/activity-attempt.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { KnowledgeTracingService } from '../knowledge-tracing/knowledge-tracing.service';
import { RecommendationExplanationService } from '../ade/recommendation-explanation.service';
import { AdaptationTransition } from '../learning-events/entities/adaptation-transition.entity';
import { LongitudinalLearningAnalyticsService } from '../learning-events/longitudinal-learning-analytics.service';

@Injectable()
export class GuardianService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ChildProfile)
    private readonly childProfileRepo: Repository<ChildProfile>,
    @InjectRepository(AnalyticsSnapshot)
    private readonly snapshotRepo: Repository<AnalyticsSnapshot>,
    @InjectRepository(AdeDecision)
    private readonly adeDecisionRepo: Repository<AdeDecision>,
    @InjectRepository(ActivityAttempt)
    private readonly attemptRepo: Repository<ActivityAttempt>,
    private readonly knowledgeTracingService: KnowledgeTracingService,
    private readonly recommendationExplanationService: RecommendationExplanationService,
    @InjectRepository(AdaptationTransition)
    private readonly transitionRepo: Repository<AdaptationTransition>,
    private readonly longitudinalAnalytics?: LongitudinalLearningAnalyticsService,
  ) {}

  async getLongitudinalAnalytics(guardianId: string, childId: string) {
    const profile = await this.childProfileRepo.findOne({ where: { userId: childId, guardianId } });
    if (!profile) throw new ForbiddenException('Child is not linked to this guardian');
    if (!this.longitudinalAnalytics) throw new ForbiddenException('Longitudinal analytics service is unavailable');
    return this.longitudinalAnalytics.getGuardianReport(childId);
  }

  async getAdaptationSummaries(guardianId: string, childId: string) {
    const profile = await this.childProfileRepo.findOne({ where: { userId: childId, guardianId } });
    if (!profile) throw new ForbiddenException('Child is not linked to this guardian');
    const transitions = await this.transitionRepo.find({
      where: { studentId: childId }, order: { createdAt: 'DESC' }, take: 20,
    });
    return transitions.map((transition) => ({
      id: transition.id,
      sessionId: transition.sessionId,
      explanation: transition.sameBNCCSkill
        ? 'A criança pediu outro exercício. O sistema mudou a forma da atividade e manteve a mesma habilidade.'
        : 'A criança pediu outro exercício. O ContaComigo escolheu uma nova atividade.',
      replacementAvailable: Boolean(transition.replacementRecommendationId),
      createdAt: transition.createdAt,
    }));
  }

  async getChildrenSummary(guardianId: string) {
    const childProfiles = await this.childProfileRepo.find({
      where: { guardianId },
      relations: ['user'],
    });

    const summaries = await Promise.all(
      childProfiles.map(async (profile) => {
        const child = profile.user;
        if (!child) return null;

        const snapshots = await this.snapshotRepo.find({
          where: { userId: child.id },
          order: { createdAt: 'DESC' },
          take: 30,
        });

        const latest = snapshots[0] ?? null;

        const progressData = snapshots
          .slice(0, 14)
          .reverse()
          .map((s) => ({
            date: s.createdAt.toISOString().split('T')[0],
            score: Math.round((s.overallAccuracy ?? 0) * 100),
            activities: s.totalActivitiesCompleted ?? 0,
          }));

        const [recentAde, recentAttempts, skillMastery] = await Promise.all([
          this.adeDecisionRepo.find({
            where: { userId: child.id },
            order: { createdAt: 'DESC' },
            take: 5,
          }),
          this.attemptRepo.find({
            where: { userId: child.id },
            order: { createdAt: 'DESC' },
            take: 20,
          }),
          this.knowledgeTracingService.getMasteryMapBySkillCode(child.id),
        ]);

        const totalAttempts = recentAttempts.length;
        const correctAttempts = recentAttempts.filter((a) => a.isCorrect).length;

        const skillAccuracy: Record<string, { correct: number; total: number }> = {};
        recentAttempts.forEach((a) => {
          // bncc skills stored per attempt via adeDecisionContext or activity
        });

        return {
          id: child.id,
          name: child.name,
          email: child.email,
          age: profile.age ?? null,
          asdSupportLevel: profile.asdSupportLevel ?? 'mild',
          strengths: profile.strengths ?? {},
          weaknesses: profile.weaknesses ?? {},
          bnccProgress: profile.bnccProgress ?? {},
          skillMastery,
          totalSessions: new Set(recentAttempts.map((attempt) => attempt.sessionId).filter(Boolean)).size,
          averageScore: latest?.overallAccuracy ?? 0,
          engagementIndex: latest?.engagementIndex ?? 0,
          lastActivityAt: latest?.createdAt ?? null,
          accuracy: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
          totalAttempts,
          currentStreak: profile.currentStreak ?? 0,
          totalPoints: profile.totalPoints ?? 0,
          progressData,
          recentAdeDecisions: recentAde.map((decision) =>
            this.recommendationExplanationService.toGuardianDecision(decision),
          ),
        };
      }),
    );

    return summaries.filter(Boolean);
  }

  async getChildDetail(guardianId: string, childId: string) {
    const profile = await this.childProfileRepo.findOne({
      where: { userId: childId, guardianId },
      relations: ['user'],
    });
    if (!profile) throw new ForbiddenException('Child not found or not linked to this guardian');

    const [adeHistory, attempts, snapshots, skillMastery] = await Promise.all([
      this.adeDecisionRepo.find({ where: { userId: childId }, order: { createdAt: 'DESC' }, take: 30 }),
      this.attemptRepo.find({ where: { userId: childId }, order: { createdAt: 'DESC' }, take: 50 }),
      this.snapshotRepo.find({ where: { userId: childId }, order: { createdAt: 'ASC' }, take: 30 }),
      this.knowledgeTracingService.getMasteryMapBySkillCode(childId),
    ]);

    const progressOverTime = snapshots.map((s) => ({
      date: s.createdAt.toISOString().split('T')[0],
      accuracy: Math.round((s.overallAccuracy ?? 0) * 100),
      activities: s.totalActivitiesCompleted ?? 0,
      engagement: Math.round((s.engagementIndex ?? 0) * 100),
    }));

    const totalAttempts = attempts.length;
    const correct = attempts.filter((a) => a.isCorrect).length;
    const completed = attempts.filter((attempt) => attempt.isCorrect);
    const sessionIds = new Set(attempts.map((attempt) => attempt.sessionId).filter(Boolean));
    const formatCounts = new Map<string, number>();
    const skillCounts = new Map<string, number>();
    const successfulSkillCounts = new Map<string, number>();
    for (const attempt of attempts) {
      for (const code of attempt.activity?.bnccSkills ?? []) {
        skillCounts.set(code, (skillCounts.get(code) ?? 0) + 1);
      }
    }
    for (const attempt of completed) {
      const format = attempt.activity?.type;
      if (format) formatCounts.set(format, (formatCounts.get(format) ?? 0) + 1);
      for (const code of attempt.activity?.bnccSkills ?? []) {
        successfulSkillCounts.set(code, (successfulSkillCounts.get(code) ?? 0) + 1);
      }
    }

    return {
      id: childId,
      name: profile.user?.name,
      age: profile.age,
      asdSupportLevel: profile.asdSupportLevel ?? 'mild',
      strengths: profile.strengths ?? {},
      weaknesses: profile.weaknesses ?? {},
      bnccProgress: profile.bnccProgress ?? {},
      skillMastery,
      totalPoints: profile.totalPoints ?? 0,
      currentStreak: profile.currentStreak ?? 0,
      stats: {
        totalAttempts,
        correct,
        accuracy: totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : 0,
        sessionCount: sessionIds.size,
      },
      recentActivities: attempts.slice(0, 8).map((attempt) => ({
        id: attempt.id,
        title: attempt.activity?.title ?? 'Atividade de matemática',
        format: attempt.activity?.type ?? null,
        skills: attempt.activity?.bnccSkills ?? [],
        correct: attempt.isCorrect,
        date: attempt.createdAt,
      })),
      practicedSkills: [...skillCounts].map(([code, count]) => ({ code, count })),
      recentlySuccessfulSkills: [...successfulSkillCounts].map(([code, count]) => ({ code, count })),
      favoriteFormats: [...formatCounts].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([type, count]) => ({ type, count })),
      progressOverTime,
      recentAdeDecisions: adeHistory.map((decision) =>
        this.recommendationExplanationService.toGuardianDecision(decision),
      ),
    };
  }

  async updateChildAccess(guardianId: string, childId: string, dto: { childName: string; childPassword: string }) {
    const profile = await this.childProfileRepo.findOne({ where: { userId: childId, guardianId } });
    if (!profile) throw new ForbiddenException('Child is not linked to this guardian');
    const name = dto.childName.trim();
    if (!name || dto.childPassword.length < 4) throw new ForbiddenException('Invalid child access details');
    const child = await this.userRepo.findOne({ where: { id: childId, role: UserRole.CHILD } });
    if (!child) throw new ForbiddenException('Child account is unavailable');
    child.name = name;
    child.password = await bcrypt.hash(dto.childPassword, 12);
    await this.userRepo.save(child);
    return { id: child.id, name: child.name };
  }

  async updateOwnPassword(guardianId: string, dto: { currentPassword: string; newPassword: string }) {
    const guardian = await this.userRepo.createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :guardianId AND user.role = :role', { guardianId, role: UserRole.GUARDIAN })
      .getOne();
    if (!guardian || !await bcrypt.compare(dto.currentPassword, guardian.password)) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    guardian.password = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepo.save(guardian);
    return { success: true };
  }

  async chatWithContext(guardianId: string, childId: string, question: string) {
    // ── 1. Fetch child context (RAG data) ──────────────────────────
    const profile = await this.childProfileRepo.findOne({
      where: { userId: childId, guardianId },
      relations: ['user'],
    });
    if (!profile) throw new Error('Criança não encontrada');

    const child = profile.user;
    const snapshots = await this.snapshotRepo.find({
      where: { userId: childId },
      order: { createdAt: 'DESC' },
      take: 5,
    });
    const latest = snapshots[0];

    const recentAde = await this.adeDecisionRepo.find({
      where: { userId: childId },
      order: { createdAt: 'DESC' },
      take: 3,
    });

    const attempts = await this.attemptRepo.find({
      where: { userId: childId },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    const correct = attempts.filter((a) => a.isCorrect).length;
    const accuracy = attempts.length > 0 ? Math.round((correct / attempts.length) * 100) : 0;

    const skillMastery = await this.knowledgeTracingService
      .getMasteryMapBySkillCode(childId);
    const bnccCoverage = latest?.bnccCoverage ?? {};
    const strengths = profile.strengths ?? {};
    const weaknesses = profile.weaknesses ?? {};

    // ── 2. Build RAG context ───────────────────────────────────────
    const context = `
Você é um assistente especializado em desenvolvimento infantil e Transtorno do Espectro Autista (TEA).
Responda SEMPRE em português do Brasil, de forma acolhedora, clara e empática para o responsável da criança.
Mantenha respostas concisas (máximo 3 parágrafos). Baseie-se nos dados reais da criança abaixo.

=== DADOS DA CRIANÇA (${child.name}) ===
- Nível de suporte TEA: ${profile.asdSupportLevel ?? 'não informado'}
- Idade: ${profile.age ?? 'não informada'} anos
- Precisão nas últimas atividades: ${accuracy}%
- Total de tentativas: ${attempts.length}
- Acertos: ${correct}
- Habilidades fortes: ${Object.keys(strengths).filter(k => (strengths as Record<string,any>)[k]).join(', ') || 'nenhuma identificada ainda'}
- Habilidades a desenvolver: ${Object.keys(weaknesses).filter(k => (weaknesses as Record<string,any>)[k]).join(', ') || 'nenhuma identificada ainda'}
- Cobertura BNCC: ${Object.keys(bnccCoverage).length} habilidades trabalhadas
- Últimas recomendações da IA:
${recentAde.map((decision) => {
  const publicDecision = this.recommendationExplanationService
    .toGuardianDecision(decision);
  return `  • ${publicDecision.guardianExplanation}`;
}).join('\n') || '  (nenhuma ainda)'}

=== PERGUNTA DO RESPONSÁVEL ===
${question}
    `.trim();

    // ── 3. Call Gemini API ─────────────────────────────────────────
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        answer: `Olá! O serviço de IA está temporariamente indisponível. Para ativá-lo, configure a variável GEMINI_API_KEY no backend.\n\nCom base nos dados de ${child.name}: precisão atual de ${accuracy}%, ${attempts.length} atividades realizadas.`,
        source: 'fallback',
      };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const body = {
      contents: [{ parts: [{ text: context }] }],
      generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      ],
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('Gemini error:', err);
      return { answer: 'Não consegui processar sua pergunta agora. Tente novamente em instantes.', source: 'error' };
    }

    const data: any = await resp.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Não consegui gerar uma resposta.';
    return { answer, source: 'gemini', childName: child.name };
  }

  async childChatWithContext(childId: string, question: string) {
    // ── Fetch child data ──
    const child = await this.userRepo.findOne({ where: { id: childId } });
    if (!child) return { answer: 'Não consegui encontrar seu perfil. 😊', source: 'error' };

    const attempts = await this.attemptRepo.find({
      where: { userId: childId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    const correct = attempts.filter((a) => a.isCorrect).length;
    const accuracy = attempts.length > 0 ? Math.round((correct / attempts.length) * 100) : 0;

    const profile = await this.childProfileRepo.findOne({ where: { userId: childId } });

    // ── Child-friendly RAG context ──
    const context = `
Você é a "Tia IA", uma assistente simpática, animada e encorajadora que ajuda crianças a aprenderem matemática.
Responda SEMPRE em português do Brasil, com linguagem simples, divertida e acolhedora para uma criança de ${profile?.age ?? 7} anos.
Use emojis coloridos e frases curtas. Seja motivadora e positiva. Máximo 3 parágrafos curtos.
Nunca use linguagem técnica ou difícil. Faça a criança se sentir especial e capaz.

=== CONQUISTAS DA CRIANÇA (${child.name}) ===
- Atividades feitas: ${attempts.length}
- Acertos: ${correct} (${accuracy}% de precisão)
- Palavras de incentivo baseadas no desempenho: ${accuracy >= 70 ? 'Você está indo muito bem! Continue assim! 🌟' : accuracy >= 40 ? 'Você está aprendendo e melhorando a cada dia! 💪' : 'Cada tentativa é um passo de gigante! Você é incrível! ❤️'}

=== PERGUNTA DA CRIANÇA ===
${question}
    `.trim();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallbacks: Record<string, string> = {
        'matemática': `Aprender matemática é como ter um superpoder, ${child.name}! 🦸‍♂️ Com os números você pode contar estrelas, dividir doces com amigos e descobrir coisas incríveis sobre o mundo! É divertido quando você pratica aos poucos. Você já sabe tantas coisas! 🌟`,
        'números': `Os números são seus amigos, ${child.name}! 🔢✨ Eles estão em todo lugar: na sua idade, nos seus brinquedos, na quantidade de estrelas no céu! Quando você conta, você fica mais inteligente a cada dia! Você é demais! 💪`,
        'padrão': `Que pergunta incrível, ${child.name}! 🦋 Você está sempre aprendendo e isso é o que te torna especial. Continue praticando, cada atividade que você faz te deixa mais forte e mais esperto! Você consegue! 🌈`,
      };
      const key = Object.keys(fallbacks).find(k => question.toLowerCase().includes(k)) ?? 'padrão';
      return { answer: fallbacks[key], source: 'fallback', childName: child.name };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const body = {
      contents: [{ parts: [{ text: context }] }],
      generationConfig: { maxOutputTokens: 300, temperature: 0.9 },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      ],
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      return { answer: `Oi ${child.name}! 😊 Você é incrível por querer aprender mais! A matemática é como magia — quanto mais você pratica, mais poderes você ganha! Continue jogando! ✨`, source: 'error' };
    }

    const data: any = await resp.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? `Você é incrível, ${child.name}! Continue aprendendo! 🌟`;
    return { answer, source: 'gemini', childName: child.name };
  }

  async addChild(guardianId: string, childName: string, childPassword: string, age: number) {
    const slug = childName.toLowerCase().replace(/\s+/g, '.');
    const email = `${slug}.filho.${guardianId.substring(0, 6)}@contacomigo.internal`;

    const hashedPassword = await bcrypt.hash(childPassword, 12);

    const child = this.userRepo.create({
      name: childName,
      email,
      password: hashedPassword,
      role: UserRole.CHILD,
      isActive: true,
      lgpdConsentGiven: true,
      lgpdConsentDate: new Date(),
    });
    const savedChild = await this.userRepo.save(child);

    const profile = this.childProfileRepo.create({
      userId: savedChild.id,
      guardianId,
      age,
    });
    await this.childProfileRepo.save(profile);

    return {
      id: savedChild.id,
      name: savedChild.name,
      email: savedChild.email,
      age,
    };
  }
}
