import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { easeLuxury } from '../../animations/variants';
import './hero.css';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero__backdrop" aria-hidden="true" />
      <div className="hero__grain" aria-hidden="true" />

      <div className="container hero__content">
        <motion.p
          className="eyebrow"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: easeLuxury }}
        >
          Est. atelier tradition
        </motion.p>

        <motion.h1
          className="hero__title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: easeLuxury }}
        >
          Time,<br />measured in generations.
        </motion.h1>

        <motion.p
          className="hero__sub"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55, ease: easeLuxury }}
        >
          Each Aeternum timepiece is assembled by hand, tested for a century of wear,
          and certified for the collector who buys once.
        </motion.p>

        <motion.div
          className="hero__actions"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.7, ease: easeLuxury }}
        >
          <Link to="/shop" className="btn btn-solid"><span>Explore the Collection</span></Link>
          <Link to="/about" className="btn btn-ghost"><span>Our Heritage</span></Link>
        </motion.div>
      </div>

      <motion.div
        className="hero__scroll-cue"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
      >
        <span />
      </motion.div>
    </section>
  );
}
