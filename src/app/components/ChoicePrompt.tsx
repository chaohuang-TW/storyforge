import type { PendingChoice } from '../../engine/runtime/storyRuntime'

type ChoicePromptProps = {
  choice: PendingChoice
  showIrreversibilityNotice: boolean
  onChoose: (choiceId: string) => void
}

export function ChoicePrompt({ choice, showIrreversibilityNotice, onChoose }: ChoicePromptProps) {
  return (
    <section className="choice-prompt" aria-label="故事選擇">
      {showIrreversibilityNotice ? (
        <p className="choice-prompt__notice">
          <strong>觀者可以回看已發生之事。</strong>
          <span>但已被撥動的因果，不會因翻頁而改變。</span>
        </p>
      ) : null}
      <fieldset>
        <legend>撥動因果</legend>
        {choice.prompt ? <p className="choice-prompt__prompt">{choice.prompt}</p> : null}
        <div className="choice-prompt__options">
          {choice.choices.map((option) => (
            <button key={option.id} type="button" onClick={() => onChoose(option.id)}>
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
    </section>
  )
}
