/**
 * Enhance `@uimaxbai/am-lyrics` Web Component with Apple Music word & character lift animation
 * 
 * 1. Enables character motion for all sung words (removing the restrictive >=1000ms threshold)
 * 2. Enhances character lift height, scale, spring bounce, and luminous bloom
 * 3. Injects custom styling into the shadowRoot for smooth 3D subpixel rendering
 */

export function setupEnhancedAmLyrics(): void {
  const AmLyricsClass = customElements.get('am-lyrics') as any;
  if (!AmLyricsClass) {
    console.warn('[EnhancedAmLyrics] am-lyrics custom element not registered yet.');
    return;
  }

  // Prevent multiple patching
  if (AmLyricsClass.__enhancedLiftPatched) return;
  AmLyricsClass.__enhancedLiftPatched = true;

  // 1. Patch characterMotionMode:
  // am-lyrics natively required durationMs >= 1000 to enable character motion,
  // which disqualified 95% of song words. We enable it for all sung syllables.
  AmLyricsClass.characterMotionMode = function (
    text: string,
    durationMs: number,
    background = false
  ): 'none' | 'rise' | 'emphasis' {
    if (/[\u0590-\u08ff]/.test(text)) return 'none';
    const count = Array.from(text.trim()).length;
    if (!count) return 'none';
    if (/[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff]/.test(text)) {
      return count > 1 ? 'rise' : 'none';
    }
    // Enable lift & emphasis for all singing words (>= 50ms)
    return !background && durationMs >= 50 && count <= 25 ? 'emphasis' : 'none';
  };

  // Helper spring function in case internal static is missing
  const sampleSpring =
    AmLyricsClass.sampleSpring ||
    function (position: number, velocity: number, time: number, frequency: number, damping = 0.9 * frequency) {
      const omega = Math.sqrt(frequency * frequency - damping * damping);
      const decay = Math.exp(-damping * time);
      const cos = Math.cos(omega * time);
      const sin = Math.sin(omega * time);
      return {
        position: decay * (position * cos + ((velocity + damping * position) / omega) * sin),
        velocity: decay * (velocity * cos - ((damping * velocity + frequency * frequency * position) / omega) * sin),
      };
    };

  const springProgress =
    AmLyricsClass.springProgress ||
    function (time: number, response: number) {
      if (time <= 0) return 0;
      const phase = (2 * Math.PI * time) / Math.max(0.001, response);
      return 1 - (1 + phase) * Math.exp(-phase);
    };

  // 2. Patch updateCharacterMotion:
  // Deliver energetic Apple Music 3D character lift, bounce envelope, and luminous glow
  AmLyricsClass.updateCharacterMotion = function (
    line: HTMLElement,
    timeMs: number
  ): void {
    let syllables = AmLyricsClass.motionSyllables?.get(line);
    if (!syllables) {
      const seen = new Set<HTMLElement>();
      syllables = Array.from(
        line.querySelectorAll<HTMLElement>('.lyrics-syllable.has-chars')
      ).filter((syllable) => {
        const word = AmLyricsClass.getWordElementForSyllable(syllable);
        const key = AmLyricsClass.getCachedVirtualWordElements(word)[0] || syllable;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      AmLyricsClass.motionSyllables?.set(line, syllables);
    }

    syllables.forEach((syllable: HTMLElement) => {
      let parameters = AmLyricsClass.motionParameters?.get(syllable);
      if (!parameters) {
        const word = AmLyricsClass.getWordElementForSyllable(syllable);
        const chars = AmLyricsClass.getCachedVirtualWordCharSpans(
          word,
          AmLyricsClass.getCachedCharSpans(syllable)
        );
        const start = Number(
          word?.dataset.virtualWordStart ?? syllable.dataset.startTime
        );
        const end = Number(
          word?.dataset.virtualWordEnd ?? syllable.dataset.endTime
        );
        parameters = {
          chars,
          duration: Math.max(0.001, (end - start) / 1000),
          start,
          cjk: /[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff]/.test(
            chars.map((char: HTMLElement) => char.textContent).join('')
          ),
        };
        AmLyricsClass.motionParameters?.set(syllable, parameters);
      }

      const { chars, duration, start, cjk } = parameters;
      const count = chars.length;
      if (!count) return;
      const elapsed = timeMs - start;
      const factor = cjk ? 0.8 : 0.4;
      const delay = Math.min((duration / count) * factor, factor);
      const hold = Math.max(0.12, (2.0 * duration) / count);
      // Smoother spring response to prevent jumpiness
      const response = Math.max(0.4, Math.min(2.0, duration * 0.9));

      // Subtle, gentle Apple Music character emphasis
      const emphasis = cjk ? 0 : Math.max(0.4, Math.min(0.8, 0.4 + duration * 0.2));
      const glow = cjk ? 0 : 0.45 * Math.min(1, Math.max(0, (duration - 1) / 0.5));
      const spanDuration = Math.max(hold + response * 2, cjk ? 3 : 0.5);

      chars.forEach((char: HTMLElement, index: number) => {
        if (elapsed < 0) {
          AmLyricsClass.clearCharacterMotion(char);
          return;
        }
        const startDelay = (index + 1) * delay * 1000;
        const end = spanDuration * 1000 + startDelay;
        const key = parameters;
        let entry = AmLyricsClass.characterAnimations?.get(char);

        if (!entry || entry.key !== key) {
          AmLyricsClass.clearCharacterMotion(char);
          const frameKey = `subtle:${duration.toFixed(2)}:${count}:${index}:${cjk}`;
          let frames = AmLyricsClass.characterFrames?.get(frameKey);

          if (!frames) {
            frames = Array.from({ length: 61 }, (_, frame) => {
              const time = (spanDuration * frame) / 60;
              let rise = cjk
                ? 1 - sampleSpring(1, 0, time, Math.sqrt(14), 3.5).position
                : springProgress(time, response);
              if (frame === 60) rise = 1;
              const envelope =
                frame === 60
                  ? 0
                  : springProgress(time, response) *
                    (1 - springProgress(time - hold, response));

              // Gentle, subtle Apple Music character lift (1.5px - 2.1px instead of 7px)
              const lift = (1.5 + 0.8 * emphasis) * envelope;
              // Very gentle micro-spacing
              const x = (index - (count - 1) / 2) * 0.01 * envelope;
              // Very subtle scale (max 1.02x to remove jumpiness)
              const scale = 1 + 0.02 * envelope;

              return {
                offset: frame / 60,
                transform: `translate(calc(${x}em * var(--am-lyrics-lift, 1)), calc((var(--char-rise-y, -2px) * ${rise} - ${lift}px) * var(--am-lyrics-lift, 1))) scale(${scale})`,
              };
            });

            if (AmLyricsClass.characterFrames && AmLyricsClass.characterFrames.size >= 128) {
              AmLyricsClass.characterFrames.delete(
                AmLyricsClass.characterFrames.keys().next().value
              );
            }
            AmLyricsClass.characterFrames?.set(frameKey, frames);
          }

          if (glow) {
            char.setAttribute('data-glyph', char.textContent || '');
            char.setAttribute('data-glow', '');
            char.style.setProperty('--char-glow-max', `${glow}`);
            char.style.setProperty('--char-glow-duration', `${spanDuration * 1000}ms`);
            char.style.setProperty('--char-glow-delay', `${startDelay - elapsed}ms`);
          }
          char.classList.add('native-motion');
          const animation = char.animate(frames, {
            duration: spanDuration * 1000,
            delay: startDelay,
            fill: 'both',
            easing: 'linear',
          });
          animation.currentTime = Math.min(elapsed, end);
          entry = {
            animation,
            end,
            key,
            glowEpoch: elapsed,
          };
          AmLyricsClass.characterAnimations?.set(char, entry);
        } else if (
          Math.abs(Number(entry.animation.currentTime) - Math.min(elapsed, entry.end)) > 200
        ) {
          entry.animation.currentTime = Math.min(elapsed, entry.end);
        }
      });
    });
  };
}

/**
 * Injects enhanced styling into an <am-lyrics> shadowRoot
 */
export function injectShadowRootLiftStyles(root: ShadowRoot | null | undefined): void {
  if (!root) return;
  // Guard: if already injected, do nothing (prevents infinite mutation loops)
  if (root.querySelector('#enhanced-am-lyrics-styles')) return;

  const style = document.createElement('style');
  style.id = 'enhanced-am-lyrics-styles';
  style.textContent = `
    /* Apple SF Pro Display typography */
    :host,
    .lyrics-container,
    .lyrics-line,
    .lyrics-line-container,
    .main-vocal-container,
    .lyrics-syllable,
    .lyrics-word,
    span.char {
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
      letter-spacing: -0.022em;
    }

    /* Hide top controls (header, romanization/translation toggles, download buttons) */
    .lyrics-header,
    .header-controls,
    .download-controls {
      display: none !important;
    }

    /* Hide bottom credit, songwriters, source, and version footer */
    .lyrics-footer {
      visibility: hidden !important;
      pointer-events: none !important;
    }
    .lyrics-footer * {
      display: none !important;
    }

    /* Smooth 3D subpixel rendering for all character glyphs */
    .lyrics-syllable span.char {
      display: inline-block !important;
      will-change: transform !important;
      transform-origin: 50% 80% !important;
      -webkit-font-smoothing: antialiased;
      backface-visibility: hidden;
    }

    /* Fallback floating lift for words rendered as whole units */
    .lyrics-line.active .lyrics-word.word-started .lyrics-syllable.no-chars {
      transform: translate3d(0, calc(var(--char-rise-y, -2px) * var(--am-lyrics-lift, 1)), 0) !important;
      transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
    }

    /* Force left alignment on mobile */
    @media (max-width: 768px) {
      .lyrics-container {
        padding-left: 0 !important;
        --am-lyrics-inline-padding: 0px !important;
      }
      .lyrics-line,
      .lyrics-line-container,
      .main-vocal-container,
      .background-vocal-wrap {
        text-align: left !important;
        justify-content: flex-start !important;
        transform-origin: left center !important;
      }
      .lyrics-line {
        padding-left: 0 !important;
      }
      .lyrics-syllable {
        text-align: left !important;
      }
    }
  `;
  root.appendChild(style);
}
