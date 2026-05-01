# Room Booking Dashboard Enhancements - Requirements

## 1. Overview

### 1.1 Purpose
Transform the Room Booking Dashboard from a single-room booking form into a comprehensive cart-based booking system that matches and exceeds the capabilities of the POS accommodation module.

### 1.2 Goals
- Enable booking multiple rooms in a single transaction
- Add breakfast options with pricing
- Support custom pricing per room
- Implement item-specific notes
- Generate printable receipts
- Allow inline customer creation
- Maintain backward compatibility with existing bookings

### 1.3 Success Criteria
- Staff can book multiple rooms for families/groups in one transaction
- Breakfast can be added with automatic pricing calculation
- Custom rates can be applied per room
- Each room can have specific notes (e.g., "extra pillows", "ground floor")
- Booking confirmation receipt can be printed
- New customers can be created without leaving the booking page
- All existing bookings remain accessible and functional

---

## 2. User Stories

### 2.1 Multiple Room Booking
**As a** hotel receptionist  
**I want to** book multiple rooms in a single transaction  
**So that** I can efficiently handle family and group reservations

**Acceptance Criteria:**
- Can add multiple rooms to a booking cart
- Each room can have different check-in/check-out dates
- Each room can have different guest counts
- Can remove rooms from cart before confirming
- Total price updates automatically as rooms are added/removed

### 2.2 Breakfast Management
**As a** hotel receptionist  
**I want to** add breakfast to room bookings with automatic pricing  
**So that** I can offer complete packages to guests

**Acceptance Criteria:**
- Breakfast checkbox available for each room
- Breakfast price calculated as: price × guests × nights
- Breakfast total shown separately in booking summary
- Default breakfast price configurable (5,000 Fr)
- Breakfast selection saved with booking

### 2.3 Custom Pricing
**As a** hotel manager  
**I want to** apply custom rates to specific rooms  
**So that** I can offer discounts or special rates

**Acceptance Criteria:**
- Can edit price for each room in cart
- Original price displayed for reference
- Custom price overrides default room rate
- Total recalculates with custom price
- Custom price saved with booking

### 2.4 Item-Specific Notes
**As a** hotel receptionist  
**I want to** add specific notes to each room  
**So that** I can communicate special requests to housekeeping

**Acceptance Criteria:**
- Notes field available for each room in cart
- Notes can include special requests (extra pillows, ground floor, etc.)
- Notes saved with each room booking
- Notes visible in booking details and reports

### 2.5 Receipt Generation
**As a** hotel receptionist  
**I want to** print booking confirmation receipts  
**So that** I can provide guests with booking details

**Acceptance Criteria:**
- Receipt modal appears after successful booking
- Shows all booked rooms with details
- Displays pricing breakdown (subtotal, tax, breakfast, discount, total)
- Includes booking number and customer information
- Can be printed or downloaded as PDF
- Can be emailed to customer

### 2.6 Inline Customer Creation
**As a** hotel receptionist  
**I want to** create new customers during booking  
**So that** I don't have to navigate away from the booking page

**Acceptance Criteria:**
- "Add New Customer" button visible on booking page
- Modal opens with customer creation form
- Requires: name, email, phone (optional)
- New customer automatically selected after creation
- Customer added to database immediately
- Can continue booking without page refresh

---

## 3. Functional Requirements

### 3.1 Cart System

#### 3.1.1 Add Room to Cart
- User selects warehouse and date range
- System displays available rooms
- User clicks "Add to Cart" on room card
- Room added to cart with default values:
  - Quantity: calculated nights
  - Guests: 1
  - Breakfast: unchecked
  - Notes: empty

#### 3.1.2 Cart Display
- Cart sidebar shows all added rooms
- Each room displays:
  - Room number and type
  - Price per night
  - Number of nights
  - Guest count input
  - Breakfast checkbox
  - Notes field
  - Subtotal
  - Remove button

#### 3.1.3 Cart Totals
- Subtotal: sum of all room prices × nights
- Breakfast: sum of all breakfast charges
- Tax: 16% of subtotal
- Discount: manual input
- Total: subtotal + breakfast + tax - discount

#### 3.1.4 Cart Actions
- Update guest count per room
- Toggle breakfast per room
- Edit notes per room
- Edit price per room
- Remove room from cart
- Clear entire cart

### 3.2 Breakfast Pricing

#### 3.2.1 Calculation
```
Breakfast Total = Breakfast Price × Number of Guests × Number of Nights
```

#### 3.2.2 Configuration
- Default breakfast price: 5,000 Fr
- Configurable per room (future enhancement)
- Displayed separately in totals

#### 3.2.3 Display
- Checkbox for each room
- When checked, shows breakdown:
  - Price per person
  - Number of guests
  - Number of nights
  - Total breakfast cost

