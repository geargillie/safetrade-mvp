# SafeTrade Marketplace - Comprehensive Listing Flow Test Cases

## 🎯 TESTING OVERVIEW

This document contains comprehensive test cases for the complete SafeTrade listing lifecycle including:
- **Listing Creation Flow** (4 steps with validation)
- **Listing Updates & Modifications** 
- **Listing Deletion & Management**
- **Form Validation & Error Handling**
- **Image Upload & Management** (Cloudinary integration)
- **Auto-save & State Management**
- **Database Operations** (CRUD + Security)
- **User Permissions & Security**

---

## 📋 TEST CATEGORIES

### 1. LISTING CREATION FLOW TESTS

#### 1.1 Multi-Step Form Navigation Tests

**Test Case: TC-LC-001 - Step Navigation Forward**
```yaml
Objective: Verify user can navigate forward through all 4 steps successfully
Preconditions: User is authenticated and on /listings/create
Test Steps:
  1. Complete Step 1 (Basic Information) with valid data
  2. Click "Continue" button
  3. Verify navigation to Step 2
  4. Complete Step 2 (Vehicle Details) with valid data
  5. Click "Continue" button  
  6. Verify navigation to Step 3
  7. Complete Step 3 (Location & Photos) with valid data
  8. Click "Continue to Review"
  9. Verify navigation to Step 4
Expected Result: 
  - Each step transition occurs smoothly
  - Form data persists across steps
  - Progress indicator updates correctly
  - Completed steps are marked with checkmarks
```

**Test Case: TC-LC-002 - Step Navigation Backward**
```yaml
Objective: Verify user can navigate backward and data persists
Preconditions: User is on Step 3 with Steps 1-2 completed
Test Steps:
  1. Click "Back" button from Step 3
  2. Verify navigation to Step 2
  3. Verify all previously entered data is intact
  4. Click "Back" button from Step 2
  5. Verify navigation to Step 1
  6. Verify all previously entered data is intact
Expected Result:
  - Backward navigation works from any step
  - All form data remains intact
  - Progress indicator reflects current step
```

**Test Case: TC-LC-003 - Progress Calculation**
```yaml
Objective: Verify progress percentage calculates correctly
Preconditions: User starts fresh form
Test Steps:
  1. Verify initial progress is 0%
  2. Fill title field, verify progress updates
  3. Fill description field, verify progress updates
  4. Fill all Step 1 fields, verify progress updates
  5. Complete all steps, verify progress reaches 100%
Expected Result:
  - Progress calculation is accurate (filled fields / total fields * 100)
  - Progress updates in real-time
  - Visual progress bar matches percentage
```

#### 1.2 Step 1: Basic Information Tests

**Test Case: TC-LC-004 - Title Validation**
```yaml
Objective: Verify title field validation rules
Test Data:
  - Empty title: ""
  - Valid title: "2019 Honda CBR600RR Sport Bike"
  - Long title: [300+ characters]
  - Special characters: "2019 Honda CBR600RR - Great Condition!"
Test Steps:
  1. Submit with empty title
  2. Verify error: "Title is required"
  3. Enter valid title, verify no error
  4. Enter very long title, verify handling
  5. Enter title with special chars, verify acceptance
Expected Result:
  - Empty title shows required error
  - Valid titles are accepted
  - Long titles are handled gracefully
  - Special characters allowed in reasonable amounts
```

**Test Case: TC-LC-005 - Description Validation** 
```yaml
Objective: Verify description field validation and character limits
Test Data:
  - Empty description: ""
  - Minimum description: "Great bike"
  - Maximum description: [2000+ characters]
  - Multiline description with line breaks
Test Steps:
  1. Submit with empty description
  2. Verify error: "Description is required"
  3. Enter minimum valid description
  4. Verify character count if displayed
  5. Enter maximum length description
  6. Test multiline formatting
Expected Result:
  - Empty description triggers required error
  - Character limits enforced appropriately
  - Line breaks preserved in preview
  - Form handles long descriptions without breaking
```

