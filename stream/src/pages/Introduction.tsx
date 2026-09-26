import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { ChevronRight, ShieldCheck, Sparkles, Globe, Monitor, Smartphone, Plus } from 'lucide-react';
import './Introduction.css';

// ─── DATA ─────────────────────────────────────────────────────────────
const faqs = [
  { question: "What is LSFPlus?", answer: "LSFPlus is a premium streaming service offering a wide variety of award-winning TV shows, movies, anime, documentaries, and more on thousands of internet-connected devices." },
  { question: "How much does it cost?", answer: "Watch anywhere, anytime. Plans range from affordable basic tiers to premium 4K Ultra HD options." },
  { question: "Where can I watch?", answer: "Watch anywhere, anytime. Sign in with your account to watch instantly on the web or on any internet-connected device." },
  { question: "How do I cancel?", answer: "LSFPlus is flexible. There are no pesky contracts and no commitments. You can easily cancel your account online in two clicks." }
];

const previewPosters = [
  { src: "/images/el-bimbo.webp", title: "Ang Huling El Bimbo" },
  { src: "/images/spoliarium.webp", title: "Spoliarium" },
  { src: "/images/tindahan.webp", title: "Tindahan ni Aling Nena" },
  { src: "/images/minsan.webp", title: "Minsan" },
  { src: "/images/alapaap.webp", title: "Alapaap" },
  { src: "/images/pare-ko.webp", title: "Pare Ko" },
];

const features = [
  {
    icon: <Sparkles className="intro-feature-icon" />,
    title: "Premium Experience",
    desc: "Immerse yourself in high-fidelity streaming with cinematic visuals and sound."
  },
  {
    icon: <ShieldCheck className="intro-feature-icon" />,
    title: "Secure & Private",
    desc: "Your data and viewing history are protected with industry-standard security."
  },
  {
    icon: <Globe className="intro-feature-icon" />,
    title: "Watch Anywhere",
    desc: "Available on all your devices. Start on your phone, finish on your TV."
  }
];

// ─── TILT CARD COMPONENT (3D Mouse Tracking) ─────────────────────────
const TiltCard = ({ children, className = "", maxTilt = 15, zDepth = 50 }: { children: React.ReactNode, className?: string, maxTilt?: number, zDepth?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-maxTilt, maxTilt]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
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
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`tilt-card-wrapper ${className}`}
    >
      <motion.div style={{ transform: `translateZ(${zDepth}px)`, width: '100%', height: '100%' }}>
        {children}
      </motion.div>
    </motion.div>
  );
};

