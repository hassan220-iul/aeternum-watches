import { motion } from 'framer-motion';
import SectionHeading from '../common/SectionHeading';
import { fadeUp, staggerContainer } from '../../animations/variants';

const MILESTONES = [
  { year: '1959', text: 'A single watchmaker opens a bench in Geneva, building movements to order for a handful of collectors.' },
  { year: '1978', text: 'The in-house calibre A-7 is certified, ending Aeternum\u2019s reliance on outside movement suppliers.' },
  { year: '2003', text: 'The atelier moves to its current home — a restored workshop where every case is still finished by hand.' },
  { year: 'Today', text: 'Fewer than 4,000 pieces leave the atelier each year, each one regulated for two full weeks before it ships.' },
];

export default function Heritage() {
  return (
    <section className="section heritage">
      <div className="container heritage__grid">
        <div>
          <SectionHeading
            eyebrow="Swiss Craftsmanship"
            title="A bench, not a factory."
            description="Aeternum has never scaled beyond what a watchmaker can personally sign off on. That constraint is the point."
          />
        </div>
        <motion.ol
          className="heritage__timeline"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {MILESTONES.map((m) => (
            <motion.li key={m.year} variants={fadeUp}>
              <span className="heritage__year">{m.year}</span>
              <p>{m.text}</p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