**Test Case: TC-LC-006 - Price Validation**
```yaml
Objective: Verify price field validation rules
Test Data:
  - Empty price: ""
  - Zero price: "0"
  - Negative price: "-100"
  - Valid price: "15000"
  - Decimal price: "15000.99"
  - Non-numeric: "abc"
  - Very large: "999999999"
Test Steps:
  1. Test each price scenario
  2. Verify appropriate validation messages
  3. Verify price formatting in preview
  4. Test currency symbol display
Expected Result:
  - Empty/zero/negative prices show validation errors
  - Valid prices accepted and formatted correctly
  - Non-numeric input rejected
  - Large numbers handled appropriately
```

**Test Case: TC-LC-007 - Condition Selection**
```yaml
Objective: Verify condition dropdown functionality
Test Data: ["excellent", "good", "fair", "poor"]
Test Steps:
  1. Verify initial state shows "Select condition"
  2. Open dropdown and verify all options present
  3. Select each condition option
  4. Verify selection persists
  5. Test keyboard navigation
Expected Result:
  - All condition options available
  - Selection works via click and keyboard
  - Selected value persists correctly
  - Dropdown styling consistent
```

#### 1.3 Step 2: Vehicle Details Tests

**Test Case: TC-LC-008 - VIN Validation & Auto-Verification**
```yaml
Objective: Verify VIN field validation and automatic verification
Test Data:
  - Invalid VIN: "123456789"
  - Valid VIN: "1HGBH41JXMN109186"
  - 17-char invalid: "AAAAAAAAAAAAAAAAA"
Test Steps:
  1. Enter short VIN, verify length validation
  2. Enter 17-character valid VIN
  3. Verify automatic verification API call triggered
  4. Verify loading indicator appears
  5. Verify verification result display
  6. Test auto-population of make/model/year if successful
Expected Result:
  - VIN length validation (must be 17 characters)
  - Auto-verification triggers on complete VIN
  - Loading states shown during verification
  - Results properly displayed (success/error)
  - Vehicle data auto-populated when available
```

**Test Case: TC-LC-009 - Vehicle Information Auto-Population**
```yaml
Objective: Verify vehicle data auto-fills from VIN verification
Test Data: Valid VIN that returns vehicle data
Test Steps:
  1. Enter valid VIN
  2. Wait for verification completion
  3. Verify make field auto-populated
  4. Verify model field auto-populated  
  5. Verify year field auto-populated
  6. Verify title field updated with year/make/model
  7. Test manual override of auto-populated fields
Expected Result:
  - Successful VIN verification populates vehicle fields
  - Title automatically updated with vehicle info
  - User can override auto-populated values
  - Manual changes persist after auto-population
```

**Test Case: TC-LC-010 - Make/Model/Year Validation**
```yaml
Objective: Verify vehicle specification field validation
Test Data:
  - Make: All dropdown options + "Other"
  - Model: Various motorcycle model names
  - Year: 1900, 1950, 2024, 2025, invalid years
Test Steps:
  1. Test make dropdown selection
  2. Test model text input validation
  3. Test year range validation (1900 - current+1)
  4. Verify required field validation
  5. Test "Other" make option handling
Expected Result:
  - Make dropdown includes major motorcycle brands
  - Model accepts text input with reasonable length
  - Year validation enforces realistic range
  - All fields properly validated as required
```

**Test Case: TC-LC-011 - Mileage Validation**
```yaml
Objective: Verify mileage field validation rules
Test Data:
  - Negative mileage: "-1000"
  - Zero mileage: "0"
  - Normal mileage: "25000" 
  - High mileage: "200000"
  - Non-numeric: "abc"
Test Steps:
  1. Test each mileage scenario
  2. Verify validation messages
  3. Test number formatting
  4. Verify field accepts only numeric input
Expected Result:
  - Negative values rejected
  - Zero and positive values accepted
  - Non-numeric input prevented
  - Large numbers formatted with commas
```

#### 1.4 Step 3: Location & Photos Tests

