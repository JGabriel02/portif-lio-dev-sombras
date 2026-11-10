/**
 * Decorative page background: slow drifting purple/pink fog plus small
 * glowing "souls" rising. Pure CSS (see globals.css `.fundo-*`), fixed behind
 * all content, hidden from assistive tech, frozen under reduced motion.
 * Particle positions are deterministic so server and client markup match.
 */
const ALMAS = Array.from({ length: 22 }, (_, i) => {
  const r = (n: number) =>
    (((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1) + 1) % 1
  return {
    left: `${(r(1) * 100).toFixed(2)}%`,
    size: 2 + Math.round(r(2) * 4),
    duration: `${(10 + r(3) * 10).toFixed(1)}s`,
    delay: `${(-r(4) * 20).toFixed(1)}s`,
    rosa: i % 3 === 0,
  }
})

export function FundoSombra() {
  return (
    <div aria-hidden="true" className="fundo-sombra">
      <div className="fundo-nevoa fundo-nevoa-1" />
      <div className="fundo-nevoa fundo-nevoa-2" />
      <div className="fundo-nevoa fundo-nevoa-3" />
      {ALMAS.map((a, i) => (
        <span
          key={i}
          className={a.rosa ? 'fundo-alma fundo-alma-rosa' : 'fundo-alma'}
          style={{
            left: a.left,
            width: a.size,
            height: a.size,
            animationDuration: a.duration,
            animationDelay: a.delay,
          }}
        />
      ))}
    </div>
  )
}
