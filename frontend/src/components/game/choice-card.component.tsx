import type { Choice } from '@roshambo/shared'
import { ChoiceSymbol } from './choice-symbol.component'

interface ChoiceCardProps {
  choice: Choice
  index: number
  isSelected: boolean
  isLarge: boolean
  onClick: () => void
  disabled?: boolean
}

const CHOICE_COLOR: Record<Choice, string> = {
  rock: 'var(--color-rock)',
  paper: 'var(--color-paper)',
  scissors: 'var(--color-scissors)',
}

const CHOICE_COLOR_RGB: Record<Choice, string> = {
  rock: '239, 68, 68',
  paper: '59, 130, 246',
  scissors: '34, 197, 94',
}

const CHOICE_NAME: Record<Choice, string> = {
  rock: 'Rock',
  paper: 'Paper',
  scissors: 'Scissors',
}

const NumberBadge = ({ index }: { index: number }) => (
  <div
    style={{
      position: 'absolute',
      top: 8,
      right: 8,
      width: 20,
      height: 20,
      borderRadius: '50%',
      backgroundColor: 'var(--color-surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      color: 'var(--color-text-muted)',
    }}
  >
    {index}
  </div>
)

export function ChoiceCard({ choice, index, isSelected, isLarge, onClick, disabled }: ChoiceCardProps) {
  const color = CHOICE_COLOR[choice]
  const rgb = CHOICE_COLOR_RGB[choice]
  const name = CHOICE_NAME[choice]

  const width = isLarge ? 160 : disabled ? 120 : 140
  const height = isLarge ? 160 : disabled ? 130 : 150

  if (isSelected && isLarge) {
    return (
      <div
        style={{
          position: 'relative',
          width,
          height,
          border: `2px solid ${color}`,
          backgroundColor: `rgba(${rgb}, 0.08)`,
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: 'var(--color-win)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6L5 9L10 3"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <NumberBadge index={index} />
        <ChoiceSymbol choice={choice} size="md" />
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color,
          }}
        >
          {name}
        </span>
      </div>
    )
  }

  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        position: 'relative',
        width,
        height,
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'border-color 0.15s, background-color 0.15s',
        opacity: disabled ? 0.55 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = color
          e.currentTarget.style.backgroundColor = `rgba(${rgb}, 0.05)`
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.backgroundColor = 'var(--color-surface)'
        }
      }}
    >
      <NumberBadge index={index} />
      <ChoiceSymbol choice={choice} size="sm" />
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}
      >
        {name}
      </span>
    </div>
  )
}
