import { motion } from 'framer-motion';
import { fadeUp } from '../../animations/variants';

export default function SectionHeading({ eyebrow, title, description, align = 'left' }) {
  return (
    <motion.div
      className={`section-heading section-heading--${align}`}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
    >
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 style={{ fontSize: 'var(--fs-h2)', marginTop: '0.75rem' }}>{title}</h2>
      {description && <p className="section-heading__desc">{description}</p>}
    </motion.div>
  );
}
