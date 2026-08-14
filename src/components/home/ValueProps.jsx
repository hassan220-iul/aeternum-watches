import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../../animations/variants';

const PROPS = [
  { title: 'Crafted for Generations', body: 'Every movement is built to be serviced, inherited, and worn for a hundred years — not replaced.' },
  { title: 'Swiss Precision', body: 'Assembled and regulated in-house by watchmakers trained in the same ateliers as the maisons you already trust.' },
  { title: 'White Glove Delivery', body: 'Personally hand-delivered and fitted, with an appointment scheduled around you.' },
  { title: 'Certificate of Authenticity', body: 'Every timepiece ships with a signed, numbered certificate verifying its provenance.' },
  { title: 'Lifetime Warranty', body: 'Mechanical faults are repaired free of charge for as long as you own the piece.' },
  { title: 'VIP Membership', body: 'Early access to limited runs, private appointments, and complimentary annual servicing.' },
];

export default function ValueProps() {
  return (
    <section className="section value-props">
      <div className="container">
        <motion.div
          className="value-props__grid"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {PROPS.map((prop) => (
            <motion.div key={prop.title} className="value-prop" variants={fadeUp}>
              <span className="value-prop__mark" aria-hidden="true" />
              <h3>{prop.title}</h3>
              <p>{prop.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