**Test Case: TC-LC-012 - Location Field Validation**
```yaml
Objective: Verify city and zip code validation
Test Data:
  - City: "", "Los Angeles", "New York City", "Las Vegas"
  - Zip: "", "12345", "90210", "1234", "abcde"
Test Steps:
  1. Test empty city/zip validation
  2. Test valid city names with spaces/punctuation
  3. Test zip code format validation (5 digits)
  4. Test invalid zip codes
  5. Verify required field validation
Expected Result:
  - Empty city/zip show required errors
  - City accepts text with spaces and punctuation
  - Zip code validates 5-digit format
  - Invalid zip formats rejected
```

**Test Case: TC-LC-013 - Photo Requirements**
```yaml
Objective: Verify photo upload requirements and validation
Test Data: Various image files and invalid files
Test Steps:
  1. Attempt to continue Step 3 without photos
  2. Verify validation error: "At least one photo is required"
  3. Upload single photo, verify validation passes
  4. Upload maximum photos (8), verify handling
  5. Test photo reordering if available
Expected Result:
  - At least 1 photo required for Step 3 completion
  - Maximum 8 photos enforced
  - Photo management works correctly
  - Validation prevents continuation without photos
```

#### 1.5 Step 4: Review & Publish Tests

**Test Case: TC-LC-014 - Listing Preview Accuracy**
```yaml
Objective: Verify preview accurately reflects entered data
Preconditions: All steps completed with test data
Test Steps:
  1. Navigate to Step 4 Review
  2. Verify title matches entered title
  3. Verify price displays correctly formatted
  4. Verify all vehicle details match inputs
  5. Verify location information correct
  6. Verify first photo displays as preview
  7. Verify photo count indicator if multiple photos
Expected Result:
  - All preview data matches form inputs exactly
  - Price formatted as currency
  - Photos display correctly
  - Layout is user-friendly and professional
```

**Test Case: TC-LC-015 - Final Submission**
```yaml
Objective: Verify final listing submission process
Preconditions: Valid data in all steps
Test Steps:
  1. Click "Publish Listing" button
  2. Verify loading state shows
  3. Verify API call to create listing
  4. Verify successful creation response
  5. Verify redirect to listing detail page
  6. Verify listing appears correctly on detail page
Expected Result:
  - Submission button shows loading state
  - Database record created successfully
  - User redirected to new listing page
  - All data saved correctly to database
```

---

### 2. LISTING UPDATE & MODIFICATION TESTS

#### 2.1 Edit Access & Authentication

**Test Case: TC-LU-001 - Edit Access Authorization**
```yaml
Objective: Verify only listing owners can edit their listings
Preconditions: Two users (Owner, Non-owner) and existing listing
Test Steps:
  1. Login as listing owner
  2. Navigate to listing detail page
  3. Verify "Edit listing" button visible
  4. Logout and login as different user
  5. Navigate to same listing
  6. Verify "Edit listing" button not visible
Expected Result:
  - Only owners see edit controls
  - Non-owners cannot access edit functionality
  - Proper authorization enforced
```

**Test Case: TC-LU-002 - Edit Form Pre-Population**
```yaml
Objective: Verify edit form loads with existing data
Preconditions: Existing listing with complete data
Test Steps:
  1. Navigate to listing edit page
  2. Verify all form fields pre-populated
  3. Verify existing photos loaded
  4. Verify VIN verification status preserved
  5. Verify dropdown selections match saved values
Expected Result:
  - All fields show current listing data
  - Photos display in correct order
  - Previous selections and statuses preserved
  - Form ready for modifications
```

#### 2.2 Update Validation & Processing

**Test Case: TC-LU-003 - Partial Updates**
```yaml
Objective: Verify partial field updates work correctly
Preconditions: Existing listing in edit mode
Test Steps:
  1. Change only price field
  2. Submit form
  3. Verify only price updated in database
  4. Change multiple fields
  5. Submit and verify all changes saved
  6. Verify unchanged fields remain intact
Expected Result:
  - Partial updates save successfully
  - Unchanged fields remain unmodified
  - Database queries efficient (only changed fields)
  - Update timestamp reflects modification
```

