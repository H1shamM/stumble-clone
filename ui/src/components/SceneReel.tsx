import { useState, useEffect, useRef, useCallback } from "react";
import type { ExplainerScene } from "../hooks/useEnrichment";

/**
 * SceneReel
 * ---------
 * Editorial, stories-style slide reel for the explainer "scenes" the
 * ClaudeExplainer returns. Cover → scenes → recap, with segmented progress,
 * swipe / arrow-key / tap-zone / button navigation, per-slide accent, and
 * reduced-motion support. Self-styled (scoped inline CSS) for a distinct look.
 */

interface SceneReelProps {
  title?: string;
  summary: string;
  keyPoints: string[];
  scenes: ExplainerScene[];
  /** Honest provenance line, e.g. "AI summary of Coding Horror". */
  provenance: string;
  sourceUrl: string;
  loading?: boolean;
}

const ACCENTS = [
  "var(--reel-accent-1)",
  "var(--reel-accent-2)",
  "var(--reel-accent-3)",
  "var(--reel-accent-4)",
  "var(--reel-accent-5)",
];

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Newsreader:opsz,wght@6..72,400;6..72,500&family=Space+Mono:wght@400;700&display=swap');

.reel{
  --paper:oklch(0.96 0.01 270); --ink:oklch(0.21 0.02 275); --muted:oklch(0.55 0.02 272); --line:oklch(0.91 0.005 272);
  position:relative; width:100%; height:100%; min-height:560px;
  background:var(--paper); color:var(--ink);
  font-family:'Newsreader',Georgia,serif; overflow:hidden;
  -webkit-font-smoothing:antialiased; display:flex; flex-direction:column;
  border-radius:14px;
}
.reel *{box-sizing:border-box;}

.reel-bars{display:flex; gap:5px; padding:16px 18px 0;}
.reel-bars .seg{flex:1; height:3px; border-radius:2px; background:var(--line); overflow:hidden;}
.reel-bars .seg i{display:block; height:100%; width:0; background:var(--accent); transition:width .3s ease;}
.reel-bars .seg.done i{width:100%;}
.reel-bars .seg.active i{width:100%;}

.reel-top{display:flex; justify-content:space-between; align-items:center; padding:12px 20px 0; font-family:'Space Mono',monospace; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted);}
.reel-top .spark{color:var(--accent); font-weight:700;}

.reel-viewport{flex:1; overflow:hidden; position:relative;}
.reel-track{display:flex; height:100%; transition:transform .36s cubic-bezier(.22,.61,.36,1);}
.reel-slide{flex:0 0 100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding:24px 30px; gap:0;}

.reel-emoji{font-size:clamp(3.4rem,16vw,5.2rem); line-height:1; margin-bottom:22px; filter:drop-shadow(0 6px 14px rgba(0,0,0,.08));}
.reel-kicker{font-family:'Space Mono',monospace; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--accent); margin-bottom:14px;}
.reel-h{font-family:'Bricolage Grotesque',sans-serif; font-weight:800; font-size:clamp(1.7rem,5.5vw,2.5rem); line-height:1.08; letter-spacing:-.015em; margin:0 0 16px; max-width:14ch;}
.reel-body{font-size:clamp(1.1rem,3.4vw,1.35rem); line-height:1.5; color:var(--ink); max-width:26ch; margin:0;}

.reel-cover .reel-h{font-size:clamp(2rem,7vw,3rem); max-width:16ch;}
.reel-cover .lede{font-size:clamp(1.05rem,3.2vw,1.25rem); color:var(--muted); max-width:30ch; margin:16px 0 0; line-height:1.5;}
.reel-swipehint{margin-top:30px; font-family:'Space Mono',monospace; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted);}

.reel-recap .reel-kicker{margin-bottom:18px;}
.reel-points{list-style:none; padding:0; margin:0; max-width:30ch; text-align:left;}
.reel-points li{font-size:1.08rem; line-height:1.45; padding:10px 0 10px 26px; position:relative; border-bottom:1px solid var(--line);}
.reel-points li:last-child{border-bottom:0;}
.reel-points li::before{content:""; position:absolute; left:2px; top:18px; width:8px; height:8px; border-radius:2px; background:var(--accent);}
.reel-src{margin-top:22px; font-family:'Space Mono',monospace; font-size:10.5px; color:var(--muted); line-height:1.6; max-width:32ch;}
.reel-src a{color:var(--accent); text-decoration:none; border-bottom:1px solid currentColor;}

.reel-zone{position:absolute; top:54px; bottom:64px; width:34%; cursor:pointer; z-index:2; background:transparent; border:0;}
.reel-zone.left{left:0;} .reel-zone.right{right:0; width:66%;}
.reel-nav{display:flex; justify-content:space-between; align-items:center; padding:14px 20px 20px; z-index:3;}
.reel-btn{font-family:'Space Mono',monospace; font-size:12px; letter-spacing:.08em; text-transform:uppercase; background:none; border:1px solid var(--line); color:var(--ink); padding:9px 16px; border-radius:999px; cursor:pointer; transition:border-color .15s, background .15s;}
.reel-btn:hover:not(:disabled){border-color:var(--accent);}
.reel-btn:disabled{opacity:.35; cursor:default;}
.reel-btn:focus-visible, .reel-zone:focus-visible{outline:2px solid var(--accent); outline-offset:2px;}
.reel-count{font-family:'Space Mono',monospace; font-size:12px; color:var(--muted);}

