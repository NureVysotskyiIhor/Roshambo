import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface CopyButtonProps {
  text: string
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center"
      style={{
        gap: 8,
        backgroundColor: 'transparent',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        padding: '8px 20px',
        color: copied ? 'var(--color-win)' : 'var(--color-text-muted)',
        fontSize: 14,
        cursor: 'pointer',
        transition: 'color 0.15s',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? 'Copied!' : 'Copy code'}
    </button>
  )
}
