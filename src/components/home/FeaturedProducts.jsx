import { motion } from 'framer-motion';
import ProductCard from '../common/ProductCard';
import SectionHeading from '../common/SectionHeading';
import { staggerContainer, fadeUp } from '../../animations/variants';

export default function FeaturedProducts({ eyebrow, title, description, products }) {
  if (!products?.length) return null;
  return (
    <section className="section">
      <div className="container">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        <motion.div
          className="product-grid"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {products.map((p, i) => (
            <motion.div key={p.id} variants={fadeUp}>
              <ProductCard product={p} variantIndex={i} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
