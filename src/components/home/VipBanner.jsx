import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fadeUp } from '../../animations/variants';

export default function VipBanner() {
  return (
    <section className="section vip-banner">
      <div className="container">
        <motion.div
          className="vip-banner__inner card-glass"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div>
            <p className="eyebrow">Aeternum Circle</p>
            <h2 style={{ fontSize: 'var(--fs-h2)', marginTop: '0.75rem' }}>
              Membership has its own calibre.
            </h2>
            <p className="vip-banner__desc">
              Early access to limited runs, complimentary annual servicing, and a private
              line to the atelier for appointments and provenance questions.
            </p>
          </div>
          <Link to="/register" className="btn btn-solid"><span>Request Membership</span></Link>
        </motion.div>
      </div>
    </section>
  );
}