**Test Case: TC-LU-004 - Update Validation**
```yaml
Objective: Verify validation rules apply to updates
Test Steps:
  1. Clear required field (e.g., title)
  2. Attempt to save
  3. Verify validation error shown
  4. Enter invalid data (e.g., negative price)
  5. Verify validation prevents save
  6. Correct validation errors
  7. Verify successful save
Expected Result:
  - Same validation rules as creation
  - Invalid updates prevented
  - User guided to fix errors
  - Valid updates process successfully
```

#### 2.3 Photo Management in Updates

**Test Case: TC-LU-005 - Photo Addition/Removal**
```yaml
Objective: Verify photo management during updates
Test Steps:
  1. Load listing with existing photos
  2. Remove one existing photo
  3. Add new photo
  4. Reorder photos if possible
  5. Save changes
  6. Verify photo changes persisted
Expected Result:
  - Existing photos can be removed
  - New photos can be added
  - Photo order preserved
  - Maximum photo limits enforced
```

---

### 3. LISTING DELETION & MANAGEMENT TESTS

#### 3.1 Delete Authorization

**Test Case: TC-LD-001 - Delete Authorization**
```yaml
Objective: Verify only owners can delete their listings
Test Steps:
  1. Attempt deletion as non-owner via API
  2. Verify 403 Forbidden response
  3. Attempt deletion as owner
  4. Verify successful deletion (200 response)
Expected Result:
  - Non-owners receive authorization error
  - Owners can successfully delete
  - Proper HTTP status codes returned
```

**Test Case: TC-LD-002 - Delete Confirmation**
```yaml
Objective: Verify delete confirmation prevents accidental deletions
Test Steps:
  1. Click delete button
  2. Verify confirmation dialog appears
  3. Click "Cancel" - verify nothing deleted
  4. Click delete again
  5. Click "Confirm" - verify deletion proceeds
Expected Result:
  - Confirmation dialog shown
  - Cancel prevents deletion
  - Confirm completes deletion
  - No accidental deletions possible
```

#### 3.2 Delete Process & Cleanup

**Test Case: TC-LD-003 - Complete Deletion**
```yaml
Objective: Verify complete listing removal from system
Test Steps:
  1. Note listing ID before deletion
  2. Delete listing
  3. Attempt to access deleted listing URL
  4. Verify 404 Not Found response
  5. Verify listing not in search results
  6. Verify listing not in owner's listing list
Expected Result:
  - Listing completely removed from database
  - All references cleaned up
  - Proper 404 responses for missing listing
  - Listing removed from all views
```

**Test Case: TC-LD-004 - Related Data Cleanup**
```yaml
Objective: Verify related data handled properly on deletion
Test Steps:
  1. Create listing with messages/conversations
  2. Delete the listing
  3. Verify related messages remain accessible
  4. Verify conversations show "listing deleted" status
  5. Verify no orphaned database records
Expected Result:
  - Related data handled appropriately
  - Messages preserved for user history
  - Foreign key constraints respected
  - No database integrity issues
```

---

### 4. FORM VALIDATION & ERROR HANDLING TESTS

#### 4.1 Client-Side Validation

**Test Case: TC-FV-001 - Real-Time Validation**
```yaml
Objective: Verify validation occurs in real-time as user types
Test Steps:
  1. Start typing in required field
  2. Clear field after entering data
  3. Verify error appears immediately
  4. Enter valid data
  5. Verify error disappears immediately
  6. Test on all form fields
Expected Result:
  - Validation feedback immediate
  - Errors appear/disappear in real-time
  - No delay or page refresh needed
  - User receives instant feedback
```

**Test Case: TC-FV-002 - Field-Specific Validation Messages**
```yaml
Objective: Verify each field shows appropriate error messages
Test Data: Invalid data for each field type
Test Steps:
  1. Test each field with invalid data
  2. Verify specific error messages shown
  3. Verify messages are helpful and actionable
  4. Test multiple errors on same field
Expected Result:
  - Each field has specific error messages
  - Messages guide user to correct input
  - Multiple errors handled gracefully
  - Error text is clear and helpful
```

#### 4.2 Server-Side Validation

