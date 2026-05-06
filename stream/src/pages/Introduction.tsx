import React, { useState, useRef } from 'react';
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

  // Global scroll tracking for Parallax
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Background slow parallax (moves down slightly as you scroll down)
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  
  // Hero section fade and scale
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.9]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, 100]);

  return (
    <div className="fm-intro-page" ref={containerRef}>
      
      {/* GLOBAL PARALLAX BACKGROUND */}
      <motion.div 
        className="fm-bg-far"
        style={{ y: bgY }}
      />
      <div className="fm-bg-overlay" />
      
      <header className="fm-header">
        <div className="fm-logo" onClick={() => navigate('/')}>
          <img src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/logo.gif" alt="LSFPlus" />
        </div>
        <button className="fm-signin-btn" onClick={() => navigate('/login')}>Sign In</button>
      </header>

      {/* HERO SECTION */}
      <section className="fm-hero-section">
        <motion.div 
          className="fm-hero-content"
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        >
          <motion.h1 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fm-hero-title"
          >
            Unlimited movies, TV <br /> shows, and more
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.8, delay: 0.3 }}
            className="fm-hero-subtitle"
          >
            Watch anywhere. Cancel anytime. Ready to dive in?
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <button className="fm-hero-btn" onClick={() => navigate('/login')}>
              Get Started <ChevronRight size={24} />
            </button>
          </motion.div>
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
      <section className="fm-section fm-features">
        <motion.h2 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="fm-section-title"
        >
          Why LSFPlus?
        </motion.h2>
        
        <div className="fm-features-grid">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
            >
              <TiltCard className="fm-feature-card" maxTilt={10} zDepth={20}>
                <div className="fm-feature-icon">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* DEVICES PARALLAX */}
      <section className="fm-section fm-devices">
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
            <div className="fm-device tv">
              <Monitor size={64} color="#e50914" />
              <span>Smart TV</span>
            </div>
            <div className="fm-device laptop">
              <Monitor size={48} color="#e50914" />
              <span>Laptop</span>
            </div>
            <div className="fm-device mobile">
              <Smartphone size={32} color="#e50914" />
              <span>Mobile</span>
            </div>
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
