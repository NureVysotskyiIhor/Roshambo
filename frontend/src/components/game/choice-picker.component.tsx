import type { Choice } from '@roshambo/shared'
import { ChoiceCard } from './choice-card.component'
import { ChoiceSymbol } from './choice-symbol.component'

const CHOICES: Choice[] = ['rock', 'paper', 'scissors']

interface ChoicePickerProps {
  myChoice: Choice | null
  myRoundChoice: Choice | null
  showResult: boolean
  showCards: boolean
  onChoose: (choice: Choice) => void
  disabled: boolean
}

export function ChoicePicker({
  myChoice,
  myRoundChoice,
  showResult,
  showCards,
  onChoose,
  disabled,
}: ChoicePickerProps) {
  const otherChoices = CHOICES.filter((c) => c !== myChoice)

  if (showResult && myRoundChoice) {
    return <ChoiceSymbol choice={myRoundChoice} size="lg" />
  }

  if (!showCards) return null

  if (myChoice) {
    return (
      <>
        <ChoiceCard
          choice={myChoice}
          index={CHOICES.indexOf(myChoice) + 1}
          isSelected
          isLarge
          onClick={() => onChoose(myChoice)}
          disabled={disabled}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          {otherChoices.map((c) => (
            <ChoiceCard
              key={c}
              choice={c}
              index={CHOICES.indexOf(c) + 1}
              isSelected={false}
              isLarge={false}
              onClick={() => onChoose(c)}
              disabled={disabled}
            />
          ))}
        </div>
      </>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {CHOICES.map((c) => (
        <ChoiceCard
          key={c}
          choice={c}
          index={CHOICES.indexOf(c) + 1}
          isSelected={false}
          isLarge={false}
          onClick={() => onChoose(c)}
        />
      ))}
    </div>
  )
}
