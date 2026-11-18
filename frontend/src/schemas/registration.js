import { z } from 'zod'

const digitsOpt = z.string().regex(/^\d*$/, 'Enter numbers only').optional()
const phone = z.string().regex(/^[+\d][\d\s-]{8,14}$/, 'Enter a valid phone number')

export const registrationSchema = z.object({
  businessName: z.string().trim().min(2, 'Enter your business name'),
  businessType: z.string().min(1, 'Choose a business type'),
  category: z.string().min(1, 'Choose a category'),
  businessEmail: z.string().email('Enter a valid email'),
  businessPhone: phone,
  website: z.string().regex(/^$|^(https?:\/\/)?[\w-]+(\.[\w-]+)+.*$/, 'Enter a valid website').optional(),
  country: z.string().min(1, 'Select a country'),
  state: z.string().min(1, 'Select a state'),
  city: z.string().trim().min(2, 'Enter your city'),
  address: z.string().trim().min(8, 'Enter the complete address'),
  description: z.string().max(400, 'Keep it under 400 characters').optional(),

  branchCount: z.coerce.number({ invalid_type_error: 'Enter a number' }).int().min(1, 'At least 1 branch').max(500),
  employeeCount: z.coerce.number({ invalid_type_error: 'Enter a number' }).int().min(1, 'At least 1 employee').max(100000),
  monthlyCustomers: digitsOpt,
  monthlyTransactions: digitsOpt,
  openTime: z.string().min(1, 'Required'),
  closeTime: z.string().min(1, 'Required'),
  openingDate: z.string().min(1, 'Select the opening date'),
  offerings: z.string().trim().min(2, 'List at least one product or service'),
  branches: z.array(z.object({ name: z.string().trim().min(2, 'Branch name required'), city: z.string().trim().min(2, 'City required') })),

  ownerName: z.string().trim().min(2, 'Enter the owner’s full name'),
  ownerEmail: z.string().email('Enter a valid email'),
  ownerPhone: phone,
  password: z.string().min(8, 'At least 8 characters').regex(/[a-z]/, 'Add a lowercase letter').regex(/[A-Z]/, 'Add an uppercase letter').regex(/\d/, 'Add a number').regex(/[^A-Za-z0-9]/, 'Add a special character'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
  terms: z.literal(true, { errorMap: () => ({ message: 'Accept the terms to continue' }) }),
}).refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })
  .refine((d) => d.branches.length === d.branchCount, { path: ['branchCount'], message: 'Add details for each branch' })

export const STEP_FIELDS = [
  ['businessName', 'businessType', 'category', 'businessEmail', 'businessPhone', 'website', 'country', 'state', 'city', 'address', 'description'],
  ['branchCount', 'employeeCount', 'monthlyCustomers', 'monthlyTransactions', 'openTime', 'closeTime', 'openingDate', 'offerings', 'branches'],
  ['ownerName', 'ownerEmail', 'ownerPhone', 'password', 'confirmPassword', 'terms'],
]
