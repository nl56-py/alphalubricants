import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import {ProductCard} from '@/components/shop/product-card';
import {toShopProduct} from '@/components/shop/types';
import {getProducts} from '@/lib/server/catalog';
export async function HomeProducts(){const all=await getProducts();const products=all.filter(p=>p.featured).slice(0,3);return <section id="our-products" className="home-products" data-reveal><div className="wrap"><div className="section-heading"><div><p className="eyebrow">OUR PRODUCT CATALOGUE</p><h2>Power for your engine.<br/><span>Confidence for your ride.</span></h2><p>Explore our range of motorcycle engine oils.</p></div><Link className="outline-button" href="/products">View all products <ArrowUpRight size={17}/></Link></div><div className="shop-product-grid">{(products.length?products:all.slice(0,3)).map(product=><ProductCard key={product.id} product={toShopProduct(product)}/>)}</div></div></section>}
