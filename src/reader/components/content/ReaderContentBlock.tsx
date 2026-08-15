import type { ReaderBlock } from '../../types/reader'

type ReaderContentBlockProps = {
  block: ReaderBlock
  progressIndex: number
}

export function ReaderContentBlock({ block, progressIndex }: ReaderContentBlockProps) {
  const marker = { 'data-reader-progress-marker': progressIndex }

  switch (block.type) {
    case 'heading': {
      const content = (
        <>
          {block.kicker ? <span className="reader-heading__kicker">{block.kicker}</span> : null}
          {block.text}
        </>
      )
      return block.level === 2 ? (
        <h2 id={block.id} className="reader-heading reader-heading--chapter" {...marker}>
          {content}
        </h2>
      ) : (
        <h3 id={block.id} className="reader-heading reader-heading--section" {...marker}>
          {content}
        </h3>
      )
    }
    case 'paragraph':
      return (
        <p id={block.id} className="reader-paragraph" {...marker}>
          {block.text}
        </p>
      )
    case 'dialogue':
      return (
        <div id={block.id} className="reader-dialogue" {...marker}>
          {block.lines.map((line, index) => (
            <p key={`${block.id}-${index}`}>{line}</p>
          ))}
        </div>
      )
    case 'illustration':
      return (
        <figure
          id={block.id}
          className={`reader-illustration reader-illustration--${block.variant ?? 'normal'}`}
          {...marker}
        >
          <img
            src={block.src}
            alt={block.alt}
            width={block.width}
            height={block.height}
            loading="lazy"
            decoding="async"
          />
          {block.caption ? <figcaption>{block.caption}</figcaption> : null}
        </figure>
      )
    case 'quote':
      return (
        <figure id={block.id} className="reader-quote" {...marker}>
          <blockquote>{block.text}</blockquote>
          {block.attribution ? <figcaption>{block.attribution}</figcaption> : null}
        </figure>
      )
    case 'divider':
      return (
        <div id={block.id} className="reader-divider" role="separator" aria-label="場景分隔" {...marker}>
          <span />
          <span />
          <span />
        </div>
      )
  }
}