**Test Case: TC-FV-003 - Server Validation Fallback**
```yaml
Objective: Verify server validates data even if client validation bypassed
Test Steps:
  1. Bypass client validation (disable JavaScript)
  2. Submit invalid data
  3. Verify server returns validation errors
  4. Verify errors displayed to user
  5. Verify database remains unmodified
Expected Result:
  - Server validates all data independently
  - Invalid data rejected at API level
  - Proper error responses returned
  - Database integrity maintained
```

#### 4.3 Error Recovery

**Test Case: TC-FV-004 - Error State Recovery**
```yaml
Objective: Verify users can recover from error states
Test Steps:
  1. Trigger validation errors
  2. Correct all errors
  3. Verify form returns to valid state
  4. Verify submission works after error correction
  5. Test partial error correction
Expected Result:
  - Users can recover from all error states
  - Form validation state updates correctly
  - Submission possible after error correction
  - Partial corrections acknowledged
```

---

### 5. IMAGE UPLOAD & MANAGEMENT TESTS

#### 5.1 Upload Functionality

**Test Case: TC-IU-001 - Basic Image Upload**
```yaml
Objective: Verify basic image upload functionality
Test Data: Various image files (JPG, PNG, WebP)
Test Steps:
  1. Select image file via file input
  2. Verify upload progress indicator
  3. Verify image appears in preview
  4. Verify image URL stored correctly
  5. Test multiple file selection
Expected Result:
  - All common image formats accepted
  - Upload progress shown to user
  - Successful uploads previewed immediately
  - Image URLs generated and stored
```

**Test Case: TC-IU-002 - Drag & Drop Upload**
```yaml
Objective: Verify drag and drop image upload
Test Steps:
  1. Drag image file over upload area
  2. Verify drop zone highlights
  3. Drop image file
  4. Verify upload initiates
  5. Verify same result as file input method
Expected Result:
  - Drag/drop interface works smoothly
  - Visual feedback during drag operation
  - Drop initiates upload process
  - Functionality equivalent to file input
```

#### 5.2 Upload Validation

**Test Case: TC-IU-003 - File Type Validation**
```yaml
Objective: Verify only valid image files accepted
Test Data:
  - Valid: image.jpg, photo.png, pic.webp
  - Invalid: document.pdf, file.txt, video.mp4
Test Steps:
  1. Attempt upload of each file type
  2. Verify valid images accepted
  3. Verify invalid files rejected with message
  4. Verify error messages are specific
Expected Result:
  - Only image files (JPG, PNG, WebP, etc.) accepted
  - Invalid files rejected with clear message
  - No partial uploads of invalid files
  - User guided on acceptable formats
```

**Test Case: TC-IU-004 - File Size Validation**
```yaml
Objective: Verify file size limits enforced
Test Data:
  - Small image: <1MB
  - Medium image: 2-3MB  
  - Large image: >5MB
  - Very large: >10MB
Test Steps:
  1. Upload each size category
  2. Verify small/medium images accepted
  3. Verify large images rejected
  4. Verify appropriate error messages
Expected Result:
  - Images under 5MB accepted
  - Images over 5MB rejected
  - Clear file size error messages
  - File size shown in error message
```

#### 5.3 Upload Management

**Test Case: TC-IU-005 - Maximum Image Limit**
```yaml
Objective: Verify maximum image count enforced (8 images)
Test Steps:
  1. Upload 8 images successfully
  2. Attempt to upload 9th image
  3. Verify upload rejected with message
  4. Remove one image
  5. Verify can now upload replacement
Expected Result:
  - Maximum 8 images enforced
  - 9th image rejected with clear message
  - Removing images allows new uploads
  - Image count displayed to user
```

**Test Case: TC-IU-006 - Image Reordering**
```yaml
Objective: Verify users can reorder uploaded images
Test Steps:
  1. Upload multiple images
  2. Drag image to new position
  3. Verify reorder works correctly
  4. Verify first image shown as main
  5. Save and verify order persisted
Expected Result:
  - Images can be reordered by drag/drop
  - First image used as main/preview
  - Order changes reflected immediately
  - Order persisted in database
```

#### 5.4 Image Processing & Storage

