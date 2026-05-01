# Implementation Plan: Room Booking Dashboard Enhancements

## Overview

This implementation transforms the Room Booking Dashboard into a cart-based booking system that enables booking multiple rooms in a single transaction. The approach reuses proven patterns from the existing POS cart implementation while maintaining backward compatibility.

## Tasks

- [x] 1. Database schema updates for cart-based bookings
  - Create migration to add booking_group_id, item_notes, custom_price, breakfast_price, and includes_breakfast fields to room_bookings table
  - Create migration to add booking_group_id to room_booking_payments table
  - Add indexes for booking_group_id fields
  - _Requirements: 5.1.1, 5.1.2_

- [x] 2. Update RoomBooking model with new fields and relationships
  - Add fillable fields: booking_group_id, item_notes, custom_price, breakfast_price, includes_breakfast
  - Add bookingGroup() relationship method to query all bookings in same group
  - Add static generateBookingGroupId() helper method
  - _Requirements: 3.1, 5.1.2_

- [ ]* 3. Write unit tests for RoomBooking model enhancements
  - Test booking group ID generation uniqueness
  - Test bookingGroup() relationship returns correct records
  - Test fillable fields accept valid data
  - _Requirements: 5.1.2_

- [x] 4. Implement enhanced RoomBookingController store method
  - [x] 4.1 Add validation rules for cart-based booking
    - Validate items array structure (room_id, dates, guests, breakfast, notes, custom_price)
    - Validate customer_id, warehouse_id, payment_method, discount
    - Ensure at least 1 room in cart, maximum 10 rooms
    - _Requirements: 2.1, 3.1.1, 5.2_
  
  - [x] 4.2 Implement booking group creation logic
    - Generate unique booking_group_id
    - Loop through cart items and create RoomBooking for each
    - Calculate totals: subtotal, breakfast, tax (16%), discount
    - Check room availability before creating each booking
    - Update room status to 'reserved'
    - _Requirements: 2.1, 3.1.3, 3.2.1, 8.2_
  
  - [x] 4.3 Implement payment and revenue entry creation
    - Create single RoomBookingPayment record for the group
    - Link payment to booking_group_id
    - Create revenue entry for financial integration
    - Wrap all operations in database transaction
    - _Requirements: 3.1, 6.1, 8.3_
  
  - [x] 4.4 Add error handling and transaction rollback
    - Catch exceptions and rollback database transaction
    - Log errors with context (cart items, user_id, error message)
    - Return user-friendly error messages
    - _Requirements: 4.3, 5.3_

- [ ]* 5. Write integration tests for enhanced store method
  - Test successful multi-room booking creation
  - Test booking group ID linking across bookings
  - Test transaction rollback on room unavailability
  - Test custom pricing application
  - Test breakfast calculation and storage
  - Test discount distribution across bookings
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

- [x] 6. Implement inline customer creation endpoint
  - Add storeCustomer() method to RoomBookingController
  - Validate name (required), email (required, unique), phone (optional)
  - Create User with type='client' and assign 'client' role
  - Return JSON response with new customer data
  - Wrap in database transaction
  - _Requirements: 2.6, 3.5_

- [ ]* 7. Write unit tests for customer creation endpoint
  - Test successful customer creation
  - Test email uniqueness validation
  - Test required field validation
  - Test JSON response structure
  - _Requirements: 2.6, 3.5.1_

- [x] 8. Implement receipt generation endpoint
  - Add receipt() method to RoomBookingController
  - Query all bookings by booking_group_id with relationships (room, customer, warehouse, payment)
  - Calculate group totals
  - Return Inertia view with booking data
  - _Requirements: 2.5, 3.4_

- [ ] 9. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Create TypeScript interfaces for cart system
  - Define CartItem interface with all required fields
  - Define Room interface for available rooms
  - Define Customer interface
  - Define ReceiptData interface
  - _Requirements: 3.1, 3.4_

- [ ] 11. Build CartSidebar component
  - [ ] 11.1 Create CartSidebar component structure
    - Display list of cart items
    - Show room number, type, dates, nights
    - Add guest count input field
    - Add breakfast checkbox with price breakdown
    - Add notes textarea field
    - Add price edit functionality (click to edit)
    - Add remove item button
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1.2_
  
  - [ ] 11.2 Implement cart totals section
    - Calculate and display subtotal (sum of room prices × nights)
    - Calculate and display breakfast total
    - Calculate and display tax (16% of subtotal)
    - Add discount input field
    - Calculate and display final total
    - _Requirements: 3.1.3, 3.2.1, 8.2_
  
  - [ ] 11.3 Add cart action buttons
    - Add "Clear Cart" button
    - Add "Complete Booking" button
    - Disable "Complete Booking" if cart is empty
    - _Requirements: 3.1.4_

