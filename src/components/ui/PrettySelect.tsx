import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

type PrettySelectOption = {
  value: number
  label: string
}

interface PrettySelectProps {
  value: number
  options: PrettySelectOption[]
  onChange: (value: number) => void
  disabled?: boolean
}

export function PrettySelect({
  value,
  options,
  onChange,
  disabled = false,
}: PrettySelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? options[0] ?? null,
    [options, value],
  )

  useEffect(() => {
    if (!open) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled || options.length === 0}
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-[3.5rem] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
          disabled
            ? 'cursor-not-allowed border-white/10 bg-[#102019]/55 text-slate-500 opacity-70'
            : open
              ? 'border-emerald-300/25 bg-[#163126] text-white shadow-[0_0_0_4px_rgba(16,185,129,0.08)]'
              : 'border-emerald-100/10 bg-[#102019]/90 text-slate-100 hover:border-emerald-200/20 hover:bg-[#163126]'
        }`}
      >
        <span className="truncate pr-2">
          {selectedOption?.label ?? 'Selecione uma opção'}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-emerald-100/80 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && !disabled ? (
        <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-[22px] border border-emerald-100/10 bg-[#0f1f19]/98 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="max-h-80 overflow-y-auto p-2">
            {options.map((option) => {
              const active = option.value === value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-start justify-between gap-3 rounded-[18px] px-4 py-3 text-left text-sm transition ${
                    active
                      ? 'bg-emerald-300/10 text-white'
                      : 'text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="leading-6">{option.label}</span>
                  {active ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" /> : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
