# HRMS Pro - Human Resource Management System

## Overview
HRMS Pro is a comprehensive Human Resource Management System mobile application built with React Native/Expo. It features a premium Yellow (#FFC300) and Black (#000000) theme with a modern, professional design following iOS 26 liquid glass interface guidelines.

## Current State
The application is fully functional with the following features:
- Complete authentication flow (Onboarding, Login, Forgot Password, OTP verification, Reset Password)
- Attendance tracking with GPS-based check-in/check-out
- Leave management with application form and balance tracking
- Task management with status updates and comments
- Payroll viewing with detailed salary breakdowns
- Holiday calendar with favorites
- Company announcements and notices
- Employee profile management
- Settings with notification toggles and password change

## Project Architecture

### Navigation Structure
- **AuthStackNavigator**: Onboarding → Login → ForgotPassword → OTP → ResetPassword
- **MainTabNavigator**: 5 tabs (Home, Attendance, Leave, Tasks, Profile)
  - HomeStackNavigator: Home, Payroll, Holidays, Announcements
  - AttendanceStackNavigator: Attendance
  - LeaveStackNavigator: Leave, ApplyLeave
  - TaskStackNavigator: Tasks, TaskDetail
  - ProfileStackNavigator: Profile, Settings, ChangePassword

### Key Files
- `App.tsx`: Root component with navigation and error boundary
- `store/hrmsStore.ts`: Zustand store with all state management
- `constants/theme.ts`: Theme tokens (colors, spacing, typography)
- `navigation/`: All navigation stacks and tab navigator
- `screens/`: All 17 screen components
- `components/`: Reusable UI components

### State Management
Using Zustand for in-memory state with mock data for demonstration:
- Employee profile and authentication
- Attendance records and check-in/out
- Leave balance and requests
- Tasks with comments
- Payslips
- Holidays
- Announcements

## Design System
- **Primary Color**: #FFC300 (Yellow)
- **Background**: Black theme with dark grays
- **Typography**: System fonts with defined scales
- **Spacing**: 4px base unit with scales (xs, sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl)
- **Border Radius**: xs through full for rounded corners

## Running the App
- Development: `npm run dev` (automatically starts Expo)
- Web preview available at localhost:8081
- Scan QR code with Expo Go for mobile testing

## Recent Changes
- November 26, 2025: Initial complete implementation of HRMS Pro app
  - All 17 screens implemented
  - Complete navigation structure
  - Zustand store with mock data
  - Yellow/Black premium theme

## User Preferences
- Premium Yellow (#FFC300) and Black (#000000) color scheme
- Mobile-first design with rounded cards
- Smooth animations and professional spacing
