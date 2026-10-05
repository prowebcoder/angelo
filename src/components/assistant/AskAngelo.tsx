'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MessageCircle, Send, X } from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'
import { askAngelo } from '@/actions/assistant'
import { STARTER_QUESTIONS, type AssistantReply } from '@/lib/assistant-shared'
import { useFocusTrap } from '@/hooks/useFocusTrap'

type Turn = { id: number; role: 'you' | 'angelo'; text: string; reply?: AssistantReply }

const OPENING: Turn = {
  id: 0,
  role: 'angelo',
  text: 'Hello — I can help you find a gown, explain how appointments work, or point you to the boutique. What would you like to know?',
  reply: { text: '', suggestions: [...STARTER_QUESTIONS].slice(0, 4) },
}

/**
 * Floating bridal concierge.
 *
 * Answers come from `askAngelo`, which only ever returns editor-written
 * content or real catalogue results. The thread is a live region so each new
 * answer is announced, and focus is trapped while the panel is open.
 */
export const AskAngelo = () => {
  const [open, setOpen] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([OPENING])
  const [question, setQuestion] = useState('')
  const [pending, startTransition] = useTransition()
  const panelRef = useRef<HTMLDivElement>(null)
  const threadRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(1)

  useFocusTrap(panelRef, open, () => setOpen(false))

  // Keep the newest answer in view.
  useEffect(() => {
    if (!open) return
    const thread = threadRef.current
    if (thread) thread.scrollTop = thread.scrollHeight
  }, [turns, open, pending])

  const ask = (value: string) => {
    const text = value.trim()
    if (!text || pending) return

    setTurns((current) => [...current, { id: nextId.current++, role: 'you', text }])
    setQuestion('')

    startTransition(async () => {
      const reply = await askAngelo(text)
      setTurns((current) => [...current, { id: nextId.current++, role: 'angelo', text: reply.text, reply }])
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="ask-angelo"
        className={`fixed right-4 bottom-4 z-40 inline-flex items-center gap-2.5 bg-ink px-5 py-3.5 text-[0.625rem] font-medium tracking-[0.16em] text-on-ink uppercase shadow-[0_12px_32px_-16px_rgba(25,21,15,0.6)] transition-opacity md:right-6 md:bottom-6 ${
          open ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" strokeWidth={1.5} />
        Ask Angelo
      </button>

      <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={open ? undefined : true}>
        <div
          className={`absolute inset-0 bg-ink/30 transition-opacity duration-300 md:hidden ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setOpen(false)}
        />

        <div
          ref={panelRef}
          id="ask-angelo"
          role="dialog"
          aria-modal="true"
          aria-label="Ask Angelo"
          tabIndex={-1}
          className={`absolute inset-x-0 bottom-0 flex max-h-[85svh] flex-col border-t border-line bg-paper transition-transform duration-[400ms] ease-(--ease-editorial) md:inset-x-auto md:right-6 md:bottom-6 md:max-h-[min(36rem,80svh)] md:w-[24rem] md:border md:shadow-[0_24px_48px_-24px_rgba(25,21,15,0.35)] ${
            open ? 'translate-y-0' : 'translate-y-full md:translate-y-[120%]'
          }`}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <p className="font-serif text-lg">Ask Angelo</p>
              <p className="text-[0.625rem] tracking-[0.18em] text-ink-muted uppercase">Bridal concierge</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="-mr-2 p-2">
              <X className="h-5 w-5" aria-hidden="true" strokeWidth={1.25} />
              <span className="sr-only">Close Ask Angelo</span>
            </button>
          </div>

          <div
            ref={threadRef}
            className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5"
            aria-live="polite"
            aria-busy={pending}
          >
            {turns.map((turn) => (
              <div key={turn.id}>
                {turn.role === 'you' ? (
                  <p className="ml-auto max-w-[85%] bg-ivory px-4 py-2.5 text-sm">{turn.text}</p>
                ) : (
                  <div className="max-w-[92%] space-y-4">
                    <p className="text-sm leading-relaxed text-ink-soft">{turn.text}</p>

                    {turn.reply?.dresses?.length ? (
                      <ul className="grid grid-cols-2 gap-3">
                        {turn.reply.dresses.map((dress) => (
                          <li key={dress.id}>
                            <Link href={`/dress/${dress.slug}`} onClick={() => setOpen(false)} className="group block">
                              {dress.image ? (
                                <div className="relative aspect-[4/5] overflow-hidden bg-ivory">
                                  <Image
                                    src={dress.image}
                                    alt=""
                                    fill
                                    sizes="160px"
                                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                                  />
                                </div>
                              ) : (
                                <div className="aspect-[4/5] bg-ivory" aria-hidden="true" />
                              )}
                              <p className="mt-1.5 font-serif text-sm leading-tight">{dress.name}</p>
                              {dress.designer ? (
                                <p className="text-[0.5625rem] tracking-[0.16em] text-ink-muted uppercase">
                                  {dress.designer}
                                </p>
                              ) : null}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {turn.reply?.links?.length ? (
                      <ul className="flex flex-wrap gap-2">
                        {turn.reply.links.map((link) => (
                          <li key={link.href}>
                            {link.href.startsWith('http') ? (
                              <a
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block border border-line-strong px-3 py-2 text-[0.5625rem] font-medium tracking-[0.16em] uppercase hover:border-ink"
                              >
                                {link.label}
                              </a>
                            ) : (
                              <Link
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className="inline-block border border-line-strong px-3 py-2 text-[0.5625rem] font-medium tracking-[0.16em] uppercase hover:border-ink"
                              >
                                {link.label}
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {turn.reply?.suggestions?.length ? (
                      <ul className="space-y-1.5">
                        {turn.reply.suggestions.map((suggestion) => (
                          <li key={suggestion}>
                            <button
                              type="button"
                              onClick={() => ask(suggestion)}
                              className="link-quiet text-left text-xs text-taupe"
                            >
                              {suggestion}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                )}
              </div>
            ))}

            {pending ? <p className="text-xs tracking-wide text-ink-muted">Looking…</p> : null}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              ask(question)
            }}
            className="flex items-center gap-2 border-t border-line px-5 py-4"
          >
            <label htmlFor="ask-angelo-input" className="sr-only">
              Ask a question
            </label>
            <input
              id="ask-angelo-input"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about gowns or appointments…"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm placeholder:text-ink-muted/70 focus:outline-none"
            />
            <button type="submit" disabled={pending || !question.trim()} className="p-2 disabled:opacity-40">
              <Send className="h-4 w-4" aria-hidden="true" strokeWidth={1.5} />
              <span className="sr-only">Send</span>
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