**Test Case: TC-IU-007 - Cloudinary Integration**
```yaml
Objective: Verify Cloudinary upload and processing
Test Steps:
  1. Upload high-resolution image
  2. Verify upload to Cloudinary successful
  3. Verify image URL returns working image
  4. Verify automatic resizing/optimization
  5. Test image delivery and loading speed
Expected Result:
  - Images uploaded to Cloudinary successfully
  - Secure URLs generated and stored
  - Images optimized for web delivery
  - Fast loading and proper CDN distribution
```

---

### 6. AUTO-SAVE & STATE MANAGEMENT TESTS

#### 6.1 Form State Persistence

**Test Case: TC-AS-001 - Browser Session Persistence**
```yaml
Objective: Verify form data persists during browser session
Test Steps:
  1. Fill partial form data
  2. Navigate away from page
  3. Return to create listing page
  4. Verify form data restored
  5. Test across browser tabs
Expected Result:
  - Form data persists in browser session
  - Navigation doesn't lose data
  - Multiple tabs maintain separate state
  - User can safely navigate without data loss
```

**Test Case: TC-AS-002 - Step Navigation Persistence**
```yaml
Objective: Verify data persists between form steps
Test Steps:
  1. Complete Step 1, go to Step 2
  2. Partially complete Step 2, go to Step 3
  3. Return to Step 1
  4. Verify all previously entered data intact
  5. Complete all steps and verify persistence
Expected Result:
  - Data persists between all steps
  - No data loss during navigation
  - Form maintains state throughout process
  - User can freely navigate between steps
```

#### 6.2 Auto-Save Implementation

**Test Case: TC-AS-003 - Auto-Save Drafts**
```yaml
Objective: Verify automatic draft saving if implemented
Test Steps:
  1. Start filling form
  2. Wait for auto-save trigger (time/field change)
  3. Verify draft saved indicator
  4. Close browser/tab
  5. Return and verify draft restored
Expected Result:
  - Drafts saved automatically at intervals
  - User notified when draft saved
  - Drafts restored on return
  - No data loss from unexpected exits
```

---

### 7. DATABASE OPERATIONS TESTS

#### 7.1 CRUD Operations

**Test Case: TC-DB-001 - Create Operation**
```yaml
Objective: Verify listing creation database operation
Test Steps:
  1. Submit valid listing data
  2. Verify database record created
  3. Verify all fields stored correctly
  4. Verify proper data types and formats
  5. Verify timestamps set correctly
Expected Result:
  - Database record created successfully
  - All data fields stored accurately
  - Proper data type conversion
  - Created/updated timestamps set
```

**Test Case: TC-DB-002 - Read Operations**
```yaml
Objective: Verify listing retrieval from database
Test Steps:
  1. Create test listing
  2. Retrieve by ID via API
  3. Retrieve by user via API
  4. Verify all data fields returned
  5. Verify data integrity maintained
Expected Result:
  - Listings retrieved successfully by various criteria
  - All data fields returned accurately
  - No data corruption during storage/retrieval
  - Efficient query performance
```

**Test Case: TC-DB-003 - Update Operations**
```yaml
Objective: Verify listing update database operations
Test Steps:
  1. Update specific fields only
  2. Verify only changed fields modified
  3. Verify updated_at timestamp changes
  4. Verify unchanged fields intact
  5. Test concurrent update scenarios
Expected Result:
  - Partial updates work correctly
  - Updated timestamp reflects changes
  - Unchanged data remains intact
  - Concurrent updates handled properly
```

**Test Case: TC-DB-004 - Delete Operations**
```yaml
Objective: Verify listing deletion from database
Test Steps:
  1. Delete existing listing
  2. Verify record removed from database
  3. Verify foreign key relationships handled
  4. Verify no orphaned data remains
  5. Test soft delete vs hard delete behavior
Expected Result:
  - Listing completely removed from database
  - Related data handled appropriately
  - No orphaned records or broken relationships
  - Deletion behavior consistent
```

#### 7.2 Data Integrity