.reel-sk{background:linear-gradient(90deg,oklch(0.94 0.005 270) 25%,oklch(0.96 0.005 270) 37%,oklch(0.94 0.005 270) 63%); background-size:400% 100%; border-radius:10px; animation:rsh 1.3s ease-in-out infinite;}
@keyframes rsh{0%{background-position:100% 0}100%{background-position:0 0}}
@media (prefers-reduced-motion:reduce){
  .reel-track{transition:none;} .reel-sk{animation:none;} .reel-bars .seg i{transition:none;}
}
`;

function Skeleton() {
  return (
    <div className="reel-slide" aria-busy="true" aria-label="Loading the explainer">
      <div className="reel-sk" style={{ width: 96, height: 96, borderRadius: 20, marginBottom: 24 }} />
      <div className="reel-sk" style={{ width: "70%", height: 30, marginBottom: 14 }} />
      <div className="reel-sk" style={{ width: "85%", height: 16 }} />
      <div className="reel-sk" style={{ width: "60%", height: 16, marginTop: 8 }} />
    </div>
  );
}

type Slide =
  | { kind: "cover" }
  | { kind: "scene"; scene: ExplainerScene }
  | { kind: "recap" };

export function SceneReel({
  title,
  summary,
  keyPoints,
  scenes,
  provenance,
  sourceUrl,
  loading = false,
}: SceneReelProps) {
  const hasCover = Boolean(title);
  const hasRecap = Boolean(summary || keyPoints.length);

  const slides: Slide[] = [];
  if (hasCover) slides.push({ kind: "cover" });
  scenes.forEach((scene) => slides.push({ kind: "scene", scene }));
  if (hasRecap) slides.push({ kind: "recap" });

  const [i, setI] = useState(0);
  const total = slides.length;
  const accent = ACCENTS[Math.max(0, Math.min(i, ACCENTS.length - 1)) % ACCENTS.length];

  const go = useCallback(
    (n: number) => setI((c) => Math.max(0, Math.min(total - 1, c + n))),
    [total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const startX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
    startX.current = null;
  };

  const isWiki = sourceUrl.includes("wikipedia.org");

  if (loading || total === 0) {
    return (
      <div className="reel" style={{ ["--accent" as string]: accent }}>
        <style>{STYLE}</style>
        <div className="reel-viewport">
          <Skeleton />
        </div>
      </div>
    );
  }

  return (
    <div
      className="reel"
      style={{ ["--accent" as string]: accent }}
      role="group"
      aria-roledescription="carousel"
    >
      <style>{STYLE}</style>

      <div className="reel-bars">
        {slides.map((_, idx) => (
          <span key={idx} className={`seg ${idx < i ? "done" : ""} ${idx === i ? "active" : ""}`}>
            <i />
          </span>
        ))}
      </div>
      <div className="reel-top">
        <span className="spark">↯ stumbled</span>
        <span>{`${i + 1} / ${total}`}</span>
      </div>

      <div className="reel-viewport" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <button className="reel-zone left" aria-label="Previous slide" onClick={() => go(-1)} />
        <button className="reel-zone right" aria-label="Next slide" onClick={() => go(1)} />

        <div
          className="reel-track"
          style={{ transform: `translateX(-${i * 100}%)` }}
          aria-live="polite"
        >
          {slides.map((slide, idx) => {
            const a = ACCENTS[idx % ACCENTS.length];
            if (slide.kind === "cover") {
              return (
                <div
                  className="reel-slide reel-cover"
                  key={idx}
                  style={{ ["--accent" as string]: a }}
                  aria-hidden={idx !== i}
                >
                  <div className="reel-kicker">explainer reel · {scenes.length} scenes</div>
                  <h1 className="reel-h">{title}</h1>
                  {summary && <p className="lede">{summary}</p>}
                  <div className="reel-swipehint">swipe to begin →</div>
                </div>
              );
            }
            if (slide.kind === "recap") {
              return (
                <div
                  className="reel-slide reel-recap"
                  key={idx}
                  style={{ ["--accent" as string]: a }}
                  aria-hidden={idx !== i}
                >
                  <div className="reel-kicker">in short</div>
                  {keyPoints.length ? (
                    <ul className="reel-points">
                      {keyPoints.map((p, k) => (
                        <li key={k}>{p}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="reel-body">{summary}</p>
                  )}
                  <p className="reel-src">
                    {provenance}
                    {" · "}
                    <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                      Read the original
                    </a>
                    {isWiki && " · CC BY-SA"}
                  </p>
                </div>
              );
            }
            const s = slide.scene;
            return (
              <div
                className="reel-slide"
                key={idx}
                style={{ ["--accent" as string]: a }}
                aria-hidden={idx !== i}
              >
                <div className="reel-emoji" role="img" aria-label={s.heading}>
                  {s.emoji}
                </div>
                <div className="reel-kicker">scene {idx - (hasCover ? 1 : 0) + 1}</div>
                <h2 className="reel-h">{s.heading}</h2>
                <p className="reel-body">{s.body}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="reel-nav">
        <button className="reel-btn" onClick={() => go(-1)} disabled={i === 0}>
          ← Back
        </button>
        <span className="reel-count">{`${i + 1} / ${total}`}</span>
        <button className="reel-btn" onClick={() => go(1)} disabled={i === total - 1}>
          Next →
        </button>
      </div>
    </div>
  );
}
