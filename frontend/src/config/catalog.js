// Per-business-type catalogs used for seeding and for form dropdowns. Salon is the fully built demo.
const S = (name, price, category) => ({ name, price, category })
export const CATALOG = {
  salon: [S('Haircut & Styling', 600, 'Hair'), S('Hair Spa', 1800, 'Hair'), S('Hair Colour', 3500, 'Hair'), S('Keratin Treatment', 6500, 'Hair'), S('Classic Facial', 1500, 'Skin'), S('De-tan Cleanup', 1200, 'Skin'), S('Manicure & Pedicure', 1400, 'Spa'), S('Full Body Massage', 2800, 'Spa'), S('Bridal Makeup', 14000, 'Others'), S('Threading & Waxing', 500, 'Others')],
  restaurant: [S('Thali', 320, 'Dine-in'), S('Biryani Combo', 450, 'Delivery'), S('Party Platter', 3200, 'Catering'), S('Family Meal', 1100, 'Takeaway')],
  cafe: [S('Cappuccino', 180, 'Beverages'), S('Sandwich Combo', 320, 'Food'), S('Cake Slice', 220, 'Bakery'), S('Cold Brew', 240, 'Beverages')],
  hardware: [S('Cement Bags (10)', 3800, 'Building Materials'), S('Power Drill', 2800, 'Tools'), S('PVC Pipe Set', 1400, 'Plumbing & Electrical'), S('Paint 20L', 4600, 'Building Materials')],
  retail: [S('Cotton Kurta', 1299, 'Apparel'), S('Handbag', 1899, 'Accessories'), S('Bedsheet Set', 1599, 'Home'), S('Sneakers', 2499, 'Apparel')],
  fitness: [S('Monthly Membership', 1800, 'Memberships'), S('Personal Training (10)', 8000, 'Personal Training'), S('Yoga Class Pack', 2400, 'Classes'), S('Quarterly Membership', 4800, 'Memberships')],
  education: [S('Course Enrolment', 12000, 'Courses'), S('Weekend Workshop', 2500, 'Workshops'), S('Doubt-Clearing Session', 800, 'Coaching'), S('Test Series', 1800, 'Courses')],
  other: [S('Standard Service', 800, 'Core'), S('Premium Service', 2400, 'Packages'), S('Add-on', 300, 'Add-ons')],
}
const P = (name, category, price) => ({ name, category, price })
export const PRODUCTS = {
  salon: [P('Keratin Hair Mask 500ml', 'Hair Care', 1450), P('Professional Shampoo 1L', 'Hair Care', 820), P('Hair Colour – Natural Brown', 'Colour', 560), P('Hair Serum 100ml', 'Hair Care', 690), P('Facial Kit – Gold', 'Skin Care', 1250), P('Disposable Towels (pack)', 'Supplies', 320), P('Nail Polish Set', 'Nail', 780), P('Wax Strips (100)', 'Skin Care', 540), P('Face Mask Sheets (box)', 'Skin Care', 900), P('Massage Oil 500ml', 'Spa', 980), P('Beard Oil 50ml', 'Hair Care', 380), P('Hair Dryer Nozzle', 'Equipment', 450)],
  default: [P('Standard Item A', 'General', 400), P('Standard Item B', 'General', 650), P('Premium Item', 'Premium', 1800), P('Packaging Supplies', 'Supplies', 250), P('Consumable Pack', 'Supplies', 520), P('Accessory Kit', 'Accessories', 900)],
}
export const POSITIONS = {
  salon: ['Senior Stylist', 'Stylist', 'Beautician', 'Makeup Artist', 'Spa Therapist', 'Receptionist', 'Junior Stylist'],
  default: ['Associate', 'Senior Associate', 'Supervisor', 'Cashier'],
}
export const PAYMENTS = ['UPI', 'Cash', 'Card', 'Wallet']