- [ ] 12. Build CustomerModal component
  - Create modal with customer creation form
  - Add form fields: name (required), email (required), phone (optional)
  - Implement form validation (email format, required fields)
  - Handle form submission via API
  - Display success/error messages
  - Auto-select new customer after creation
  - Close modal on success
  - _Requirements: 2.6, 3.5_

- [ ] 13. Build ReceiptModal component
  - Display company header (logo, name, address)
  - Show booking group number and customer information
  - List all booked rooms with details (room number, type, dates, guests, breakfast)
  - Display pricing breakdown (subtotal, breakfast, tax, discount, total)
  - Show payment information (method, amount, date)
  - Add action buttons: Print, Download PDF, Email, Close
  - Implement print functionality
  - _Requirements: 2.5, 3.4_

- [x] 14. Enhance RoomBookingCreate component with cart functionality
  - [x] 14.1 Add cart state management
    - Initialize cart state as empty array
    - Add selectedWarehouse, selectedCustomer, discountAmount state
    - Implement addToCart() function
    - Implement updateCartItem() function
    - Implement removeFromCart() function
    - _Requirements: 3.1.1, 3.1.4_
  
  - [x] 14.2 Implement cart calculation functions
    - calculateSubtotal() - sum of all room prices × nights
    - calculateBreakfastTotal() - sum of breakfast charges
    - calculateTaxAmount() - 16% of subtotal
    - calculateTotal() - subtotal + breakfast + tax - discount
    - _Requirements: 3.1.3, 3.2.1, 8.2_
  
  - [x] 14.3 Integrate CartSidebar component
    - Pass cart state and update functions as props
    - Pass calculation functions as props
    - Handle cart item updates from sidebar
    - _Requirements: 3.1.2, 3.1.4_
  
  - [x] 14.4 Implement room selection and add to cart
    - Fetch available rooms based on warehouse and date range
    - Display room grid with "Add to Cart" buttons
    - Add room to cart with default values on button click
    - Show visual feedback when room added
    - _Requirements: 2.1, 3.1.1_
  
  - [x] 14.5 Implement checkout flow
    - Validate cart has at least 1 room
    - Validate all required fields (customer, warehouse, payment method)
    - Submit cart data to backend store endpoint
    - Handle success: redirect to receipt page
    - Handle errors: display error messages
    - _Requirements: 2.1, 3.1, 5.2_
  
  - [x] 14.6 Integrate CustomerModal component
    - Add "Add New Customer" button
    - Open modal on button click
    - Handle customer creation success
    - Auto-select new customer in booking form
    - _Requirements: 2.6, 3.5_

- [x] 15. Implement custom pricing functionality
  - Add edit icon next to room price in cart
  - Show input field on click
  - Update cart item with custom price on save
  - Display original price (strikethrough) and custom price
  - Recalculate totals immediately
  - _Requirements: 2.3, 3.3_

- [x] 16. Implement breakfast pricing display
  - Show breakfast checkbox for each cart item
  - Display breakdown when checked: price × guests × nights
  - Update breakfast total in cart summary
  - Save breakfast selection with booking
  - _Requirements: 2.2, 3.2_

- [x] 17. Implement item-specific notes functionality
  - Add notes textarea for each cart item
  - Limit notes to 500 characters
  - Show character count
  - Save notes with booking
  - _Requirements: 2.4, 3.1.2_

- [ ] 18. Add session storage backup for cart
  - Save cart state to sessionStorage on every update
  - Restore cart from sessionStorage on page load
  - Clear sessionStorage after successful booking
  - _Requirements: 4.3_

- [ ] 19. Checkpoint - Test complete booking flow
  - Ensure all tests pass, ask the user if questions arise.

- [x] 20. Add routes for new endpoints
  - Add POST route for /room-bookings/customers/store
  - Add GET route for /room-bookings/receipt/{group_id}
  - Update POST route for /room-bookings/store to handle cart data
  - _Requirements: 6.2_

- [ ] 21. Update validation and error handling
  - Add client-side validation for cart items
  - Display inline error messages for invalid fields
  - Show toast notifications for API errors
  - Implement retry logic for network errors
  - _Requirements: 4.3, 5.2_

- [ ]* 22. Write end-to-end tests for complete user flows
  - Test full booking flow: select rooms → add to cart → modify → checkout → receipt
  - Test inline customer creation flow
  - Test custom pricing application
  - Test breakfast addition and calculation
  - Test discount application
  - Test cart persistence with session storage
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 23. Add logging and monitoring
  - Log successful booking group creation with context
  - Log booking failures with error details and cart data
  - Add performance monitoring for cart operations
  - _Requirements: 4.3_

- [ ] 24. Final checkpoint - Complete testing and verification
  - Run all migrations in staging environment
  - Test backward compatibility with existing bookings
  - Verify all new features work as expected
  - Test receipt generation and printing
  - Verify revenue integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The implementation reuses proven POS cart patterns for consistency
- All database operations use transactions for data integrity
- Backward compatibility is maintained throughout
