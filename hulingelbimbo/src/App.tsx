import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
  type Variants,
  useInView,
  animate,
} from 'framer-motion';
import './index.css';

// ─── EASING ───────────────────────────────────────────────────────────────────

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as [number, number, number, number];

// ─── ANIMATION VARIANTS ───────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: EASE_OUT_EXPO, delay },
  }),
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    transition: { duration: 1.0, ease: 'easeOut' as const, delay },
  }),
};

const slideLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.85, ease: EASE_OUT_EXPO, delay },
  }),
};

const slideRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.85, ease: EASE_OUT_EXPO, delay },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 1.0, ease: EASE_OUT_EXPO, delay },
  }),
};

const letterVariants: Variants = {
  hidden: { opacity: 0, y: 60, rotateX: 35 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: 0.5 + i * 0.045,
      duration: 0.75,
      ease: EASE_OUT_EXPO,
    },
  }),
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const mobileMenuVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: EASE_OUT_EXPO,
      delayChildren: 0.15,
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: EASE_OUT_EXPO,
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const mobileMenuItemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT_EXPO },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: { duration: 0.25, ease: EASE_OUT_EXPO },
  },
};

// ─── MAGNETIC WRAPPER ────────────────────────────────────────────────────────
function Magnetic({ children }: { children: React.ReactElement }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 120, damping: 15, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;

    x.set(distanceX * 0.35);
    y.set(distanceY * 0.35);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY, display: 'inline-flex' }}
    >
      {children}
    </motion.div>
  );
}

// ─── ANIMATED COUNTER ────────────────────────────────────────────────────────
function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  useEffect(() => {
    if (isInView && ref.current) {
      const node = ref.current;
      const controls = animate(0, value, {
        duration,
        ease: 'easeOut',
        onUpdate(val) {
          node.textContent = Math.round(val).toString();
        },
      });
      return () => controls.stop();
    }
  }, [isInView, value, duration]);

  return <span ref={ref}>0</span>;
}

const charactersReveal: Variants = {
  hidden: { opacity: 0, x: 70, scale: 0.96 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 1.3,
      ease: EASE_OUT_EXPO,
      delay: 0.55,
    },
  },
};

// ─── FLOATING PARTICLES ───────────────────────────────────────────────────────

