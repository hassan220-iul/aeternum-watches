import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/home/Hero';
import FeaturedProducts from '../components/home/FeaturedProducts';
import Heritage from '../components/home/Heritage';
import ValueProps from '../components/home/ValueProps';
import Testimonials from '../components/home/Testimonials';
import VipBanner from '../components/home/VipBanner';
import { fetchProducts } from '../services/productsService';

export default function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  const newArrivals = products.filter((p) => p.isNew || p.is_new);
  const limited = products.filter((p) => p.isLimited || p.is_limited);
  const bestSellers = [...products].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));

  return (
    <>
      <Hero />
      <FeaturedProducts
        eyebrow="Best Sellers"
        title="What collectors reach for first."
        products={bestSellers.slice(0, 4)}
      />
      <Heritage />
      <FeaturedProducts
        eyebrow="New Arrivals"
        title="Just left the atelier."
        products={newArrivals.slice(0, 4)}
      />
      <ValueProps />
      <FeaturedProducts
        eyebrow="Limited Edition"
        title="Numbered. Never reissued."
        description="Once a limited run sells out, the design is retired permanently."
        products={limited.slice(0, 4)}
      />
      <Testimonials />
      <VipBanner />

      {}
      <Link to="/admin" className="admin-access-link" aria-label="Go to Admin Dashboard">
        <span>Admin Dashboard</span>
      </Link>
    </>
  );
}