### 3.3 Custom Pricing

#### 3.3.1 Price Editing
- Click edit icon next to room price
- Input field appears
- Enter custom price
- Click save or press Enter
- Total recalculates immediately

#### 3.3.2 Price Display
- Show original price (strikethrough if custom)
- Show custom price (highlighted)
- Indicate custom pricing with icon

### 3.4 Receipt Generation

#### 3.4.1 Receipt Content
- Header: Company name, address, logo
- Booking number
- Customer name and contact
- Check-in and check-out dates
- Room list with details
- Pricing breakdown
- Payment information
- Footer: Thank you message

#### 3.4.2 Receipt Actions
- Print receipt
- Download as PDF
- Email to customer
- Close and return to bookings list

### 3.5 Inline Customer Creation

#### 3.5.1 Customer Form
- Name (required)
- Email (required)
- Phone (optional)
- Validation on submit
- Error messages for invalid data

#### 3.5.2 Creation Flow
1. Click "Add New Customer" button
2. Modal opens with form
3. Fill in customer details
4. Click "Create Customer"
5. Customer saved to database
6. Customer auto-selected in booking form
7. Modal closes
8. Continue with booking

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Cart updates must be instant (<100ms)
- Page load time <2 seconds
- Receipt generation <1 second
- Support up to 10 rooms in cart without lag

### 4.2 Usability
- Intuitive cart interface similar to POS
- Clear visual feedback for all actions
- Responsive design for tablets
- Keyboard shortcuts for common actions
- Undo capability for cart changes

### 4.3 Reliability
- No data loss on page refresh (session storage)
- Graceful error handling
- Transaction rollback on failure
- Validation before submission

### 4.4 Compatibility
- Works with existing room bookings
- Backward compatible with old booking format
- Supports all modern browsers
- Mobile-friendly interface

### 4.5 Security
- Validate all inputs server-side
- Prevent SQL injection
- Sanitize user inputs
- Check user permissions
- Audit trail for all bookings

---

## 5. Data Requirements

### 5.1 Database Changes

#### 5.1.1 New Fields for room_bookings Table
```sql
ALTER TABLE room_bookings ADD COLUMN booking_group_id VARCHAR(50) NULL;
ALTER TABLE room_bookings ADD COLUMN item_notes TEXT NULL;
ALTER TABLE room_bookings ADD COLUMN custom_price DECIMAL(10,2) NULL;
ALTER TABLE room_bookings ADD COLUMN breakfast_price DECIMAL(10,2) NULL;
```

#### 5.1.2 Field Descriptions
- `booking_group_id`: Links multiple rooms in one booking
- `item_notes`: Room-specific notes (e.g., "extra pillows")
- `custom_price`: Override price for this room
- `breakfast_price`: Price per person per night for breakfast

### 5.2 Data Validation
- Check-in date cannot be in the past
- Check-out date must be after check-in date
- Guest count must be ≤ room max occupancy
- Custom price must be ≥ 0
- Breakfast price must be ≥ 0

### 5.3 Data Integrity
- Booking group ID must be unique
- All rooms in group must have same customer
- All rooms in group must have same warehouse
- Payment must match total amount

---

## 6. Integration Requirements

### 6.1 Existing Systems
- Must work with current Room model
- Must work with current RoomBooking model
- Must integrate with Account module (revenue)
- Must integrate with existing payment system

### 6.2 API Endpoints
- `GET /room-bookings/available-rooms` - Get available rooms
- `POST /room-bookings/store` - Create booking (updated)
- `POST /room-bookings/customers/store` - Create customer
- `GET /room-bookings/{id}/receipt` - Get receipt data

---

## 7. User Interface Requirements

### 7.1 Layout
- Two-column layout: Room selection (left) + Cart (right)
- Cart fixed on right side, scrollable
- Room grid on left, scrollable
- Responsive: stack on mobile

### 7.2 Visual Design
- Consistent with POS design
- Use existing UI components
- Color-coded room types
- Clear visual hierarchy
- Loading states for async operations

### 7.3 Interactions
- Drag and drop to reorder cart items (future)
- Click to add room to cart
- Inline editing for prices and notes
- Hover states for all interactive elements
- Confirmation dialogs for destructive actions

---

## 8. Business Rules

### 8.1 Booking Rules
- Minimum booking: 1 night
- Maximum booking: 365 nights
- Cannot book past dates
- Cannot book unavailable rooms
- Cannot exceed room capacity

### 8.2 Pricing Rules
- Base price from room configuration
- Custom price overrides base price
- Breakfast price per person per night
- Tax calculated on subtotal only (not breakfast)
- Discount applied to final total

### 8.3 Payment Rules
- Full payment required for booking
- Partial payment creates pending status
- Zero payment creates unpaid status
- Overpayment not allowed

