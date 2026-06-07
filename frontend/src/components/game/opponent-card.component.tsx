import type { Choice } from '@roshambo/shared'
import { ChoiceSymbol } from './choice-symbol.component'

type OpponentCardState = 'waiting' | 'chosen' | 'revealed'

interface OpponentCardProps {
  state: OpponentCardState
  choice?: Choice
}

export function OpponentCard({ state, choice }: OpponentCardProps) {
  if (state === 'revealed' && choice) {
    return <ChoiceSymbol choice={choice} size="lg" />
  }

  const isChosen = state === 'chosen'

  return (
    <div
      style={{
        width: 100,
        height: 100,
        border: isChosen ? '1px solid var(--color-border)' : '2px dashed rgba(245, 158, 11, 0.5)',
        borderRadius: 16,
        backgroundColor: isChosen ? 'rgba(255, 255, 255, 0.03)' : 'rgba(245, 158, 11, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        color: isChosen ? 'var(--color-text-muted)' : 'var(--color-draw)',
      }}
    >
      ?
    </div>
  )
}
