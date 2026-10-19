import { materializeTemplate } from '../../modules/activities/templates/activity-templates';
import { TAKE_AWAY_KIND, TAKE_AWAY_STRUCTURE_ID } from '../../modules/activities/templates/take-away.template';

/**
 * Template activities: one row per reviewed model. The stored content is a
 * 1st-year example; the backend generates new numbers/stories for each child
 * when the activity is served (see modules/activities/templates).
 */
export function templateActivities(): Record<string, unknown>[] {
  const base = {
    title: 'Quanto sobrou?',
    description: 'Modelo: tirar objetos (1º ao 5º ano)',
    type: 'quiz',
    difficulty: 'easy',
    bnccSkills: ['EF01MA08'],
    skillWeights: [{ code: 'EF01MA08', role: 'primary', weight: 1 }],
    targetModalities: ['visual', 'logical'],
    pointsReward: 15,
    isActive: true,
    accessibility: { hasVisual: true, sensoryLoad: 'low' },
    content: {
      template: { kind: TAKE_AWAY_KIND, version: 1 },
      semantic: { niche: 'subtraction', structureId: TAKE_AWAY_STRUCTURE_ID, context: 'template' },
      targetYearMin: 1,
      targetYearMax: 5,
    },
  };
  const example = materializeTemplate(base, { year: 1, level: 2, seed: 1 });
  // The stored row covers years 1-5; only served copies carry a concrete targetYear.
  const { targetYear: _targetYear, ...content } = example.content as Record<string, unknown>;
  return [{ ...example, content, bnccSkills: base.bnccSkills, skillWeights: base.skillWeights, difficulty: base.difficulty }];
}