// ─── MAIN LANDING PAGE ────────────────────────────────────────────────
export default function Introduction() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Refs for scroll sections
  const marqueeRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const devicesRef = useRef<HTMLDivElement>(null);

  // Global scroll tracking for Parallax
  const { scrollY, scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Mouse coordinate parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const mouseXSpring = useSpring(mouseX, { stiffness: 100, damping: 25 });
  const mouseYSpring = useSpring(mouseY, { stiffness: 100, damping: 25 });

  // Use mouse positions to transform ambient glow positions
  const orb1MouseX = useTransform(mouseXSpring, [-0.5, 0.5], [-40, 40]);
  const orb1MouseY = useTransform(mouseYSpring, [-0.5, 0.5], [-40, 40]);
  
  const orb2MouseX = useTransform(mouseXSpring, [-0.5, 0.5], [60, -60]);
  const orb2MouseY = useTransform(mouseYSpring, [-0.5, 0.5], [60, -60]);

  const orb3MouseX = useTransform(mouseXSpring, [-0.5, 0.5], [-50, 50]);
  const orb3MouseY = useTransform(mouseYSpring, [-0.5, 0.5], [-50, 50]);

  // Mousemove listener
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const xPct = (e.clientX / innerWidth) - 0.5;
      const yPct = (e.clientY / innerHeight) - 0.5;
      mouseX.set(xPct);
      mouseY.set(yPct);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Ambient orbs scroll tracking
  const orb1ScrollY = useTransform(scrollY, [0, 3000], [0, 400]);
  const orb2ScrollY = useTransform(scrollY, [0, 3000], [0, -300]);
  const orb3ScrollY = useTransform(scrollY, [0, 3000], [0, 200]);

  // Combine scroll vertical parallax and mouse vertical parallax
  const orb1Y = useTransform([orb1ScrollY, orb1MouseY], ([sY, mY]) => Number(sY) + Number(mY));
  const orb2Y = useTransform([orb2ScrollY, orb2MouseY], ([sY, mY]) => Number(sY) + Number(mY));
  const orb3Y = useTransform([orb3ScrollY, orb3MouseY], ([sY, mY]) => Number(sY) + Number(mY));

  // Background slow parallax (moves down slightly as you scroll down)
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  
  // Hero section fade and scale (based on scrollY to trigger within hero viewport)
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 600], [1, 0.92]);
  const heroY = useTransform(scrollY, [0, 600], [0, 150]);

  // Hero individual elements vertical parallax
  const heroTitleY = useTransform(scrollY, [0, 600], [0, 50]);
  const heroSubY = useTransform(scrollY, [0, 600], [0, 90]);
  const heroBtnY = useTransform(scrollY, [0, 600], [0, 130]);

  // Floating posters scroll translations
  const poster1Y = useTransform(scrollY, [0, 1000], [0, -180]);
  const poster2Y = useTransform(scrollY, [0, 1000], [0, -280]);
  const poster3Y = useTransform(scrollY, [0, 1000], [0, -120]);
  const poster4Y = useTransform(scrollY, [0, 1000], [0, -220]);

  // Marquee scroll-linked horizontal translations
  const { scrollYProgress: marqueeScrollProgress } = useScroll({
    target: marqueeRef,
    offset: ["start end", "end start"]
  });
  const marqueeX1 = useTransform(marqueeScrollProgress, [0, 1], [-250, 100]);
  const marqueeX2 = useTransform(marqueeScrollProgress, [0, 1], [100, -250]);

  // Features scroll-linked translations
  const { scrollYProgress: featuresScrollProgress } = useScroll({
    target: featuresRef,
    offset: ["start end", "end start"]
  });
  const featureCardY1 = useTransform(featuresScrollProgress, [0, 1], [50, -50]);
  const featureCardY2 = useTransform(featuresScrollProgress, [0, 1], [0, 0]);
  const featureCardY3 = useTransform(featuresScrollProgress, [0, 1], [-50, 50]);

  // Devices scroll-linked translations
  const { scrollYProgress: devicesScrollProgress } = useScroll({
    target: devicesRef,
    offset: ["start end", "end start"]
  });
  const tvY = useTransform(devicesScrollProgress, [0, 1], [40, -40]);
  const laptopY = useTransform(devicesScrollProgress, [0, 1], [-60, 60]);
  const mobileY = useTransform(devicesScrollProgress, [0, 1], [80, -80]);

  return (
    <div className="fm-intro-page" ref={containerRef}>
      
      {/* GLOBAL PARALLAX BACKGROUND */}
      <motion.div 
        className="fm-bg-far"
        style={{ y: bgY }}
      />
      <div className="fm-bg-overlay" />

      {/* AMBIENT GLOW ORBS (MOUSE & SCROLL PARALLAX) */}
      <motion.div 
        className="fm-ambient-orb orb-1"
        style={{ x: orb1MouseX, y: orb1Y }}
      />
      <motion.div 
        className="fm-ambient-orb orb-2"
        style={{ x: orb2MouseX, y: orb2Y }}
      />
      <motion.div 
        className="fm-ambient-orb orb-3"
        style={{ x: orb3MouseX, y: orb3Y }}
      />
      
      <header className="fm-header">
        <div className="fm-logo" onClick={() => navigate('/')}>
          <img src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/logo.gif" alt="LSFPlus" />
        </div>
        <button className="fm-signin-btn" onClick={() => navigate('/login')}>Sign In</button>
      </header>

      {/* HERO SECTION */}
      <section className="fm-hero-section">
        {/* Floating 3D Parallax Posters */}
        <motion.div 
          className="fm-floating-poster pos-left-top"
          style={{ y: poster1Y, rotate: -12 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.35, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          <img src="/images/el-bimbo.webp" alt="" />
        </motion.div>
        <motion.div 
          className="fm-floating-poster pos-right-top"
          style={{ y: poster2Y, rotate: 15 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <img src="/images/spoliarium.webp" alt="" />
        </motion.div>
        <motion.div 
          className="fm-floating-poster pos-left-bottom"
          style={{ y: poster3Y, rotate: 8 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <img src="/images/tindahan.webp" alt="" />
        </motion.div>
        <motion.div 
          className="fm-floating-poster pos-right-bottom"
          style={{ y: poster4Y, rotate: -10 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.35, scale: 1 }}
          transition={{ duration: 1, delay: 1.0 }}
        >
          <img src="/images/alapaap.webp" alt="" />
        </motion.div>

        <motion.div 
          className="fm-hero-content"
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h1 
              className="fm-hero-title"
              style={{ y: heroTitleY }}
            >
              Unlimited movies, TV <br /> shows, and more
            </motion.h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <motion.p 
              className="fm-hero-subtitle"
              style={{ y: heroSubY }}
            >
              Watch anywhere. Cancel anytime. Ready to dive in?
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <motion.div style={{ y: heroBtnY }}>
              <button className="fm-hero-btn" onClick={() => navigate('/login')}>
                Get Started <ChevronRight size={24} />
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* SCROLL PARALLAX MARQUEE */}
      <section className="fm-parallax-marquee-section" ref={marqueeRef}>
        <motion.div className="fm-marquee-row row-1" style={{ x: marqueeX1 }}>
          <div className="fm-marquee-content">
            <span>LSFPLUS ORIGINALS</span>
            <span className="bullet">•</span>
            <span>PRESTIGE ENTERTAINMENT</span>
            <span className="bullet">•</span>
            <span>DYNAMIC EXPERIENCE</span>
            <span className="bullet">•</span>
            <span>LSFPLUS ORIGINALS</span>
            <span className="bullet">•</span>
            <span>PRESTIGE ENTERTAINMENT</span>
            <span className="bullet">•</span>
            <span>DYNAMIC EXPERIENCE</span>
          </div>
        </motion.div>
        <motion.div className="fm-marquee-row row-2" style={{ x: marqueeX2 }}>
          <div className="fm-marquee-content">
            <span>UNLIMITED STREAMING</span>
            <span className="bullet">•</span>
            <span>CINEMATIC VISUALS</span>
            <span className="bullet">•</span>
            <span>WATCH ANYWHERE</span>
            <span className="bullet">•</span>
            <span>UNLIMITED STREAMING</span>
            <span className="bullet">•</span>
            <span>CINEMATIC VISUALS</span>
            <span className="bullet">•</span>
            <span>WATCH ANYWHERE</span>
          </div>
        </motion.div>
      </section>

      {/* TRENDING PREVIEWS */}
      <section className="fm-section fm-trending">
        <motion.h2 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="fm-section-title"
        >
          Trending Now
        </motion.h2>
        
        <div className="fm-carousel-container">
          <div className="fm-carousel-track">
            {previewPosters.map((poster, i) => (
              <TiltCard key={i} className="fm-poster-card" maxTilt={20} zDepth={40}>
                <img src={poster.src} alt={poster.title} />
                <div className="fm-poster-glow" />
                <div className="fm-poster-title">{poster.title}</div>
              </TiltCard>
            ))}
            {/* Duplicate for infinite effect */}
            {previewPosters.map((poster, i) => (
              <TiltCard key={`dup-${i}`} className="fm-poster-card" maxTilt={20} zDepth={40}>
                <img src={poster.src} alt={poster.title} />
                <div className="fm-poster-glow" />
                <div className="fm-poster-title">{poster.title}</div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="fm-section fm-features" ref={featuresRef}>
        <motion.h2 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="fm-section-title"
        >
          Why LSFPlus?
        </motion.h2>
        
        <div className="fm-features-grid">
          {features.map((feature, i) => {
            const cardY = i === 0 ? featureCardY1 : i === 1 ? featureCardY2 : featureCardY3;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
              >
                <motion.div style={{ y: cardY, height: '100%' }}>
                  <TiltCard className="fm-feature-card" maxTilt={10} zDepth={20}>
                    <div className="fm-feature-icon">
                      {feature.icon}
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.desc}</p>
                  </TiltCard>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* DEVICES PARALLAX */}
      <section className="fm-section fm-devices" ref={devicesRef}>
        <div className="fm-devices-text">
          <motion.h2 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="fm-section-title"
          >
            Watch Everywhere
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.2 }}
            className="fm-section-desc"
          >
            Stream unlimited movies and TV shows on your phone, tablet, laptop, and TV without paying more.
          </motion.p>
        </div>
        
        <div className="fm-devices-visual">
          <TiltCard className="fm-device-cluster" maxTilt={15} zDepth={60}>
            <motion.div className="fm-device tv" style={{ y: tvY }}>
              <Monitor size={64} color="#e50914" />
              <span>Smart TV</span>
            </motion.div>
            <motion.div className="fm-device laptop" style={{ y: laptopY }}>
              <Monitor size={48} color="#e50914" />
              <span>Laptop</span>
            </motion.div>
            <motion.div className="fm-device mobile" style={{ y: mobileY }}>
              <Smartphone size={32} color="#e50914" />
              <span>Mobile</span>
            </motion.div>
          </TiltCard>
        </div>
      </section>

      {/* FAQ */}
      <section className="fm-section fm-faq">
        <motion.h2 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="fm-section-title"
        >
          Frequently Asked Questions
        </motion.h2>
        
        <div className="fm-faq-list">
          {faqs.map((faq, idx) => (
            <motion.div 
              key={idx} 
              className={`fm-faq-item ${openFaq === idx ? 'open' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.1 }}
            >
              <button className="fm-faq-q" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                {faq.question}
                <motion.div animate={{ rotate: openFaq === idx ? 45 : 0 }}>
                  <Plus size={24} />
                </motion.div>
              </button>
              <motion.div 
                className="fm-faq-a-wrapper"
                initial={false}
                animate={{ height: openFaq === idx ? 'auto' : 0, opacity: openFaq === idx ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="fm-faq-a">{faq.answer}</div>
              </motion.div>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          className="fm-cta-bottom"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <p>Ready to watch? Sign up now to start your premium experience.</p>
          <button className="fm-hero-btn" onClick={() => navigate('/login')}>
            Get Started <ChevronRight size={24} />
          </button>
        </motion.div>
      </section>
      
      <footer className="fm-footer">
        <div className="fm-footer-content">
          <p>© 2026 LSFPlus. All rights reserved.</p>
          <div className="fm-footer-links">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Help Center</span>
          </div>
        </div>
      </footer>
      
    </div>
  );
}
