import { z } from 'zod';

export const dealershipStatuses = ['NEW', 'CONTACTED', 'IN_REVIEW', 'APPROVED', 'CLOSED'] as const;
export const dealershipTypes = ['Retail dealership', 'Wholesale distribution', 'Workshop / service centre', 'Other'] as const;
export const dealershipSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(120),
  phone: z.string().trim().min(7, 'Enter a valid phone number.').max(30).regex(/^[+\d\s()-]+$/, 'Enter a valid phone number.'),
  businessName: z.string().trim().min(2, 'Business name must be at least 2 characters.').max(180),
  businessPhone: z.string().trim().max(30).optional().or(z.literal('')),
  address: z.string().trim().min(3, 'Address must be at least 3 characters.').max(300),
  email: z.string().trim().email().max(191).transform(v => v.toLowerCase()).optional().or(z.literal('')),
  district: z.string().trim().max(100).optional().or(z.literal('')),
  dealershipType: z.string().trim().max(60).optional().or(z.literal('')),
  experience: z.string().trim().max(100).optional().or(z.literal('')),
  message: z.string().trim().max(3000).optional().or(z.literal('')),
  consent: z.boolean().optional().default(true),
});
