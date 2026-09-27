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

  // 3. Patch _onTimeChanged to ensure played lines are dynamically updated during playback
  const proto = AmLyricsClass.prototype;
  const originalOnTimeChanged = proto._onTimeChanged;
  if (originalOnTimeChanged && !proto.__enhancedPlayedPatched) {
    proto.__enhancedPlayedPatched = true;
    proto._onTimeChanged = function (oldTime: number, newTime: number) {
      this.hidePlayedLines = true;
      if (typeof this.updatePlayedLines === 'function') {
        this.updatePlayedLines(newTime);
      }
      return originalOnTimeChanged.call(this, oldTime, newTime);
    };
  }

  // 4. Patch setUserScrolling to sync classes on host element and container smoothly
  const originalSetUserScrolling = proto.setUserScrolling;
  if (originalSetUserScrolling && !proto.__enhancedUserScrollPatched) {
    proto.__enhancedUserScrollPatched = true;
    proto.setUserScrolling = function (value: boolean) {
      originalSetUserScrolling.call(this, value);
      if (value) {
        this.classList.add('user-scrolling');
        this.lyricsContainer?.classList.add('user-scrolling');
      } else {
        this.classList.remove('user-scrolling');
        this.lyricsContainer?.classList.remove('user-scrolling');
      }
    };
  }
}

/**
 * Injects enhanced styling into an <am-lyrics> shadowRoot
 */
