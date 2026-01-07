# HRMS Pro - Design Guidelines

## Color Palette
- **Primary Yellow:** #FFC300
- **Primary Black:** #000000  
- **White:** #FFFFFF
- Premium Yellow + Black theme throughout
- Dark mode available (Black + Yellow theme)

## Visual Design System

### Typography & Icons
- Material Icons or Lucide Icons for all iconography
- Professional spacing and modern layout
- Comments and labels should be clear and readable

### Component Styling
- **Rounded Cards** for all content containers
- **Drop shadows** for depth and hierarchy
- **Smooth animations** using React Native Reanimated
- **Skeleton loaders** during content loading states
- Professional spacing between elements

### Interactive Elements
- All buttons must have visual feedback
- **CustomButton** component with yellow/black variants
- **Pull to refresh** on all list screens
- Touch-friendly button sizes (minimum 44x44 points)
- BottomSheet and ModalPopup components for overlays

## Navigation Architecture

### Root Navigation
- **Bottom Tab Navigation** (5 tabs):
  - Home (Dashboard)
  - Attendance
  - Leave
  - Tasks
  - Profile

### Authentication Flow
- Stack navigation for auth screens:
  - Splash Screen
  - Onboarding Slides (3 animated screens)
  - Login (Email + Password)
  - Forgot Password
  - OTP Verification
  - Create/Reset Password

## Screen Specifications

### Home Dashboard
- **Header:** Greeting with employee name, date, day, live clock
- **Main Content (Scrollable):**
  - Check-In/Check-Out buttons (prominent, yellow)
  - Total Hours Worked Today card
  - Current Status indicator (Present/Absent/On Break)
  - Today's Attendance Summary
  - Quick Shortcuts grid (2x3 layout):
    - Attendance, Leaves, Tasks, Payroll, Profile, Announcements

### Attendance Module
- **Header:** Title with filter button
- **Main Content:**
  - Today's details card at top
  - Monthly calendar (fully interactive, swipeable)
  - Check-in/out history list with GPS/IP badges
  - Late marks and overtime highlighted in yellow
  - Date range filter

### Leave Management
- **Header:** Title with "Apply Leave" button
- **Main Content:**
  - Leave balance cards (horizontal scroll)
  - Leave history list with status badges:
    - Pending (Yellow)
    - Approved (Green accent)
    - Rejected (Red accent)
  - Apply leave form with:
    - Leave type dropdown
    - Date range picker
    - Document upload area
    - Submit button

### Task Management
- **Header:** Title with filter dropdown
- **Main Content:**
  - Task cards with:
    - Priority indicator (Low/Medium/High color-coded)
    - Status badge (Pending/In Progress/Completed)
    - Due date
    - Attachment count
    - Comments count
  - Task timeline UI for task details
  - Add comment input at bottom

### Payroll Module
- **Header:** Title with download icon
- **Main Content:**
  - Current month summary card
  - Earnings vs Deductions breakdown
  - PF/ESI/Tax details cards
  - Previous months list with download buttons
  - Bank details card (collapsible)

### Profile Module
- **Header:** Transparent with edit button
- **Main Content (Scrollable):**
  - Employee photo (circular, centered)
  - Name, Role, Employee ID
  - Info cards for:
    - Personal details
    - Emergency contact
    - Bank account
    - Documents (upload area)
  - Logout button at bottom (outlined, red text)

### Settings Page
- **Header:** Standard with back button
- **Main Content:**
  - Settings list items with icons:
    - Dark Mode toggle
    - Notifications toggle
    - Change Password (navigates to new screen)
    - App Version (read-only)
    - Help Center
    - Contact HR
  - Each item has right arrow/toggle

## Component Library

### Reusable Components
- **CustomButton:** Primary (yellow), Secondary (outlined), Disabled states
- **InputField:** Standard text input with label, error state, icons
- **Card:** Base container with shadow and rounded corners
- **CalendarComponent:** Interactive monthly view with date selection
- **Header:** Customizable with title, left/right buttons, transparent option
- **BottomSheet:** Slide-up modal for forms and selections
- **ModalPopup:** Center modal for confirmations and alerts
- **TaskCard:** Task item with all metadata
- **LeaveCard:** Leave request with status
- **AttendanceCard:** Check-in/out record display

## Interaction Design

### Animations
- Screen transitions: smooth slide animations
- Check-in/check-out: scale + success feedback
- Pull to refresh: spinner with yellow accent
- Skeleton loaders: subtle shimmer effect
- Modal appearances: fade + scale from center
- Bottom sheets: slide up from bottom

### Feedback States
- Loading: Skeleton loaders or yellow spinners
- Success: Green checkmark with haptic feedback
- Error: Red alert with error message
- Empty states: Illustration + helpful message

## Accessibility
- Minimum touch target size: 44x44 points
- Sufficient color contrast for text on yellow/black backgrounds
- Clear labels for all interactive elements
- Screen reader support for all content
- Error messages clearly visible and descriptive

## Assets Required
- Employee placeholder avatar
- Onboarding illustrations (3 slides)
- Empty state illustrations for each module
- Company logo for splash screen
- Icons for all quick shortcuts and menu items