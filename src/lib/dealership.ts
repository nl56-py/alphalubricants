import { z } from 'zod';

export const dealershipStatuses = ['NEW', 'CONTACTED', 'IN_REVIEW', 'APPROVED', 'CLOSED'] as const;
export const dealershipTypes = ['Retail dealership', 'Wholesale distribution', 'Workshop / service centre', 'Other'] as const;
export const dealershipSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(191).transform(v => v.toLowerCase()),
  phone: z.string().trim().min(7).max(30).regex(/^[+\d\s()-]+$/, 'Enter a valid phone number.'),
  businessName: z.string().trim().min(2).max(180),
  address: z.string().trim().min(3).max(300),
  district: z.string().trim().min(2).max(100),
  dealershipType: z.enum(dealershipTypes),
  experience: z.enum(['Starting a new business', 'Less than 2 years', '2–5 years', 'More than 5 years']),
  message: z.string().trim().max(3000).default(''),
  consent: z.literal(true),
});
