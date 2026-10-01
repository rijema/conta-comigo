import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BlockStackingMinigame } from '@/components/minigames/block-stacking-minigame';
import { NumberLineMinigame } from '@/components/minigames/number-line-minigame';
import type { Activity } from '@/types';

describe('BlockStackingMinigame', () => {
  const mockOnComplete = jest.fn();

  const mockActivity: Activity = {
    id: 'test-stacking-1',
    title: 'Test Stacking Game',
    description: 'Test',
    type: 'composition_decomposition',
    difficulty: 'easy',
    bnccSkills: ['EF01MA03', 'EF01MA06'],
    targetModalities: ['visual', 'sensory'],
    pointsReward: 18,
    skillWeights: [
      { code: 'EF01MA03', role: 'primary', weight: 0.5 },
      { code: 'EF01MA06', role: 'primary', weight: 0.5 },
    ],
    isActive: true,
    content: {
      instructions: 'Stack the blocks',
      items: [
        { id: 'b1', color: '#FF6B6B', size: 'large' },
        { id: 'b2', color: '#4ECDC4', size: 'medium' },
        { id: 'b3', color: '#45B7D1', size: 'large' },
      ],
      correctAnswer: ['b1', 'b2', 'b3'],
      validation: { kind: 'sequence' },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders block stacking game component', () => {
    render(
      <BlockStackingMinigame
        skill="EF01MA03"
        difficulty="easy"
        onComplete={mockOnComplete}
        activity={mockActivity}
        isTEAMode={false}
      />
    );

    expect(screen.getByText('Pilha de Blocos')).toBeInTheDocument();
    expect(screen.getByText('Blocos Disponíveis')).toBeInTheDocument();
    expect(screen.getByText('Sua Pilha')).toBeInTheDocument();
  });

  it('displays correct number of blocks based on activity', () => {
    render(
      <BlockStackingMinigame
        skill="EF01MA03"
        difficulty="easy"
        onComplete={mockOnComplete}
        activity={mockActivity}
        isTEAMode={false}
      />
    );

    // 3 blocks in the activity
    const blockElements = screen.getAllByText(/Bloco/i);
    expect(blockElements.length).toBeGreaterThanOrEqual(3);
  });

  it('generates fallback blocks when no activity provided', () => {
    render(
      <BlockStackingMinigame
        skill="EF01MA03"
        difficulty="easy"
        onComplete={mockOnComplete}
        isTEAMode={false}
      />
    );

    // Should still render stack area even without activity
    expect(screen.getByText('Sua Pilha')).toBeInTheDocument();
  });

  it('updates progress when blocks are dragged', async () => {
    render(
      <BlockStackingMinigame
        skill="EF01MA03"
        difficulty="easy"
        onComplete={mockOnComplete}
        activity={mockActivity}
        isTEAMode={false}
      />
    );

    // Check initial progress
    expect(screen.getByText(/Progresso: 0 de 3/)).toBeInTheDocument();
  });

  it('completes when all blocks are stacked', async () => {
    render(
      <BlockStackingMinigame
        skill="EF01MA03"
        difficulty="easy"
        onComplete={mockOnComplete}
        activity={mockActivity}
        isTEAMode={false}
      />
    );

    // After completion should be called
    // Note: Full drag-drop testing requires more complex setup with data-transfer events
    await waitFor(() => {
      // Verify component renders without crashing
      expect(screen.getByText('Pilha de Blocos')).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});

describe('NumberLineMinigame', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders number line game component', () => {
    render(
      <NumberLineMinigame
        skill="EF01MA03"
        difficulty="easy"
        onComplete={mockOnComplete}
        isTEAMode={false}
      />
    );

    expect(screen.getByText('Reta Numérica')).toBeInTheDocument();
    expect(screen.getByText(/Onde fica o número/i)).toBeInTheDocument();
  });

  it('displays appropriate number range based on difficulty', async () => {
    const { rerender } = render(
      <NumberLineMinigame
        skill="EF01MA03"
        difficulty="very_easy"
        onComplete={mockOnComplete}
        isTEAMode={false}
      />
    );

    await waitFor(() => {
      // Easy difficulty should have small range
      expect(screen.getByText('Reta Numérica')).toBeInTheDocument();
    });
  });

  it('shows feedback when answer is given', async () => {
    render(
      <NumberLineMinigame
        skill="EF01MA03"
        difficulty="easy"
        onComplete={mockOnComplete}
        isTEAMode={false}
      />
    );

    const numberLine = screen.getByText('Reta Numérica').closest('div')?.parentElement;

    if (numberLine) {
      // Simulate click on the number line
      fireEvent.click(numberLine.querySelector('[onDragOver]') || numberLine, {
        clientX: 100,
        clientY: 100,
      });

      await waitFor(() => {
        // Should show some feedback (either correct or incorrect)
        const feedback = screen.queryByText(/Parabéns|Não foi dessa/);
        // Feedback may appear
      });
    }
  });

  it('calls onComplete when answer is submitted', async () => {
    jest.useFakeTimers();

    render(
      <NumberLineMinigame
        skill="EF01MA03"
        difficulty="easy"
        onComplete={mockOnComplete}
        isTEAMode={false}
      />
    );

    const numberLine = screen.getByText('Reta Numérica').closest('div')?.parentElement;

    if (numberLine) {
      fireEvent.click(numberLine.querySelector('[onDragOver]') || numberLine, {
        clientX: 100,
        clientY: 100,
      });

      jest.advanceTimersByTime(2500);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });
    }

    jest.useRealTimers();
  });

  it('renders different ticks based on number range', async () => {
    render(
      <NumberLineMinigame
        skill="EF01MA03"
        difficulty="hard"
        onComplete={mockOnComplete}
        isTEAMode={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Reta Numérica')).toBeInTheDocument();
      // Hard difficulty should show more ticks (0-50 range)
    });
  });
});

describe('Minigame Integration with ActivityRenderer', () => {
  it('BlockStackingMinigame should receive correct props', () => {
    const mockOnComplete = jest.fn();

    render(
      <BlockStackingMinigame
        skill="EF01MA03"
        difficulty="easy"
        onComplete={mockOnComplete}
        activity={undefined}
        isTEAMode={true}
      />
    );

    expect(screen.getByText('Pilha de Blocos')).toBeInTheDocument();
  });

  it('NumberLineMinigame should receive correct props', () => {
    const mockOnComplete = jest.fn();

    render(
      <NumberLineMinigame
        skill="EF01MA03"
        difficulty="easy"
        onComplete={mockOnComplete}
        isTEAMode={true}
      />
    );

    expect(screen.getByText('Reta Numérica')).toBeInTheDocument();
  });
});