**Test Case: TC-DB-005 - Foreign Key Constraints**
```yaml
Objective: Verify database constraints enforced properly
Test Steps:
  1. Attempt to create listing with invalid user_id
  2. Verify constraint violation prevented
  3. Test referential integrity on updates
  4. Test cascade behavior on user deletion
Expected Result:
  - Invalid foreign keys rejected
  - Database integrity maintained
  - Constraint violations return appropriate errors
  - Cascade behavior works as designed
```

**Test Case: TC-DB-006 - Data Type Validation**
```yaml
Objective: Verify database enforces data types
Test Data:
  - String in numeric field
  - Invalid date format
  - Null in required field
Test Steps:
  1. Attempt insertion of invalid data types
  2. Verify database rejects invalid data
  3. Verify appropriate error messages
Expected Result:
  - Database enforces data type constraints
  - Invalid data rejected with clear errors
  - Application handles database errors gracefully
```

---

### 8. USER PERMISSIONS & SECURITY TESTS

#### 8.1 Authentication Tests

**Test Case: TC-UP-001 - Unauthenticated Access**
```yaml
Objective: Verify unauthenticated users cannot access protected operations
Test Steps:
  1. Access create listing without authentication
  2. Verify redirect to login
  3. Attempt API calls without auth token
  4. Verify 401 Unauthorized responses
  5. Test edit/delete without authentication
Expected Result:
  - Protected pages require authentication
  - API endpoints return 401 for unauthenticated requests
  - Users redirected to login when needed
  - No unauthorized access possible
```

**Test Case: TC-UP-002 - Session Management**
```yaml
Objective: Verify user session handling
Test Steps:
  1. Login and start creating listing
  2. Let session expire during process
  3. Attempt to save/submit
  4. Verify appropriate session handling
  5. Test session refresh functionality
Expected Result:
  - Expired sessions handled gracefully
  - Users prompted to re-authenticate
  - Work in progress preserved when possible
  - Session refresh works correctly
```

#### 8.2 Authorization Tests

**Test Case: TC-UP-003 - Ownership Verification**
```yaml
Objective: Verify users can only modify their own listings
Test Steps:
  1. User A creates listing
  2. User B attempts to edit User A's listing
  3. Verify edit access denied
  4. User B attempts to delete User A's listing
  5. Verify delete access denied
Expected Result:
  - Users can only edit/delete their own listings
  - Proper authorization checks in place
  - 403 Forbidden for unauthorized attempts
  - Ownership verification robust
```

#### 8.3 Input Sanitization & Security

**Test Case: TC-UP-004 - SQL Injection Prevention**
```yaml
Objective: Verify protection against SQL injection attacks
Test Data: Various SQL injection payloads
Test Steps:
  1. Enter SQL injection strings in form fields
  2. Submit form
  3. Verify data stored safely
  4. Verify no SQL commands executed
  5. Test via API endpoints directly
Expected Result:
  - SQL injection attempts prevented
  - Data stored as literal strings
  - No database commands executed from user input
  - Parameterized queries used throughout
```

**Test Case: TC-UP-005 - XSS Prevention**
```yaml
Objective: Verify protection against cross-site scripting
Test Data: Various XSS payloads
Test Steps:
  1. Enter JavaScript code in form fields
  2. Save and view listing
  3. Verify scripts not executed
  4. Verify HTML properly escaped
  5. Test in description field particularly
Expected Result:
  - JavaScript code not executed
  - HTML tags properly escaped
  - Content displayed safely
  - No XSS vulnerabilities present
```

**Test Case: TC-UP-006 - File Upload Security**
```yaml
Objective: Verify image upload security
Test Data:
  - Malicious files disguised as images
  - Files with executable extensions
  - Files exceeding size limits
Test Steps:
  1. Attempt upload of each malicious file type
  2. Verify files rejected
  3. Verify no malicious code executed
  4. Test file type validation thoroughly
Expected Result:
  - Only safe image files accepted
  - Malicious files detected and rejected
  - File type validation cannot be bypassed
  - Upload process secure against attacks
```

---

### 9. INTEGRATION & API TESTS

#### 9.1 VIN Verification Integration

