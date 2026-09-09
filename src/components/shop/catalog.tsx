'use client';

import { Search, SlidersHorizontal, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ProductCard } from './product-card';
import type { ShopProduct } from './types';

export function Catalog({ products, initialQuery = '', initialCategory = 'All products' }: { products: ShopProduct[]; initialQuery?: string; initialCategory?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState('featured');
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const categories = ['All products', ...new Set([...products.map(product => product.category), ...(initialCategory !== 'All products' ? [initialCategory] : [])])];
  const filtered = useMemo(() => products.filter(product => (category === 'All products' || product.category === category) && `${product.name} ${product.category} ${product.viscosity} ${product.size}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'price-low' ? a.pricePaisa - b.pricePaisa : sort === 'price-high' ? b.pricePaisa - a.pricePaisa : sort === 'name' ? a.name.localeCompare(b.name) : Number(b.featured) - Number(a.featured)), [products, query, category, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [query, category, sort]);
  return <><div className="shop-catalog-toolbar"><div className="shop-category-tabs" aria-label="Product categories">{categories.map(value => <button key={value} className={category === value ? 'is-active' : ''} onClick={() => setCategory(value)} aria-pressed={category === value}>{value}</button>)}</div><div className="shop-search"><Search size={18}/><input aria-label="Search products" placeholder="Find your engine oil" value={query} onChange={event => setQuery(event.target.value)}/></div></div>
    <div className="shop-results-bar"><span aria-live="polite">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span><label><SlidersHorizontal size={16}/><span className="shop-sr-only">Sort products</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A–Z</option></select></label></div>
    {filtered.length ? <><div className="shop-product-grid">{visible.map(product => <ProductCard product={product} key={product.id}/>)}</div>{pageCount > 1 && <nav className="site-pagination" aria-label="Product pages"><button className={page === 1 ? 'disabled' : ''} disabled={page === 1} onClick={() => setPage(value => value - 1)}>Previous</button><div>{Array.from({length:pageCount},(_,index)=>index+1).filter(value=>value===1||value===pageCount||Math.abs(value-page)<=1).map(value=><span key={value}><button aria-current={value===page?'page':undefined} onClick={()=>setPage(value)}>{value}</button></span>)}</div><button className={page === pageCount ? 'disabled' : ''} disabled={page === pageCount} onClick={() => setPage(value => value + 1)}>Next</button></nav>}</> : <div className="shop-empty"><Search size={32}/><h2>No products found</h2><p>Try a different product name or clear your filters.</p><button className="shop-button shop-button-outline" onClick={() => { setQuery(''); setCategory('All products'); }}>Clear filters</button></div>}
    <div className="shop-help-banner"><div><p className="shop-eyebrow">THE RIGHT OIL. THE RIGHT PERFORMANCE.</p><h2>Made for the road ahead.</h2><p>Always match your oil to the specification in your vehicle’s handbook.</p></div><Link className="shop-button shop-button-light" href="/contact">Talk to our team <ArrowRight size={18}/></Link></div>
  </>;
}
