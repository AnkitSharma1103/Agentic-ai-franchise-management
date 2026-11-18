import { Scissors, UtensilsCrossed, Coffee, Hammer, ShoppingBag, Dumbbell, GraduationCap, Store } from 'lucide-react'

// Configuration-driven business modules. Phase 1 fully supports "salon"; others share the same shape.
export const BUSINESS_TYPES = {
  salon: { label: 'Salon & Spa', icon: Scissors, categories: ['Hair Salon', 'Beauty Parlour', 'Spa & Wellness', 'Unisex Salon'],
    labels: { appointments: 'Appointments', staff: 'Stylists', catalog: 'Services', products: 'Products' } },
  restaurant: { label: 'Restaurant', icon: UtensilsCrossed, categories: ['Fine Dining', 'Casual Dining', 'Quick Service', 'Cloud Kitchen'],
    labels: { appointments: 'Orders', staff: 'Kitchen Staff', catalog: 'Menu', products: 'Ingredients' } },
  cafe: { label: 'Cafe', icon: Coffee, categories: ['Coffee Shop', 'Bakery Cafe', 'Tea House'],
    labels: { appointments: 'Orders', staff: 'Baristas', catalog: 'Menu', products: 'Supplies' } },
  hardware: { label: 'Hardware Store', icon: Hammer, categories: ['Building Materials', 'Tools & Equipment', 'Plumbing & Electrical'],
    labels: { appointments: 'Purchases', staff: 'Staff', catalog: 'Products', products: 'Stock' } },
  retail: { label: 'Retail Store', icon: ShoppingBag, categories: ['Clothing', 'Grocery', 'Electronics', 'General Store'],
    labels: { appointments: 'Orders', staff: 'Staff', catalog: 'Products', products: 'Inventory' } },
  fitness: { label: 'Fitness & Gym', icon: Dumbbell, categories: ['Gym', 'Yoga Studio', 'CrossFit', 'Personal Training'],
    labels: { appointments: 'Sessions', staff: 'Trainers', catalog: 'Memberships', products: 'Equipment' } },
  education: { label: 'Education & Coaching', icon: GraduationCap, categories: ['Coaching Centre', 'Tuition', 'Skill Training'],
    labels: { appointments: 'Classes', staff: 'Instructors', catalog: 'Courses', products: 'Materials' } },
  other: { label: 'Other', icon: Store, categories: ['Other'],
    labels: { appointments: 'Bookings', staff: 'Staff', catalog: 'Offerings', products: 'Products' } },
}

export const typeLabel = (key) => BUSINESS_TYPES[key]?.label ?? 'Business'
