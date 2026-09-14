export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://alphalubricant.com';
export const siteName = 'Alpha Lubricants Nepal';
export const defaultDescription = 'Shop Alpha motorcycle engine oils and semi synthetic lubricants in Nepal, with oil guidance, rider support and local service from Tinkune, Kathmandu.';
export const businessPhone = '+9779801226178';
export const businessEmail = 'info@alphalubricant.com';
export const businessAddress = {
  streetAddress: 'Tinkune',
  addressLocality: 'Kathmandu',
  addressRegion: 'Bagmati',
  postalCode: '44600',
  addressCountry: 'NP'
};
export const faqs = [
  {q:'How do I choose the right motorcycle engine oil in Nepal?',a:'Match the SAE viscosity and API or JASO specification in your motorcycle owner’s manual. Consider the manufacturer’s guidance for your temperature range and riding conditions. Contact Alpha with your model and year for help choosing a compatible product.'},
  {q:'What is the difference between synthetic and mineral engine oil?',a:'Synthetic and semi synthetic oils use different base oil formulations from mineral oils. The right choice depends on the engine’s required specification, viscosity and service interval. Always follow the vehicle manufacturer’s recommendation.'},
  {q:'How often should I change my engine oil?',a:'Follow the time or distance interval in your owner’s manual, whichever comes first. Stop-start traffic, dust, heavy loads and short trips can count as severe service. Check the oil level regularly and ask your workshop about the appropriate schedule.'},
  {q:'Where can I buy Alpha Lubricants in Kathmandu?',a:'Browse the Alpha online catalogue or contact our team in Tinkune, Kathmandu on +977 9801226178 for product availability and delivery arrangements.'},
  {q:'Can I use a rider promo code on my order?',a:'Yes. Enter your code at checkout before placing your order. Valid codes apply to eligible orders, subject to their minimum purchase, expiry and usage limits. Your discount is shown before confirmation.'},
];
export function jsonLd(value: unknown) {return JSON.stringify(value).replace(/</g,'\\u003c');}
