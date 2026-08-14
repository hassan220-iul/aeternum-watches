import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCard from '../components/common/ProductCard';
import { fetchProducts } from '../services/productsService';
import { categories, collections } from '../data/mockProducts';
import { staggerContainer, fadeUp } from '../animations/variants';

const PAGE_SIZE = 9;

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const search = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const collection = searchParams.get('collection') || '';
  const sort = searchParams.get('sort') || '';

  useEffect(() => {
    setLoading(true);
    fetchProducts({ search, category, collection, sort }).then((data) => {
      setProducts(data);
      setLoading(false);
      setPage(1);
    });
  }, [search, category, collection, sort]);

  const paginated = useMemo(
    () => products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [products, page]
  );
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  return (
    <div className="section shop">
      <div className="container">
        <div className="shop__header">
          <div>
            <p className="eyebrow">The Collection</p>
            <h1 style={{ fontSize: 'var(--fs-h1)', marginTop: '0.75rem' }}>Shop All Watches</h1>
          </div>
          <input
            type="search"
            placeholder="Search watches…"
            value={search}
            onChange={(e) => updateParam('q', e.target.value)}
            className="shop__search"
            aria-label="Search products"
          />
        </div>

        <div className="shop__filters" role="group" aria-label="Filters">
          <select value={category} onChange={(e) => updateParam('category', e.target.value)} aria-label="Filter by category">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <select value={collection} onChange={(e) => updateParam('collection', e.target.value)} aria-label="Filter by collection">
            <option value="">All Collections</option>
            {collections.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <select value={sort} onChange={(e) => updateParam('sort', e.target.value)} aria-label="Sort products">
            <option value="">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>

        {loading ? (
          <div className="product-grid">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '3/4' }} />)}
          </div>
        ) : paginated.length === 0 ? (
          <p className="shop__empty">No watches match those filters yet.</p>
        ) : (
          <motion.div className="product-grid" variants={staggerContainer} initial="hidden" animate="visible">
            {paginated.map((p, i) => (
              <motion.div key={p.id} variants={fadeUp}>
                <ProductCard product={p} variantIndex={i} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {totalPages > 1 && (
          <nav className="shop__pagination" aria-label="Pagination">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                aria-current={page === i + 1 ? 'page' : undefined}
                className={page === i + 1 ? 'is-active' : ''}
              >
                {i + 1}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
