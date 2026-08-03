import { motion } from 'framer-motion';
import SectionHeading from '../common/SectionHeading';
import { fadeUp, staggerContainer } from '../../animations/variants';

const TESTIMONIALS = [
  { name: 'C. Whitfield', role: 'Collector, London', quote: 'The fitting appointment alone told me this brand understands what long-term ownership should feel like.' },
  { name: 'R. Al-Amin', role: 'Collector, Dubai', quote: 'I have three Aeternum pieces now. The service turnaround has been faster than any maison I\u2019ve dealt with before.' },
  { name: 'M. Laurent', role: 'Collector, Geneva', quote: 'Buying local from a bench I could visit changed how I think about a watch\u2019s value.' },
];

export default function Testimonials() {
  return (
    <section className="section testimonials">
      <div className="container">
        <SectionHeading eyebrow="In Their Words" title="Owned, not just bought." align="center" />
        <motion.div
          className="testimonials__grid"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {TESTIMONIALS.map((t) => (
            <motion.figure key={t.name} className="testimonial card-glass" variants={fadeUp}>
              <blockquote>&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption>
                <strong>{t.name}</strong>
                <span>{t.role}</span>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
