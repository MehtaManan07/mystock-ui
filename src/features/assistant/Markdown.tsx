import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Assistant replies are Markdown (GFM). Tailwind's Preflight strips the browser
 * defaults for headings, lists, tables and the rest, so every element we expect
 * the model to emit is styled explicitly here — otherwise replies render flat.
 */
export default function Markdown({ children }: { children: string }) {
  return (
    <div>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children: c }) => (
            <p className="my-1.5 first:mt-0 last:mb-0">{c}</p>
          ),
          h1: ({ children: c }) => (
            <h1 className="mt-3 mb-1.5 text-xl font-semibold first:mt-0">{c}</h1>
          ),
          h2: ({ children: c }) => (
            <h2 className="mt-3 mb-1.5 text-lg font-semibold first:mt-0">{c}</h2>
          ),
          h3: ({ children: c }) => (
            <h3 className="mt-3 mb-1.5 text-base font-semibold first:mt-0">{c}</h3>
          ),
          h4: ({ children: c }) => (
            <h4 className="mt-3 mb-1.5 text-base font-semibold first:mt-0">{c}</h4>
          ),
          h5: ({ children: c }) => (
            <h5 className="mt-3 mb-1.5 text-base font-semibold first:mt-0">{c}</h5>
          ),
          h6: ({ children: c }) => (
            <h6 className="mt-3 mb-1.5 text-base font-semibold first:mt-0">{c}</h6>
          ),
          ul: ({ children: c }) => (
            <ul className="my-1.5 list-disc pl-6">{c}</ul>
          ),
          ol: ({ children: c }) => (
            <ol className="my-1.5 list-decimal pl-6">{c}</ol>
          ),
          li: ({ children: c }) => <li className="mb-0.5">{c}</li>,
          a: ({ href, children: linkChildren }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:no-underline"
            >
              {linkChildren}
            </a>
          ),
          strong: ({ children: c }) => <strong className="font-semibold">{c}</strong>,
          em: ({ children: c }) => <em className="italic">{c}</em>,
          code: ({ children: c }) => (
            <code className="rounded-sm bg-foreground/10 px-1 py-0.5 font-mono text-[0.85em]">
              {c}
            </code>
          ),
          // Fenced blocks: the nested <code> above has to shed its chip styling.
          pre: ({ children: c }) => (
            <pre className="my-2 overflow-x-auto rounded-md bg-foreground/10 p-3 font-mono text-[0.85em] [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[1em]">
              {c}
            </pre>
          ),
          blockquote: ({ children: c }) => (
            <blockquote className="my-2 border-l-[3px] pl-3 text-muted-foreground">
              {c}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-t" />,
          table: ({ children: c }) => (
            <div className="my-2 overflow-x-auto">
              <table className="w-full border-collapse">{c}</table>
            </div>
          ),
          th: ({ children: c }) => (
            <th className="border px-2 py-1 text-left font-semibold">{c}</th>
          ),
          td: ({ children: c }) => (
            <td className="border px-2 py-1 text-left">{c}</td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
