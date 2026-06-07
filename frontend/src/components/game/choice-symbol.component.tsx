import type { Choice } from '@roshambo/shared';

interface ChoiceSymbolProps {
  choice: Choice;
  size?: 'sm' | 'md' | 'lg';
}

const DIMENSIONS: Record<Choice, Record<'sm' | 'md' | 'lg', number>> = {
  rock: { sm: 40, md: 60, lg: 80 },
  paper: { sm: 36, md: 55, lg: 80 },
  scissors: { sm: 34, md: 50, lg: 80 },
};

export function ChoiceSymbol({ choice, size = 'md' }: ChoiceSymbolProps) {
  const dim = DIMENSIONS[choice][size];

  if (choice === 'rock') {
    return (
      <div
        style={{
          width: dim,
          height: dim,
          borderRadius: '50%',
          backgroundColor: 'var(--color-rock)',
        }}
      />
    );
  }

  if (choice === 'paper') {
    return (
      <div
        style={{
          width: dim,
          height: dim,
          borderRadius: '8px',
          backgroundColor: 'var(--color-paper)',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: dim,
        height: dim,
        transform: 'rotate(45deg)',
        backgroundColor: 'var(--color-scissors)',
      }}
    />
  );
}