**Test Case: TC-INT-001 - VIN API Integration**
```yaml
Objective: Verify VIN verification service integration
Test Data:
  - Valid VIN with data: "1HGBH41JXMN109186"
  - Valid VIN without data: [valid but uncommon VIN]
  - Invalid VIN: "INVALIDVIN123456"
Test Steps:
  1. Enter valid VIN with data
  2. Verify API call made
  3. Verify response processed correctly
  4. Test error handling for API failures
  5. Test timeout scenarios
Expected Result:
  - VIN API integration works correctly
  - Valid responses processed properly
  - Errors handled gracefully
  - Timeout scenarios managed
```

#### 9.2 Image Service Integration

**Test Case: TC-INT-002 - Cloudinary Integration**
```yaml
Objective: Verify Cloudinary image service integration
Test Steps:
  1. Upload image to Cloudinary
  2. Verify successful upload response
  3. Verify image URL works
  4. Test image optimization/transformation
  5. Verify error handling for upload failures
Expected Result:
  - Images uploaded successfully to Cloudinary
  - Secure URLs returned and functional
  - Image processing works correctly
  - Upload failures handled gracefully
```

---

### 10. PERFORMANCE & SCALABILITY TESTS

#### 10.1 Load Testing

**Test Case: TC-PERF-001 - Concurrent User Creation**
```yaml
Objective: Verify system handles multiple concurrent listing creations
Test Setup: 10+ concurrent users creating listings
Test Steps:
  1. Simulate multiple users creating listings simultaneously
  2. Monitor response times
  3. Verify all listings created successfully
  4. Check for database deadlocks or conflicts
Expected Result:
  - All concurrent operations complete successfully
  - Response times remain acceptable
  - No database conflicts or deadlocks
  - System scales appropriately
```

#### 10.2 Image Upload Performance

**Test Case: TC-PERF-002 - Large Image Upload Performance**
```yaml
Objective: Verify performance with large image files
Test Data: Multiple 5MB images
Test Steps:
  1. Upload maximum images at size limit
  2. Monitor upload progress and times
  3. Verify user experience remains smooth
  4. Test concurrent image uploads
Expected Result:
  - Large images upload within reasonable time
  - Progress indicators work correctly
  - UI remains responsive during uploads
  - Concurrent uploads handled efficiently
```

---

## 🚀 TEST EXECUTION STRATEGY

### Priority Levels:

**P1 - Critical**: Core functionality that breaks the marketplace if failing
- Authentication & Authorization
- Listing Creation/Update/Delete
- Database Operations
- Security Tests

**P2 - Important**: Features that significantly impact user experience
- Form Validation
- Image Upload
- VIN Verification
- Step Navigation

**P3 - Nice to Have**: Enhancement features and edge cases
- Auto-save
- Performance optimizations
- Advanced validation scenarios

### Automation Recommendations:

**Automated Tests**:
- API endpoint tests
- Database operation tests
- Form validation tests
- Security/injection tests

**Manual Tests**:
- UI/UX flow tests
- Browser compatibility
- Mobile responsiveness
- Complex user scenarios

### Test Data Management:

**Test Users**:
- Standard user account
- Admin/privileged account
- Test user with existing listings
- Test user without listings

**Test Listings**:
- Complete listing with all fields
- Minimal listing with required fields only
- Listing with maximum images
- Listing with verified VIN

### Continuous Testing:

- Run automated tests on every deployment
- Manual regression testing for major releases
- Performance testing under load
- Security testing with penetration tools

---

## 📊 TEST REPORTING

Each test case should be documented with:
- **Test ID**: Unique identifier
- **Priority**: P1/P2/P3
- **Status**: Pass/Fail/Blocked
- **Last Executed**: Date of last test run
- **Notes**: Any observations or issues
- **Screenshots**: For visual confirmation where needed

**Success Criteria**: All P1 tests must pass before production deployment. P2 tests should have >95% pass rate. P3 tests tracked but not deployment blocking.

This comprehensive test suite ensures the SafeTrade marketplace listing flow is robust, secure, and provides an excellent user experience across all scenarios.