function Particle({ x, y, size, duration, delay }: {
  x: number; y: number; size: number; duration: number; delay: number;
}) {
  return (
    <motion.div
      className="particle"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      animate={{
        y: [0, -28, 0],
        opacity: [0, 0.55, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// ─── CHARACTER BACKDROP PARTICLES ────────────────────────────────────────────

const CHAR_PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  // Concentrate in the right 55% of the area (where characters live)
  x: 45 + Math.random() * 55,
  y: Math.random() * 100,
  size: 3 + Math.random() * 10,
  duration: 3.5 + Math.random() * 6,
  delay: Math.random() * 6,
  // Varied particle types: orb, ember, note
  type: i % 3,
}));

function CharParticle({ x, y, size, duration, delay, type }: {
  x: number; y: number; size: number; duration: number; delay: number; type: number;
}) {
  const isOrb = type === 0;
  const isNote = type === 1;

  if (isNote) {
    // Musical note floats up and fades
    return (
      <motion.div
        className="char-note"
        style={{ left: `${x}%`, top: `${y}%`, fontSize: `${size * 1.4}px` }}
        animate={{
          y: [0, -60, -90],
          opacity: [0, 0.7, 0],
          rotate: [0, -15, 10],
          scale: [0.6, 1, 0.5],
        }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      >
        {['♪', '♫', '♩'][Math.floor(size) % 3]}
      </motion.div>
    );
  }

  if (isOrb) {
    // Large soft bokeh glow
    return (
      <motion.div
        className="char-orb"
        style={{ left: `${x}%`, top: `${y}%`, width: size * 6, height: size * 6 }}
        animate={{
          opacity: [0, 0.18, 0.08, 0.22, 0],
          scale: [0.8, 1.1, 0.9, 1.2, 0.8],
        }}
        transition={{
          duration: duration * 1.4,
          delay,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    );
  }

  // Ember: small bright dot rising fast
  return (
    <motion.div
      className="char-ember"
      style={{ left: `${x}%`, top: `${y}%`, width: size * 0.8, height: size * 0.8 }}
      animate={{
        y: [0, -45, -80],
        opacity: [0, 0.9, 0],
        x: [0, (Math.random() - 0.5) * 20],
      }}
      transition={{
        duration: duration * 0.65,
        delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  );
}

function CharacterParticles() {
  return (
    <div className="char-particles-layer" aria-hidden>
      {CHAR_PARTICLES.map(p => (
        <CharParticle key={p.id} {...p} />
      ))}
    </div>
  );
}

// ─── ANIMATED WORD ────────────────────────────────────────────────────────────

function AnimatedWord({ text, className = '' }: { text: string; className?: string }) {
  const letters = text.split('');
  return (
    <span className={`animated-word ${className}`} style={{ display: 'inline-block', perspective: '600px' }}>
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          custom={i}
          variants={letterVariants}
          style={{ display: 'inline-block', transformOrigin: 'bottom center' }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </span>
  );
}

// ─── SCROLL PROGRESS BAR ─────────────────────────────────────────────────────

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 30 });
  return (
    <motion.div
      className="scroll-progress-bar"
      style={{ scaleX, transformOrigin: 'left' }}
    />
  );
}

// ─── NAV LOGO ────────────────────────────────────────────────────────────────

function NavLogo() {
  return (
    <a href="#home" className="nav-logo" aria-label="Ang Huling El Bimbo – Home">
      <span className="nav-logo-icon">♪</span>
      <span className="nav-logo-text">AHEB</span>
    </a>
  );
}


// ─── AWARD BADGE ─────────────────────────────────────────────────────────────

function AwardBadge({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="award-badge">
      <span className="award-icon">🏆</span>
      <div>
        <p className="award-value">{value}</p>
        <p className="award-label">{label}</p>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 2 + Math.random() * 3,
  duration: 5 + Math.random() * 5,
  delay: Math.random() * 5,
}));

const NAV_LINKS = ['HOME', 'STORY', 'TRAILER', 'CAST', 'GALLERY', 'STREAM'];

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const heroRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const zeroVal = useMotionValue(0);
  const { scrollY } = useScroll();

  const [showStickyCta, setShowStickyCta] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const [cursorHovered, setCursorHovered] = useState(false);

  const cursorSpringX = useSpring(cursorX, { stiffness: 450, damping: 28 });
  const cursorSpringY = useSpring(cursorY, { stiffness: 450, damping: 28 });

  // ── Desktop parallax ──────────────────────────────────────────────────────
  // Hero parallax
  const heroBgY = useTransform(scrollY, [0, 700], [0, 160]);
  const heroContentY = useTransform(scrollY, [0, 700], [0, 90]);
  const heroOpacity = useTransform(scrollY, [0, 450], [1, 0]);

  // Cast parallax
  const castLeftY = useTransform(scrollY, [0, 600], [0, 55]);
  const castRightY = useTransform(scrollY, [0, 600], [0, 75]);
  const castOpacity = useTransform(scrollY, [0, 320], [1, 0]);

  // Mouse parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const bgMouseX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { stiffness: 75, damping: 22 });
  const bgMouseY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-6, 6]), { stiffness: 75, damping: 22 });
  const charMouseX = useSpring(useTransform(mouseX, [-0.5, 0.5], [12, -12]), { stiffness: 75, damping: 22 });
  const charMouseY = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 75, damping: 22 });

  const spotlightMouseX = useSpring(useTransform(mouseX, [-0.5, 0.5], [30, -30]), { stiffness: 60, damping: 20 });
  const spotlightMouseY = useSpring(useTransform(mouseY, [-0.5, 0.5], [20, -20]), { stiffness: 60, damping: 20 });

  const heroCharactersY = useTransform(scrollY, [0, 700], [0, 130]);

  // ── Mobile parallax ───────────────────────────────────────────────────────
  // Background moves slower than scroll (subtle depth)
  const mobileBgY = useTransform(scrollY, [0, 700], [0, 55]);
  // Characters rise slightly as you scroll (different rate = depth)
  const mobileCharY = useTransform(scrollY, [0, 700], [0, -30]);
  // Content drifts up a little on scroll
  const mobileContentY = useTransform(scrollY, [0, 400], [0, 25]);
  // Fade opacity on scroll (same as desktop)
  const mobileHeroOpacity = useTransform(scrollY, [0, 450], [1, 0]);

  // Gyroscope / device orientation — tilt-based parallax for mobile
  const gyroX = useMotionValue(0);
  const gyroY = useMotionValue(0);
  const mobileBgTiltX = useSpring(useTransform(gyroX, [-20, 20], [-8, 8]), { stiffness: 60, damping: 18 });
  const mobileBgTiltY = useSpring(useTransform(gyroY, [-20, 20], [-5, 5]), { stiffness: 60, damping: 18 });
  const mobileCharTiltX = useSpring(useTransform(gyroX, [-20, 20], [10, -10]), { stiffness: 50, damping: 16 });
  const mobileCharTiltY = useSpring(useTransform(gyroY, [-20, 20], [6, -6]), { stiffness: 50, damping: 16 });

  // Story line animation
  const { scrollYProgress: storyProgress } = useScroll({
    target: storyRef,
    offset: ['start end', 'end start'],
  });
  const storyLineW = useTransform(storyProgress, [0.1, 0.5], ['0%', '100%']);

  // Gallery parallax
  const { scrollYProgress: galleryProgress } = useScroll({
    target: galleryRef,
    offset: ['start end', 'end start'],
  });
  const g1Y = useTransform(galleryProgress, [0, 1], [30, -30]);
  const g2Y = useTransform(galleryProgress, [0, 1], [-15, 15]);
  const g3Y = useTransform(galleryProgress, [0, 1], [45, -45]);

  useEffect(() => {
    const t = setTimeout(() => setHeroLoaded(true), 120);

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      if (window.scrollY > 50) setMobileMenuOpen(false);

      if (window.innerWidth <= 768) {
        setShowStickyCta(window.scrollY > 400);
      } else {
        setShowStickyCta(false);
      }
    };
    window.addEventListener('scroll', handleScroll);

    const handleMouse = (e: MouseEvent) => {
      if (window.innerWidth > 768) {
        mouseX.set(e.clientX / window.innerWidth - 0.5);
        mouseY.set(e.clientY / window.innerHeight - 0.5);
      }

      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      const target = e.target as HTMLElement;
      const isInteractive = target && (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('.gallery-item') ||
        target.closest('.meta-item')
      );
      setCursorHovered(!!isInteractive);
    };
    window.addEventListener('mousemove', handleMouse);

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);

    // ── Device orientation (gyroscope) for mobile parallax ────────────────
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (window.innerWidth > 768) return;
      // gamma = left/right tilt (-90 to 90), beta = front/back tilt (-180 to 180)
      const gx = Math.max(-20, Math.min(20, e.gamma ?? 0));
      const gy = Math.max(-20, Math.min(20, (e.beta ?? 0) - 45)); // 45° is natural hold angle
      gyroX.set(gx);
      gyroY.set(gy);
    };

    // Request permission on iOS 13+
    if (typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
      // Will be triggered on first user interaction
      const requestGyro = () => {
        (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> })
          .requestPermission()
          .then(permission => {
            if (permission === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation);
            }
          })
          .catch(() => {});
        document.removeEventListener('touchstart', requestGyro);
      };
      document.addEventListener('touchstart', requestGyro, { once: true });
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      clearTimeout(t);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [mouseX, mouseY, gyroX, gyroY]);

  // Close menu on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.navbar') && !target.closest('.mobile-menu')) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [mobileMenuOpen]);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const galleryImages = [
    'https://images.unsplash.com/photo-1507676184212-d0330a151d38?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=800&q=80',
  ];

  return (
    <div className="movie-page">
      <ScrollProgress />

      {/* ── NAVBAR ── */}
      <motion.nav
        className={`navbar ${scrolled ? 'scrolled' : ''}`}
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
      >
        <NavLogo />

        <div className="nav-links-left">
          {NAV_LINKS.map((link, i) => (
            <motion.a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="nav-link"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.07, duration: 0.5 }}
              whileHover={{ color: '#e0b77b', y: -2 }}
            >
              {link}
            </motion.a>
          ))}
        </div>

        <Magnetic>
          <motion.button
            className="nav-btn-gold"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.75, duration: 0.5, ease: EASE_OUT_EXPO }}
            whileHover={{ scale: 1.06, background: '#c7a066' }}
            whileTap={{ scale: 0.97 }}
          >
            BUY TICKETS
          </motion.button>
        </Magnetic>

        {/* Hamburger */}
        <button
          className={`mobile-menu-button ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen(prev => !prev)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className="burger-line" />
          <span className="burger-line" />
          <span className="burger-line" />
        </button>
      </motion.nav>

      {/* ── MOBILE FULLSCREEN MENU ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="mobile-menu"
            key="mobile-menu"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="mobile-menu-inner">
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="mobile-nav-link"
                  variants={mobileMenuItemVariants}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="mobile-link-num">0{i + 1}</span>
                  {link}
                </motion.a>
              ))}
              <motion.div
                className="mobile-menu-cta"
                variants={mobileMenuItemVariants}
              >
                <button className="btn-gold mobile-buy-btn" onClick={() => setMobileMenuOpen(false)}>
                  BUY TICKETS →
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <header className="hero-parallax" id="home" ref={heroRef}>
        {/* Parallax BG */}
        <motion.div
          className="hero-bg"
          initial={{ scale: 1.14, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2.2, ease: EASE_OUT_EXPO }}
          style={{
            y: isMobile ? mobileBgY : heroBgY,
            x: isMobile ? mobileBgTiltX : bgMouseX,
            backgroundPositionY: isMobile ? mobileBgTiltY : bgMouseY,
          }}
        />

        {/* Spotlight Behind Character */}
        <motion.div
          className="hero-spotlight"
          style={{
            x: isMobile ? 0 : spotlightMouseX,
            y: isMobile ? 0 : spotlightMouseY,
          }}
        />

        {/* Floating particles */}
        <div className="particles-layer" aria-hidden>
          {PARTICLES.map(p => (
            <Particle key={p.id} {...p} />
          ))}
        </div>

        {/* Gradient overlay */}
        <div className="hero-overlay" />

        {/* Character backdrop particles — behind characters, above overlay */}
        <CharacterParticles />

        {/* Hero characters */}
        <motion.div
          className="hero-characters-container"
          style={{
            y: isMobile ? mobileCharY : heroCharactersY,
            opacity: isMobile ? mobileHeroOpacity : heroOpacity,
            x: isMobile ? mobileCharTiltX : zeroVal,
          }}
        >
          <motion.div
            style={{
              x: isMobile ? mobileCharTiltX : charMouseX,
              y: isMobile ? mobileCharTiltY : charMouseY,
            }}
            variants={charactersReveal}
            initial="hidden"
            animate={heroLoaded ? 'visible' : 'hidden'}
            className="hero-characters-inner"
          >
            <motion.div
              animate={{
                y: [0, -12, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}
            >
              <img
                src="/images/characters.png"
                alt="Characters"
                className="hero-characters-img"
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ── Hero Content ── */}
        <motion.div
          className="hero-content-wrapper"
          style={{
            y: isMobile ? mobileContentY : heroContentY,
            opacity: isMobile ? mobileHeroOpacity : heroOpacity,
          }}
        >
          <AnimatePresence>
            {heroLoaded && (
              <motion.div className="hero-content" initial="hidden" animate="visible">

                {/* Now Streaming Badge */}
                <motion.div className="now-streaming-badge" variants={fadeIn} custom={0.1}>
                  <span className="badge-dot" />
                  NOW STREAMING
                </motion.div>

                {/* Director line */}
                <motion.p
                  className="director-text"
                  variants={fadeIn}
                  custom={0.25}
                >
                  WRITTEN BY ELIZHELL DIAZ
                </motion.p>

                {/* Title image */}
                <motion.div
                  variants={scaleIn}
                  custom={0.45}
                  className="title-image-wrapper"
                >
                  <motion.img
                    src="/images/el-bimbo-logo.webp"
                    alt="Ang Huling El Bimbo"
                    className="movie-title-image"
                  />
                </motion.div>


                {/* Tagline */}
                <motion.div
                  className="hero-tagline"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  <AnimatedWord text="Friendship." />
                  {' '}
                  <AnimatedWord text="Heartbreak." />
                  {' '}
                  <AnimatedWord text="Music." />
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                  className="hero-actions-center"
                  variants={fadeUp}
                  custom={1.0}
                >
                  <Magnetic>
                    <motion.button
                      className="btn-gold btn-primary-hero"
                      whileHover={{
                        scale: 1.06,
                        boxShadow: '0 0 35px rgba(224,183,123,0.45)',
                      }}
                      whileTap={{ scale: 0.96 }}
                    >
                      BUY TICKETS →
                    </motion.button>
                  </Magnetic>
                  <Magnetic>
                    <motion.button
                      className="btn-outline-hero"
                      whileHover={{ scale: 1.04, borderColor: 'rgba(224,183,123,0.6)' }}
                      whileTap={{ scale: 0.96 }}
                    >
                      ▶ WATCH TRAILER
                    </motion.button>
                  </Magnetic>
                </motion.div>

                {/* Runtime + Rating chips */}
                <motion.div className="hero-meta-chips" variants={fadeIn} custom={1.3}>
                  <span className="chip">PG-13</span>
                  <span className="chip-dot" />
                  <span className="chip-text">2h 32m</span>
                  <span className="chip-dot" />
                  <span className="chip-text">Musical Drama</span>
                </motion.div>

              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Starring — parallax ── */}
        <motion.div
          className="hero-bottom-left"
          style={{ y: castLeftY, opacity: castOpacity }}
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.3, duration: 0.9, ease: EASE_OUT_EXPO }}
        >
          <p className="starring-label">STARRING</p>
          <p className="starring-name">Merv Pring</p>
          <p className="starring-role">AS MARCO</p>
        </motion.div>

        <motion.div
          className="hero-bottom-right"
          style={{ y: castRightY, opacity: castOpacity }}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5, duration: 0.9, ease: EASE_OUT_EXPO }}
        >
          <p className="starring-label">AND</p>
          <p className="starring-name">Rich Ann Capuli</p>
          <p className="starring-role">AS JOY</p>
        </motion.div>

        {/* Scroll hint — absolutely positioned outside content to avoid collision */}
        <motion.div
          className="scroll-hint"
          style={{ opacity: castOpacity }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          <motion.span
            className="scroll-hint-dot"
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span>SCROLL</span>
        </motion.div>
      </header>

      {/* Section Divider between Hero & Awards Strip */}
      <div className="section-divider" />

      {/* ── AWARDS STRIP ── */}
      <motion.section
        className="awards-strip"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={fadeIn}
        custom={0}
      >
        <div className="awards-inner">
          {[
            { label: 'Total Wins', value: <><AnimatedCounter value={8} /> Awards</> },
            { label: 'Teatro Bonifacio', value: 'Best Musical' },
            { label: 'Teatro Bonifacio', value: 'Best Poster' },
            { label: 'Total Nominations', value: <><AnimatedCounter value={14} /> Nominations</> },
          ].map((award, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              custom={i * 0.1}
              className="award-item"
            >
              <AwardBadge label={award.label} value={award.value} />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── STORY SECTION ── */}
      <section className="story-section" id="story" ref={storyRef}>
        <div className="story-container">
          <motion.h2
            className="section-heading"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={slideLeft}
            custom={0}
          >
            The Story
            <motion.span
              className="heading-line"
              style={{ width: storyLineW }}
            />
          </motion.h2>

          <div className="story-layout">
            <div className="story-left">
              <motion.blockquote
                className="story-quote"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={slideLeft}
                custom={0.1}
              >
                <span className="quote-mark">"</span>
                A story told through the music that defined a generation.
                <span className="quote-mark">"</span>
              </motion.blockquote>

              {[
                "Three friends, a tragic past, and the music that binds them together. Experience the acclaimed Filipino musical that brings the iconic songs of the Eraserheads to life in a breathtaking cinematic experience. A journey of friendship, heartbreak, and redemption set against the vibrant backdrop of Manila in the 90s.",
                "Follow Emman, Anthony, and Hector — three college friends whose bond is tested by love, loss, and the passage of time. Joy, the girl who once stood between them, becomes the thread that weaves their story together across decades."
              ].map((para, index) => (
                <motion.p
                  key={index}
                  className="story-text"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-60px' }}
                  variants={fadeUp}
                  custom={0.2 + index * 0.15}
                >
                  {para}
                </motion.p>
              ))}
            </div>

            <motion.div
              className="story-right"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={slideRight}
              custom={0.2}
            >
              <div className="story-poster-frame">
                <img
                  src="/images/characters.png"
                  alt="Ang Huling El Bimbo Characters"
                  className="story-poster-img"
                />
                <div className="story-poster-glow" />
              </div>
            </motion.div>
          </div>

          {/* Meta cards */}
          <motion.div
            className="meta-info"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
          >
            {[
              { label: 'Director', value: 'Merv Pring', icon: '🎬' },
              { label: 'Writer', value: 'Elizhell Diaz', icon: '✍️' },
              { label: 'Music', value: 'Eraserheads', icon: '🎵' },
              { label: 'Runtime', value: '49m', icon: '⏱' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                className="meta-item"
                variants={fadeUp}
                custom={i * 0.1}
                whileHover={{ y: -5, transition: { duration: 0.25 } }}
              >
                <span className="meta-icon">{item.icon}</span>
                <span className="meta-label">{item.label}</span>
                <span className="meta-value">{item.value}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Section Divider between Story & Gallery */}
      <div className="section-divider" />

      {/* ── GALLERY ── */}
      <section className="gallery-section" id="gallery" ref={galleryRef}>
        <div className="gallery-header">
          <motion.h2
            className="section-heading gallery-heading"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={slideLeft}
          >
            Gallery
          </motion.h2>
          <motion.p
            className="gallery-subtext"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeIn}
            custom={0.2}
          >
            Behind the scenes &amp; production stills
          </motion.p>
        </div>

        <div className="gallery-grid" ref={galleryRef}>
          {galleryImages.map((url, i) => {
            const yVals = [g1Y, g2Y, g3Y];
            const delays = [0, 0.12, 0.24];
            return (
              <motion.div
                key={i}
                className="gallery-item"
                style={{
                  backgroundImage: `url('${url}')`,
                  y: isMobile ? zeroVal : yVals[i],
                }}
                initial={{ opacity: 0, scale: 0.93, y: 35 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: delays[i], duration: 0.9, ease: EASE_OUT_EXPO }}
                whileHover={{ scale: 1.03, transition: { duration: 0.35 } }}
              >
                <div className="gallery-item-overlay">
                  <span className="gallery-item-num">0{i + 1}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Section Divider between Gallery & CTA */}
      <div className="section-divider" />

      {/* ── CTA STRIP ── */}
      <motion.section
        className="cta-strip"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={fadeIn}
        custom={0}
      >
        {/* Decorative rings */}
        <div className="cta-ring cta-ring-1" aria-hidden />
        <div className="cta-ring cta-ring-2" aria-hidden />

        <motion.div className="cta-inner" variants={fadeUp} custom={0.2}>
          <p className="cta-label">EXPERIENCE IT LIVE</p>
          <h3 className="cta-heading">Don't miss the performance of a generation.</h3>
          <p className="cta-sub">Limited runs only. Secure your seats now.</p>
          <div className="cta-buttons">
            <Magnetic>
              <motion.button
                className="btn-gold"
                whileHover={{ scale: 1.07, boxShadow: '0 0 40px rgba(224,183,123,0.45)' }}
                whileTap={{ scale: 0.96 }}
              >
                BUY TICKETS →
              </motion.button>
            </Magnetic>
            <Magnetic>
              <motion.button
                className="btn-ghost"
                whileHover={{ scale: 1.04, borderColor: 'rgba(255,255,255,0.4)' }}
                whileTap={{ scale: 0.96 }}
              >
                VIEW SCHEDULE
              </motion.button>
            </Magnetic>
          </div>
        </motion.div>
      </motion.section>

      {/* ── FOOTER ── */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9 }}
      >
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="nav-logo-icon">♪</span>
            <span className="footer-brand-name">Ang Huling El Bimbo</span>
          </div>
          <div className="footer-links">
            {NAV_LINKS.map(link => (
              <a key={link} href={`#${link.toLowerCase()}`} className="footer-link">
                {link}
              </a>
            ))}
          </div>
          <p className="footer-copy">© {new Date().getFullYear()} Ang Huling El Bimbo Musical. All rights reserved.</p>
        </div>
      </motion.footer>

      {/* Sticky Mobile CTA */}
      <AnimatePresence>
        {showStickyCta && (
          <motion.div
            className="sticky-mobile-cta"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          >
            <button className="btn-gold sticky-cta-button">
              BUY TICKETS
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cursor Glow */}
      {!isMobile && (
        <motion.div
          className="cursor-glow"
          style={{
            x: cursorSpringX,
            y: cursorSpringY,
          }}
          animate={{
            scale: cursorHovered ? 2.0 : 1.0,
            opacity: cursorHovered ? 0.35 : 0.15,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      )}
    </div>
  );
}
