'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

export type Question = { question: string; reponse: string };

// Accordéon : une seule réponse ouverte, hauteur animée par grid-rows 0fr -> 1fr.
export default function Faq({ questions }: { questions: Question[] }) {
  const [ouverte, setOuverte] = useState<number | null>(0);

  return (
    <div className="divide-y divide-line rounded-3xl border border-line bg-surface">
      {questions.map((q, i) => {
        const active = ouverte === i;
        return (
          <div key={q.question}>
            <h3>
              <button
                type="button"
                id={`faq-q-${i}`}
                aria-expanded={active}
                aria-controls={`faq-r-${i}`}
                onClick={() => setOuverte(active ? null : i)}
                className="group flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
              >
                <span
                  className={`text-base font-semibold tracking-tight transition-colors ${
                    active ? 'text-accent-ink' : 'text-ink group-hover:text-accent-ink'
                  }`}
                >
                  {q.question}
                </span>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-500 ${
                    active ? 'rotate-45 border-accent bg-accent text-white' : 'border-line text-ink-soft group-hover:border-accent/50'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                </span>
              </button>
            </h3>
            <div
              id={`faq-r-${i}`}
              role="region"
              aria-labelledby={`faq-q-${i}`}
              className={`grid transition-[grid-template-rows] duration-500 ease-out ${
                active ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <p
                  className={`px-6 pb-6 text-sm leading-relaxed text-ink-soft transition-all duration-500 ${
                    active ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
                  }`}
                >
                  {q.reponse}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
