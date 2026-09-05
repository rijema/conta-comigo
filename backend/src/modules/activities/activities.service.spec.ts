import { ActivitiesService } from './activities.service';

describe('ActivitiesService answer evaluation', () => {
  const service = new ActivitiesService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  const evaluateAnswer = (activity: any, answer: any) =>
    (service as any).evaluateAnswer(activity, answer);

  it('accepts a drag-drop arrangement using correctOrder', () => {
    const activity = {
      type: 'drag_drop',
      content: {
        correctOrder: ['n9', 'n7', 'n6', 'n5'],
        correctAnswer: 'n9,n7,n6,n5',
      },
    };

    expect(evaluateAnswer(activity, ['n9', 'n7', 'n6', 'n5'])).toBe(true);
  });

  it('supports legacy drag-drop activities with a comma-separated correctAnswer', () => {
    const activity = {
      type: 'drag_drop',
      content: { correctAnswer: 'n1,n2,n3,n4' },
    };

    expect(evaluateAnswer(activity, ['n1', 'n2', 'n3', 'n4'])).toBe(true);
    expect(evaluateAnswer(activity, ['n4', 'n3', 'n2', 'n1'])).toBe(false);
  });
});