export function injectShadowRootLiftStyles(root: ShadowRoot | null | undefined): void {
  if (!root) return;

  // Always ensure scroll / wheel / touch listeners are attached to .lyrics-container whenever it's present
  const container = root.querySelector('.lyrics-container') as HTMLElement | null;
  if (container && !(container as any).__enhancedScrollBound) {
    (container as any).__enhancedScrollBound = true;
    const amLyrics = root.host as any;

    const onUserScrollActivity = () => {
      if (amLyrics && !amLyrics.isProgrammaticScroll && !amLyrics.isClickSeeking) {
        if (typeof amLyrics.handleUserScroll === 'function') {
          amLyrics.handleUserScroll();
        } else if (typeof amLyrics.setUserScrolling === 'function') {
          amLyrics.setUserScrolling(true);
        }
      }
    };

    container.addEventListener('scroll', onUserScrollActivity, { passive: true });
    container.addEventListener('wheel', onUserScrollActivity, { passive: true });
    container.addEventListener('touchmove', onUserScrollActivity, { passive: true });
    container.addEventListener('touchstart', onUserScrollActivity, { passive: true });
  }

  // Guard: if style already injected, do nothing further (prevents duplicate style injection)
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

    /* Desktop Balanced Lyric Typography */
    @media (min-width: 769px) {
      :host,
      .lyrics-container {
        --lyplus-font-size-base: 2.75rem !important;
        --am-lyrics-wide-font-size: 2.75rem !important;
        --am-lyrics-line-spacing: 2.2rem !important;
        --am-lyrics-line-height: 1.28 !important;
      }
      .lyrics-line {
        font-size: 2.75rem !important;
        line-height: 1.28 !important;
        margin-block-end: 2.2rem !important;
      }
    }

    @media (min-width: 1300px) {
      :host,
      .lyrics-container {
        --lyplus-font-size-base: 3.05rem !important;
        --am-lyrics-wide-font-size: 3.05rem !important;
        --am-lyrics-line-spacing: 2.4rem !important;
        --am-lyrics-line-height: 1.28 !important;
      }
      .lyrics-line {
        font-size: 3.05rem !important;
        line-height: 1.28 !important;
        margin-block-end: 2.4rem !important;
      }
    }

    /* Video Player Compact Floating Lyrics Scale */
    :host(.video-am-lyrics-player),
    :host(.video-am-lyrics-player) .lyrics-container {
      --lyplus-font-size-base: 1.95rem !important;
      --am-lyrics-wide-font-size: 1.95rem !important;
      --am-lyrics-line-spacing: 1.7rem !important;
      --am-lyrics-line-height: 1.32 !important;
      --lyrics-scroll-padding-top: 24% !important;
      --am-lyrics-inline-padding: 1.2rem !important;
    }
    :host(.video-am-lyrics-player) .lyrics-line {
      font-size: 1.95rem !important;
      line-height: 1.32 !important;
      margin-block-end: 1.7rem !important;
    }

    @media (max-width: 768px) {
      :host(.video-am-lyrics-player),
      :host(.video-am-lyrics-player) .lyrics-container {
        --lyplus-font-size-base: 1.45rem !important;
        --am-lyrics-compact-font-size: 1.45rem !important;
        --am-lyrics-line-spacing: 1.25rem !important;
        --am-lyrics-line-height: 1.3 !important;
        --lyrics-scroll-padding-top: 20% !important;
        --am-lyrics-inline-padding: 0.8rem !important;
      }
      :host(.video-am-lyrics-player) .lyrics-line {
        font-size: 1.45rem !important;
        line-height: 1.3 !important;
        margin-block-end: 1.25rem !important;
      }
    }

    @media (max-height: 520px) {
      :host(.video-am-lyrics-player),
      :host(.video-am-lyrics-player) .lyrics-container {
        --lyplus-font-size-base: 1.22rem !important;
        --am-lyrics-compact-font-size: 1.22rem !important;
        --am-lyrics-line-spacing: 1.1rem !important;
        --am-lyrics-line-height: 1.26 !important;
        --lyrics-scroll-padding-top: 16% !important;
        --am-lyrics-inline-padding: 0.5rem !important;
      }
      :host(.video-am-lyrics-player) .lyrics-line {
        font-size: 1.22rem !important;
        line-height: 1.26 !important;
        margin-block-end: 1.1rem !important;
      }
    }

    /* Dim unhighlighted words and inactive lines to authentic Apple Music contrast */
    :host {
      --lyplus-text-secondary: var(
        --am-lyrics-text-secondary,
        color-mix(in srgb, var(--lyplus-lyrics-palette, #ffffff), transparent 76%)
      ) !important;
    }

    /* Apple Music Focus Reset: Remove any focus outline or box-shadow on lyric lines */
    *,
    *:focus,
    *:focus-visible,
    .lyrics-container:focus,
    .lyrics-container:focus-visible,
    .lyrics-line:focus,
    .lyrics-line:focus-visible,
    .lyrics-line:focus::before,
    .lyrics-line:focus-visible::before {
      outline: none !important;
      box-shadow: none !important;
    }

    /* Universal smooth animations for all lyric lines */
    :host .lyrics-line,
    .lyrics-container .lyrics-line,
    .lyrics-line {
      will-change: opacity, transform, filter;
      transition:
        opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1),
        filter 0.75s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.75s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }

    /* Inactive upcoming lines: subtle, atmospheric preview */
    :host .lyrics-container:not(.user-scrolling):not(.touch-scrolling):not(.wheel-scrolling)
      .lyrics-line:not(.active):not(.pre-active):not(.played),
    .lyrics-container:not(.user-scrolling):not(.touch-scrolling):not(.wheel-scrolling)
      .lyrics-line:not(.active):not(.pre-active):not(.played) {
      opacity: 0.28 !important;
      filter: blur(0.06em) !important;
      transform: scale(0.97) !important;
      transition:
        opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
        filter 0.8s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }

    /* Active currently-sung line: 100% white, sharp, full prominence */
    :host .lyrics-line.active,
    .lyrics-line.active {
      opacity: 1 !important;
      filter: none !important;
      transform: scale(1) !important;
    }

    /* Pre-active upcoming line: smoothly illuminating */
    :host .lyrics-line.pre-active,
    .lyrics-line.pre-active {
      opacity: 0.88 !important;
      filter: blur(0.02em) !important;
      transform: scale(0.99) !important;
    }

    /* Finished / Done lines: gracefully fade out when in normal playback */
    :host .lyrics-container:not(.user-scrolling):not(.touch-scrolling):not(.wheel-scrolling)
      .lyrics-line.played:not(.active):not(.pre-active):not(.lyrics-gap),
    .lyrics-container:not(.user-scrolling):not(.touch-scrolling):not(.wheel-scrolling)
      .lyrics-line.played:not(.active):not(.pre-active):not(.lyrics-gap) {
      opacity: 0.05 !important;
      filter: blur(0.08em) !important;
      transform: scale(0.95) !important;
      pointer-events: auto !important;
      transition:
        opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1),
        filter 1.2s cubic-bezier(0.16, 1, 0.3, 1),
        transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }

    /* =========================================================================
       USER SCROLLING / BROWSING MODE:
       When user scrolls, ALL lines (including played/finished lines) smoothly
       FADE IN with a rich, silky Apple Music transition.
       Overriding AmLyrics's built-in 'transition: none !important' with high specificity.
       ========================================================================= */
    :host .lyrics-container.user-scrolling .lyrics-line,
    :host .lyrics-container.touch-scrolling .lyrics-line,
    :host .lyrics-container.wheel-scrolling .lyrics-line,
    .lyrics-container.user-scrolling .lyrics-line,
    .lyrics-container.touch-scrolling .lyrics-line,
    .lyrics-container.wheel-scrolling .lyrics-line {
      opacity: 0.85 !important;
      filter: blur(0px) !important;
      transform: scale(1) !important;
      transition:
        opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1),
        filter 0.75s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.75s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }

    /* The currently active line remains fully bright while user is scrolling */
    :host .lyrics-container.user-scrolling .lyrics-line.active,
    .lyrics-container.user-scrolling .lyrics-line.active {
      opacity: 1 !important;
      filter: none !important;
      transform: scale(1.02) !important;
    }

    /* Interactive hover brightening when browsing lyrics */
    @media (hover: hover) and (pointer: fine) {
      .lyrics-container .lyrics-line:hover {
        opacity: 1 !important;
        filter: none !important;
        transform: scale(1.02) !important;
        transition:
          opacity 0.25s ease,
          filter 0.25s ease,
          transform 0.25s ease !important;
      }
    }


    /* Prevent duplicate/overlapping letters: syllables with char children must stay completely transparent */
    .lyrics-syllable.has-chars,
    .lyrics-syllable.has-chars.finished,
    .lyrics-line .lyrics-syllable.has-chars {
      background-color: transparent !important;
      color: transparent !important;
      -webkit-text-fill-color: transparent !important;
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

    /* Duet line alignments */
    .lyrics-line.singer-right {
      text-align: right !important;
    }
    .lyrics-line.singer-right .lyrics-line-container,
    .lyrics-line.singer-right .main-vocal-container {
      text-align: right !important;
      justify-content: flex-end !important;
      transform-origin: right center !important;
    }

    /* Mobile duet & left alignment */
    @media (max-width: 768px) {
      .lyrics-container {
        padding-left: 0 !important;
        --am-lyrics-inline-padding: 0px !important;
      }
      .lyrics-line:not(.singer-right),
      .lyrics-line:not(.singer-right) .lyrics-line-container,
      .lyrics-line:not(.singer-right) .main-vocal-container,
      .lyrics-line:not(.singer-right) .background-vocal-wrap {
        text-align: left !important;
        justify-content: flex-start !important;
        transform-origin: left center !important;
      }
      .lyrics-line.singer-right,
      .lyrics-line.singer-right .lyrics-line-container,
      .lyrics-line.singer-right .main-vocal-container,
      .lyrics-line.singer-right .background-vocal-wrap {
        text-align: right !important;
        justify-content: flex-end !important;
        transform-origin: right center !important;
      }
      .lyrics-line {
        padding-left: 0 !important;
      }
      .lyrics-line:not(.singer-right) .lyrics-syllable {
        text-align: left !important;
      }
      .lyrics-line.singer-right .lyrics-syllable {
        text-align: right !important;
      }
    }
  `;
  root.appendChild(style);
}