---

## 9. Constraints

### 9.1 Technical Constraints
- Must use existing Laravel/Inertia/React stack
- Must use existing database schema (with additions)
- Must maintain API compatibility
- Must work with existing authentication

### 9.2 Business Constraints
- Cannot break existing bookings
- Must complete in 4-5 days
- Must be testable in staging first
- Must have rollback plan

### 9.3 Resource Constraints
- Single developer implementation
- No additional infrastructure
- Use existing UI component library
- Reuse POS cart logic where possible

---

## 10. Assumptions

1. Breakfast price is uniform across all rooms
2. Tax rate is fixed at 16%
3. Users have basic computer literacy
4. Internet connection is stable
5. Existing room and customer data is valid
6. Payment gateway integration is out of scope
7. Email functionality already exists
8. PDF generation library is available

---

## 11. Dependencies

### 11.1 External Dependencies
- Laravel framework
- Inertia.js
- React
- Existing UI component library
- PDF generation library (for receipts)

### 11.2 Internal Dependencies
- Room model and controller
- RoomBooking model and controller
- Customer/User model
- Payment system
- Revenue/Account module

---

## 12. Risks and Mitigation

### 12.1 Risk: Data Loss
**Mitigation:** Use database transactions, implement session storage backup

### 12.2 Risk: Performance Issues
**Mitigation:** Optimize queries, implement caching, limit cart size

### 12.3 Risk: User Confusion
**Mitigation:** Provide training, add tooltips, create user guide

### 12.4 Risk: Breaking Changes
**Mitigation:** Maintain backward compatibility, thorough testing, staged rollout

### 12.5 Risk: Complex Cart Logic
**Mitigation:** Reuse proven POS cart code, extensive unit testing

---

## 13. Future Enhancements

### 13.1 Phase 2 Features
- Add products/services to booking (spa, tours, etc.)
- Package templates (honeymoon, family, business)
- Loyalty program integration
- Dynamic pricing based on demand
- Multi-currency support

### 13.2 Phase 3 Features
- Online booking portal for guests
- Calendar view for room selection
- Drag-and-drop room assignment
- Automated email confirmations
- SMS notifications

---

## 14. Acceptance Testing

### 14.1 Test Scenarios

#### Scenario 1: Book Multiple Rooms
1. Select warehouse and dates
2. Add 3 different rooms to cart
3. Set different guest counts
4. Add breakfast to 2 rooms
5. Add notes to each room
6. Complete booking
7. Verify all rooms created with correct data

#### Scenario 2: Custom Pricing
1. Add room to cart
2. Edit room price
3. Verify total updates
4. Complete booking
5. Verify custom price saved

#### Scenario 3: Breakfast Calculation
1. Add room with 2 guests, 3 nights
2. Enable breakfast
3. Verify calculation: 5,000 × 2 × 3 = 30,000
4. Complete booking
5. Verify breakfast charge in database

#### Scenario 4: Inline Customer Creation
1. Click "Add New Customer"
2. Fill in customer details
3. Create customer
4. Verify customer auto-selected
5. Complete booking
6. Verify customer in database

#### Scenario 5: Receipt Generation
1. Complete booking
2. Verify receipt modal appears
3. Check all details correct
4. Print receipt
5. Verify PDF generated

---

## 15. Documentation Requirements

### 15.1 User Documentation
- How to book multiple rooms
- How to add breakfast
- How to apply custom pricing
- How to create customers
- How to print receipts

### 15.2 Technical Documentation
- Database schema changes
- API endpoint documentation
- Component architecture
- State management flow
- Testing procedures

### 15.3 Training Materials
- Video tutorial for staff
- Quick reference guide
- FAQ document
- Troubleshooting guide

---

## 16. Success Metrics

### 16.1 Quantitative Metrics
- 50% reduction in booking time for groups
- 100% increase in breakfast attachment rate
- 30% increase in package bookings
- <2 seconds average booking completion time
- Zero data loss incidents

### 16.2 Qualitative Metrics
- Staff satisfaction with new system
- Guest feedback on booking experience
- Reduction in booking errors
- Ease of training new staff
- System reliability and uptime

---

## 17. Glossary

- **Cart**: Temporary storage for rooms before booking confirmation
- **Booking Group**: Multiple rooms booked together in one transaction
- **Custom Price**: Override price different from room's default rate
- **Item Notes**: Room-specific instructions or requests
- **Receipt**: Printed/digital confirmation of booking
- **Inline Creation**: Creating records without leaving current page

---

## 18. Approval

This requirements document must be approved by:
- [ ] Hotel Manager
- [ ] IT Manager
- [ ] Finance Manager
- [ ] Front Desk Supervisor

**Approved by:** _______________  
**Date:** _______________  
**Signature:** _______________
