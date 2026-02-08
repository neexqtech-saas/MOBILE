import { create } from "zustand";
import { apiService, OrganizationSettings } from "@/services/api";
import { storageService } from "@/services/storage";
import type { AttendanceHistoryItem, TaskAPI, AssignedProject } from "@/services/api";
import * as ImagePicker from "expo-image-picker";
import { Platform, Alert } from "react-native";
import { validateFaceImage } from "@/utils/faceDetection";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

// Helper function to get FCM/Expo Push Token
async function getFcmToken(): Promise<string | null> {
  try {
    // Check if running on a physical device
    if (!Device.isDevice) {
      console.warn('⚠️ FCM tokens are only available on physical devices');
      return null;
    }

    // Request notification permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('⚠️ Notification permissions not granted');
      return null;
    }

    // Get the Expo Push Token (which works as FCM token for Expo apps)
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    
    console.log('📱 FCM/Expo Push Token obtained:', token);
    return token;
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    return null;
  }
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  employeeId: string;
  address: string;
  emergencyContact: string;
  bankAccount: string;
  ifscCode: string;
  avatar: string | null;
  organizationId?: string; // Organization ID for API calls
  adminId?: string; // Admin ID for attendance API calls
  siteId?: string; // Site ID from session info for attendance API calls
  assignedProject?: AssignedProject; // First assigned project from session info
  isPhotoUpdated?: boolean; // Flag to track if profile photo has been updated
}

export interface MultipleCheckEntry {
  id: number;
  checkInTime: string | null;
  checkOutTime: string | null;
  totalWorkingMinutes: number;
  remarks: string | null;
  checkInImage: string | null;
  checkOutImage: string | null;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "present" | "absent" | "half-day" | "late";
  totalHours: number;
  location?: string;
  lastLoginStatus?: string | null; // "checkin" or "checkout"
  shiftName?: string | null; // Shift name from API
  multipleEntries?: MultipleCheckEntry[]; // Multiple check-in/check-out entries
}

export interface LeaveRequest {
  id: string;
  type: "casual" | "sick" | "privilege" | "wfh";
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  appliedDate: string;
}

export interface LeaveBalance {
  casual: number;
  sick: number;
  privilege: number;
  wfh: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string;
  assignedBy: string;
  attachments: number;
  comments: Comment[];
  startTime?: string | null;
  endTime?: string | null;
  startDate?: string | null;
  actualHours?: number | null;
  completedAt?: string | null;
  taskTypeName?: string;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface PaySlip {
  id: string;
  month: string;
  year: number;
  basicSalary: number;
  hra: number;
  da: number;
  ta: number;
  otherAllowances: number;
  pf: number;
  esi: number;
  professionalTax: number;
  tds: number;
  otherDeductions: number;
  netSalary: number;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: "public" | "company" | "optional";
  isFavorite: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "announcement" | "notice" | "policy";
  date: string;
  isRead: boolean;
}

interface HRMSState {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSeenOnboarding: boolean;
  employee: Employee;
  todayAttendance: AttendanceRecord | null;
  attendanceHistory: AttendanceRecord[];
  leaveBalance: LeaveBalance;
  leaveRequests: LeaveRequest[];
  tasks: Task[];
  paySlips: PaySlip[];
  holidays: Holiday[];
  announcements: Announcement[];
  notificationsEnabled: boolean;
  organizationSettings: OrganizationSettings | null;

  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  completeOnboarding: () => void;
  fetchOrganizationSettings: () => Promise<void>;
  checkIn: (base64Images?: string[], latitude?: number, longitude?: number) => Promise<{ success: boolean; error?: string }>;
  checkOut: (base64Images?: string[], latitude?: number, longitude?: number) => Promise<{ success: boolean; error?: string }>;
  fetchAttendanceHistory: (orgId?: string, fromDate?: string, toDate?: string) => Promise<void>;
  fetchTodayAttendance: () => Promise<void>;
  fetchAttendanceAfterPunch: () => Promise<void>;
  fetchAttendanceByDate: (date: string) => Promise<AttendanceRecord | null>;
  applyLeave: (leave: Omit<LeaveRequest, "id" | "status" | "appliedDate">) => Promise<{ success: boolean; error?: string }>;
  fetchLeaveTypes: () => Promise<{ success: boolean; error?: string }>;
  fetchTasks: () => Promise<{ success: boolean; error?: string }>;
  updateTaskStatus: (taskId: string, status: Task["status"], comment?: string) => Promise<{ success: boolean; error?: string }>;
  addTaskComment: (taskId: string, text: string) => void;
  toggleHolidayFavorite: (holidayId: string) => void;
  fetchHolidays: () => Promise<{ success: boolean; error?: string }>;
  markAnnouncementRead: (announcementId: string) => void;
  toggleNotifications: () => void;
  updateProfile: (updates: Partial<Employee>) => void;
  captureAndUploadProfilePhoto: () => Promise<{ success: boolean; error?: string }>;
  uploadProfilePhoto: (base64Image: string) => Promise<{ success: boolean; error?: string }>;
}

const mockEmployee: Employee = {
  id: "EMP001",
  name: "John Anderson",
  email: "john.anderson@company.com",
  phone: "+1 234 567 8900",
  role: "Senior Software Engineer",
  department: "Engineering",
  employeeId: "EMP001",
  address: "123 Tech Street, San Francisco, CA 94102",
  emergencyContact: "+1 234 567 8901",
  bankAccount: "XXXX XXXX XXXX 4589",
  ifscCode: "BANK0001234",
  avatar: null,
};

const generateAttendanceHistory = (): AttendanceRecord[] => {
  const history: AttendanceRecord[] = [];
  const today = new Date();
  
  for (let i = 1; i <= 20; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const isLate = Math.random() > 0.8;
    const isAbsent = Math.random() > 0.9;
    
    history.push({
      id: `att-${i}`,
      date: date.toISOString().split("T")[0],
      checkIn: isAbsent ? null : isLate ? "10:15 AM" : "09:00 AM",
      checkOut: isAbsent ? null : "06:00 PM",
      status: isAbsent ? "absent" : isLate ? "late" : "present",
      totalHours: isAbsent ? 0 : isLate ? 7.75 : 9,
      location: "Office - Main Building",
    });
  }
  
  return history;
};

const mockLeaveRequests: LeaveRequest[] = [
  {
    id: "leave-1",
    type: "casual",
    startDate: "2025-12-01",
    endDate: "2025-12-02",
    reason: "Personal work",
    status: "approved",
    appliedDate: "2025-11-25",
  },
  {
    id: "leave-2",
    type: "sick",
    startDate: "2025-11-15",
    endDate: "2025-11-15",
    reason: "Not feeling well",
    status: "approved",
    appliedDate: "2025-11-15",
  },
  {
    id: "leave-3",
    type: "wfh",
    startDate: "2025-12-10",
    endDate: "2025-12-10",
    reason: "Expecting delivery at home",
    status: "pending",
    appliedDate: "2025-11-26",
  },
];

const mockTasks: Task[] = [
  {
    id: "task-1",
    title: "Complete API Integration",
    description: "Integrate the new payment gateway API with the mobile app. Ensure all edge cases are handled and proper error handling is in place.",
    status: "in-progress",
    priority: "high",
    dueDate: "2025-11-30",
    assignedBy: "Sarah Manager",
    attachments: 2,
    comments: [
      { id: "c1", author: "Sarah Manager", text: "Please prioritize this task", timestamp: "2025-11-24 10:00 AM" },
    ],
  },
  {
    id: "task-2",
    title: "Code Review - Auth Module",
    description: "Review the authentication module code changes submitted by the team.",
    status: "pending",
    priority: "medium",
    dueDate: "2025-12-01",
    assignedBy: "Tech Lead",
    attachments: 1,
    comments: [],
  },
  {
    id: "task-3",
    title: "Update Documentation",
    description: "Update the API documentation with the new endpoints and request/response formats.",
    status: "completed",
    priority: "low",
    dueDate: "2025-11-25",
    assignedBy: "Product Manager",
    attachments: 0,
    comments: [
      { id: "c2", author: "Product Manager", text: "Great work!", timestamp: "2025-11-25 04:00 PM" },
    ],
  },
  {
    id: "task-4",
    title: "Bug Fix - Login Screen",
    description: "Fix the keyboard overlap issue on the login screen for smaller devices.",
    status: "pending",
    priority: "high",
    dueDate: "2025-11-28",
    assignedBy: "QA Team",
    attachments: 3,
    comments: [],
  },
];

const mockPaySlips: PaySlip[] = [
  {
    id: "pay-1",
    month: "November",
    year: 2025,
    basicSalary: 50000,
    hra: 20000,
    da: 5000,
    ta: 3000,
    otherAllowances: 2000,
    pf: 6000,
    esi: 750,
    professionalTax: 200,
    tds: 8000,
    otherDeductions: 500,
    netSalary: 64550,
  },
  {
    id: "pay-2",
    month: "October",
    year: 2025,
    basicSalary: 50000,
    hra: 20000,
    da: 5000,
    ta: 3000,
    otherAllowances: 2000,
    pf: 6000,
    esi: 750,
    professionalTax: 200,
    tds: 8000,
    otherDeductions: 500,
    netSalary: 64550,
  },
  {
    id: "pay-3",
    month: "September",
    year: 2025,
    basicSalary: 50000,
    hra: 20000,
    da: 5000,
    ta: 3000,
    otherAllowances: 2000,
    pf: 6000,
    esi: 750,
    professionalTax: 200,
    tds: 8000,
    otherDeductions: 500,
    netSalary: 64550,
  },
];

const mockHolidays: Holiday[] = [
  { id: "h1", name: "New Year's Day", date: "2025-01-01", type: "public", isFavorite: false },
  { id: "h2", name: "Republic Day", date: "2025-01-26", type: "public", isFavorite: true },
  { id: "h3", name: "Good Friday", date: "2025-04-18", type: "public", isFavorite: false },
  { id: "h4", name: "Company Foundation Day", date: "2025-03-15", type: "company", isFavorite: true },
  { id: "h5", name: "Independence Day", date: "2025-08-15", type: "public", isFavorite: true },
  { id: "h6", name: "Diwali", date: "2025-10-20", type: "public", isFavorite: true },
  { id: "h7", name: "Christmas", date: "2025-12-25", type: "public", isFavorite: false },
  { id: "h8", name: "Team Building Day", date: "2025-06-20", type: "optional", isFavorite: false },
];

const mockAnnouncements: Announcement[] = [
  {
    id: "ann-1",
    title: "Year-End Performance Reviews",
    content: "Annual performance reviews will begin from December 1st. Please prepare your self-assessment documents by November 30th.",
    type: "announcement",
    date: "2025-11-26",
    isRead: false,
  },
  {
    id: "ann-2",
    title: "Updated Leave Policy",
    content: "Please note the updated leave policy effective from January 2026. Work from home days have been increased to 3 per week.",
    type: "policy",
    date: "2025-11-24",
    isRead: false,
  },
  {
    id: "ann-3",
    title: "Office Closure Notice",
    content: "The office will remain closed on December 24th and 25th for Christmas holidays. Emergency contact numbers will be shared via email.",
    type: "notice",
    date: "2025-11-22",
    isRead: true,
  },
  {
    id: "ann-4",
    title: "Health Insurance Renewal",
    content: "Health insurance policies are up for renewal. Please submit your updated documents by December 15th.",
    type: "notice",
    date: "2025-11-20",
    isRead: true,
  },
];

// Initialize API service with access token getter
apiService.setAccessTokenGetter(() => storageService.getAccessToken());

export const useHRMSStore = create<HRMSState>((set, get) => ({
  isAuthenticated: false,
  isLoading: false,
  hasSeenOnboarding: false,
  employee: mockEmployee,
  todayAttendance: null,
  attendanceHistory: [],
  leaveBalance: { casual: 8, sick: 10, privilege: 15, wfh: 12 },
  leaveRequests: mockLeaveRequests,
  tasks: mockTasks,
  paySlips: mockPaySlips,
  holidays: mockHolidays,
  announcements: mockAnnouncements,
  notificationsEnabled: true,
  organizationSettings: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await apiService.login({ username, password });
      
      // Save tokens and user info to storage
      await storageService.saveAuthData({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        user_id: response.user_id,
        role: response.role,
      });

      // Fetch user profile/session info to get employee name and other details
      try {
        const sessionInfo = await apiService.getSessionInfo();
        console.log('📋 Session Info Response:', sessionInfo);
        
        // Check if response is successful (status 200 or success: true)
        const isSuccess = (sessionInfo.status === 200 || sessionInfo.success === true);
        
        if (isSuccess && sessionInfo.data) {
          const userData = sessionInfo.data;
          console.log('📋 User Data from Session Info:', {
            user_id: userData.user_id,
            admin_id: userData.admin_id,
            site_id: userData.site_id,
            organization_id: userData.organization_id,
            user_name: userData.user_name,
            username: userData.username,
            email: userData.email,
            role: userData.role,
            allKeys: Object.keys(userData)
          });
          
          // Use admin_id if available, otherwise use user_id as fallback
          // For some users, adminId might be their own userId
          const adminId = userData.admin_id || userData.user_id;
          
          // Extract site_id from session info for attendance API calls
          const siteId = userData.site_id;
          if (!siteId) {
            console.warn('⚠️ site_id missing in session info response. Attendance API calls may fail.');
          } else {
            console.log('✅ siteId extracted from session info:', siteId);
          }
          
          // Extract first assigned project if available
          let assignedProject: AssignedProject | undefined;
          console.log('🔍 Checking assigned_projects in session info:', {
            hasAssignedProjects: !!userData.assigned_projects,
            isArray: Array.isArray(userData.assigned_projects),
            length: userData.assigned_projects?.length,
            assignedProjects: userData.assigned_projects
          });
          
          if (userData.assigned_projects && Array.isArray(userData.assigned_projects) && userData.assigned_projects.length > 0) {
            assignedProject = userData.assigned_projects[0];
            console.log('✅ Assigned project found and extracted:', {
              assignment_id: assignedProject.assignment_id,
              project_id: assignedProject.project_id,
              project_name: assignedProject.project_name,
              fullProject: assignedProject
            });
          } else {
            console.log('ℹ️ No assigned projects in session info');
          }
          
          set({ 
            isAuthenticated: true, 
            isLoading: false,
            employee: {
              ...get().employee,
              id: userData.user_id,
              name: userData.user_name || userData.username || get().employee.name,
              email: userData.email || get().employee.email,
              role: userData.role,
              organizationId: userData.organization_id,
              adminId: adminId, // Use admin_id or fallback to user_id
              siteId: siteId, // Site ID from session info for attendance API calls
              assignedProject: assignedProject, // Save first assigned project if available
            }
          });
          
          // Verify assignedProject was saved
          const savedEmployee = get().employee;
          console.log('💾 Employee state after save:', {
            hasAssignedProject: !!savedEmployee.assignedProject,
            projectId: savedEmployee.assignedProject?.project_id,
            projectName: savedEmployee.assignedProject?.project_name,
            siteId: savedEmployee.siteId
          });
          
          // Log if adminId was missing and we used fallback
          if (!userData.admin_id) {
            console.warn('⚠️ admin_id missing in session info response. Using userId as fallback:', {
              userId: userData.user_id,
              adminId: adminId,
              availableFields: Object.keys(userData)
            });
          } else {
            console.log('✅ adminId set from session info:', adminId);
          }

          // Store FCM token after successful login
          try {
            const fcmToken = await getFcmToken();
            if (fcmToken && userData.user_id) {
              console.log('📱 Storing FCM token for user:', userData.user_id);
              await apiService.updateFcmToken(userData.user_id, fcmToken);
              console.log('✅ FCM token stored successfully');
            } else {
              console.warn('⚠️ FCM token not available or user_id missing');
            }
          } catch (fcmError) {
            console.error('❌ Error storing FCM token:', fcmError);
            // Don't fail login if FCM token storage fails
          }

          // Store is_photo_updated flag in employee state
          const isPhotoUpdated = userData.is_photo_updated !== false; // Default to true if not explicitly false
          
          set((state) => ({
            employee: {
              ...state.employee,
              isPhotoUpdated: userData.is_photo_updated ?? true, // Store the flag
            }
          }));

          // Check if is_photo_updated is false - then capture selfie immediately
          // Only open camera if flag is explicitly false AND not already updated
          if (userData.is_photo_updated === false) {
            const currentState = get();
            // Double check: only open if flag is still false in state
            if (currentState.employee.isPhotoUpdated === false) {
              console.log('📸 is_photo_updated is false - opening camera immediately for selfie');
              // Trigger profile photo capture immediately after login
              setTimeout(async () => {
                try {
                  await get().captureAndUploadProfilePhoto();
                } catch (error) {
                  console.error('❌ Error capturing profile photo after login:', error);
                }
              }, 300); // Minimal delay to ensure navigation starts
            } else {
              console.log('✅ Photo already updated, skipping camera');
            }
          } else {
            console.log('✅ is_photo_updated is true or undefined, skipping camera');
          }
        } else {
          console.warn('⚠️ Session info response missing success or data:', sessionInfo);
          // Fallback if session info fails
          set({ 
            isAuthenticated: true, 
            isLoading: false,
            employee: {
              ...get().employee,
              id: response.user_id,
              role: response.role,
            }
          });
        }
      } catch (sessionError) {
        console.error('❌ Error fetching session info:', sessionError);
        // Still set authenticated even if session info fails
        set({ 
          isAuthenticated: true, 
          isLoading: false,
          employee: {
            ...get().employee,
            id: response.user_id,
            role: response.role,
          }
        });
      }

      // Fetch today's attendance after login
      await get().fetchTodayAttendance();

      // Fetch organization settings after login
      await get().fetchOrganizationSettings();

      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  },

  logout: async () => {
    try {
      // Clear all auth data from storage (access token, refresh token, user data)
      await storageService.clearAuthData();
      
      // Verify access token is cleared
      const tokenAfterLogout = await storageService.getAccessToken();
      if (tokenAfterLogout) {
        console.warn('⚠️ Access token still exists after logout, clearing again...');
        await storageService.clearAuthData();
      }
      
      // Reset all state to initial values
      set({ 
        isAuthenticated: false,
        isLoading: false,
        todayAttendance: null,
        attendanceHistory: [],
        leaveBalance: { casual: 8, sick: 10, privilege: 15, wfh: 12 },
        leaveRequests: mockLeaveRequests,
        tasks: mockTasks,
        paySlips: mockPaySlips,
        holidays: mockHolidays,
        announcements: mockAnnouncements,
        employee: {
          ...mockEmployee,
          isPhotoUpdated: undefined, // Reset photo flag
        },
        notificationsEnabled: true,
        organizationSettings: null,
      });
      
      console.log('✅ Logout successful - all state cleared, redirecting to login page');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Still clear the state even if storage fails
      set({ 
        isAuthenticated: false,
        isLoading: false,
        todayAttendance: null,
        attendanceHistory: [],
        employee: {
          ...mockEmployee,
          isPhotoUpdated: undefined, // Reset photo flag
        },
        organizationSettings: null,
      });
      console.log('✅ State reset - redirecting to login page');
    }
  },

  checkAuth: async () => {
    try {
      const isAuth = await storageService.isAuthenticated();
      if (isAuth) {
        const userId = await storageService.getUserId();
        const userRole = await storageService.getUserRole();
        
        // Fetch session info to get employee name and details
        try {
          const sessionInfo = await apiService.getSessionInfo();
          console.log('📋 Session Info Response (checkAuth):', sessionInfo);
          
          // Check if response is successful (status 200 or success: true)
          const isSuccess = (sessionInfo.status === 200 || sessionInfo.success === true);
          
          if (isSuccess && sessionInfo.data) {
            const userData = sessionInfo.data;
            console.log('📋 User Data from Session Info (checkAuth):', {
              user_id: userData.user_id,
              admin_id: userData.admin_id,
              site_id: userData.site_id,
              organization_id: userData.organization_id,
              user_name: userData.user_name,
              username: userData.username,
              email: userData.email,
              role: userData.role,
              allKeys: Object.keys(userData)
            });
            
            // Use admin_id if available, otherwise use user_id as fallback
            const adminId = userData.admin_id || userData.user_id;
            
            // Extract site_id from session info for attendance API calls
            const siteId = userData.site_id;
            if (!siteId) {
              console.warn('⚠️ site_id missing in session info response (checkAuth). Attendance API calls may fail.');
            } else {
              console.log('✅ siteId extracted from session info (checkAuth):', siteId);
            }
            
            // Extract first assigned project if available
            let assignedProject: AssignedProject | undefined;
            console.log('🔍 Checking assigned_projects in session info (checkAuth):', {
              hasAssignedProjects: !!userData.assigned_projects,
              isArray: Array.isArray(userData.assigned_projects),
              length: userData.assigned_projects?.length,
              assignedProjects: userData.assigned_projects
            });
            
            if (userData.assigned_projects && Array.isArray(userData.assigned_projects) && userData.assigned_projects.length > 0) {
              assignedProject = userData.assigned_projects[0];
              console.log('✅ Assigned project found (checkAuth):', {
                assignment_id: assignedProject.assignment_id,
                project_id: assignedProject.project_id,
                project_name: assignedProject.project_name,
                fullProject: assignedProject
              });
            } else {
              console.log('ℹ️ No assigned projects in session info (checkAuth)');
            }
            
            set({ 
              isAuthenticated: true,
              employee: {
                ...get().employee,
                id: userData.user_id,
                name: userData.user_name || userData.username || get().employee.name,
                email: userData.email || get().employee.email,
                role: userData.role,
                organizationId: userData.organization_id,
                adminId: adminId, // Use admin_id or fallback to user_id
                siteId: siteId, // Site ID from session info for attendance API calls
                assignedProject: assignedProject, // Save first assigned project if available
                isPhotoUpdated: userData.is_photo_updated ?? get().employee.isPhotoUpdated ?? true, // Store flag, default to true
              }
            });
            
            // Verify assignedProject was saved
            const savedEmployee = get().employee;
            console.log('💾 Employee state after save (checkAuth):', {
              hasAssignedProject: !!savedEmployee.assignedProject,
              projectId: savedEmployee.assignedProject?.project_id,
              projectName: savedEmployee.assignedProject?.project_name,
              siteId: savedEmployee.siteId,
              isPhotoUpdated: savedEmployee.isPhotoUpdated
            });
            
            // Log if adminId was missing and we used fallback
            if (!userData.admin_id) {
              console.warn('⚠️ admin_id missing in session info response (checkAuth). Using userId as fallback:', {
                userId: userData.user_id,
                adminId: adminId,
                availableFields: Object.keys(userData)
              });
            } else {
              console.log('✅ adminId set from session info (checkAuth):', adminId);
            }
            
            // Check if is_photo_updated is false - then capture selfie immediately
            // Only open camera if flag is explicitly false AND not already updated in state
            if (userData.is_photo_updated === false) {
              const currentState = get();
              // Double check: only open if flag is still false in state
              if (currentState.employee.isPhotoUpdated === false) {
                console.log('📸 is_photo_updated is false (checkAuth) - opening camera immediately for selfie');
                // Trigger profile photo capture immediately after auth check
                setTimeout(async () => {
                  try {
                    await get().captureAndUploadProfilePhoto();
                  } catch (error) {
                    console.error('❌ Error capturing profile photo after checkAuth:', error);
                  }
                }, 300); // Minimal delay to ensure navigation starts
              } else {
                console.log('✅ Photo already updated (checkAuth), skipping camera');
              }
            } else {
              console.log('✅ is_photo_updated is true or undefined (checkAuth), skipping camera');
            }
          } else {
            console.warn('⚠️ Session info response missing success or data (checkAuth):', sessionInfo);
            // Fallback
            set({ 
              isAuthenticated: true,
              employee: {
                ...get().employee,
                id: userId || get().employee.id,
                role: userRole || get().employee.role,
              }
            });
          }
        } catch (sessionError) {
          console.error('❌ Error fetching session info (checkAuth):', sessionError);
          // Fallback if session info fails
          set({ 
            isAuthenticated: true,
            employee: {
              ...get().employee,
              id: userId || get().employee.id,
              role: userRole || get().employee.role,
            }
          });
        }

        // Fetch today's attendance after auth check
        await get().fetchTodayAttendance();
        // Fetch attendance history
        await get().fetchAttendanceHistory();
        // Fetch organization settings
        await get().fetchOrganizationSettings();
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      set({ isAuthenticated: false });
    }
  },

  completeOnboarding: () => {
    set({ hasSeenOnboarding: true });
  },

  checkIn: async (base64Images?: string[], latitude?: number, longitude?: number) => {
    const state = get();
    const userId = state.employee.id;
    
    if (!userId) {
      return { success: false, error: "User ID not found. Please login again." };
    }

    // Get project_id from assigned project if available
    const projectId = state.employee.assignedProject?.project_id;
    console.log('🔍 Check-in - Employee state:', {
      employeeId: state.employee.id,
      hasAssignedProject: !!state.employee.assignedProject,
      assignedProject: state.employee.assignedProject,
      projectId: projectId,
      projectIdType: typeof projectId,
      projectName: state.employee.assignedProject?.project_name,
      willIncludeProject: projectId !== undefined && projectId !== null
    });

    try {
      const response = await apiService.checkInOut(userId, base64Images, latitude, longitude, true, projectId);
      // Don't fetch here - let the caller handle it
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Check-in failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  },

  checkOut: async (base64Images?: string[], latitude?: number, longitude?: number) => {
    const state = get();
    const userId = state.employee.id;
    
    if (!userId) {
      return { success: false, error: "User ID not found. Please login again." };
    }

    // Get project_id from assigned project if available
    const projectId = state.employee.assignedProject?.project_id;
    console.log('🔍 Check-out - Assigned project:', {
      hasAssignedProject: !!state.employee.assignedProject,
      projectId: projectId,
      projectName: state.employee.assignedProject?.project_name
    });

    try {
      const response = await apiService.checkInOut(userId, base64Images, latitude, longitude, false, projectId);
      // Don't fetch here - let the caller handle it
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Check-out failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  },

  fetchTodayAttendance: async () => {
    const state = get();
    const userId = state.employee.id;
    const siteId = state.employee.siteId;
    
    if (!userId || !siteId) {
      console.log('Cannot fetch today attendance: missing userId or siteId', { userId, siteId });
      return;
    }

    try {
      // Get today's date in local timezone (YYYY-MM-DD format)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;
      
      // Use employee-attendance API with site_id and user_id to get today's attendance
      const response = await apiService.getUserAttendanceByDate(siteId, userId, today);
      
      if (response.data && response.data.length > 0) {
        // Get the first (and should be only) attendance record for this user
        const attendance = response.data[0];
        
        if (attendance) {
          const now = new Date();
          const dateStr = attendance.attendance_date || now.toISOString().split("T")[0];
          
          // Convert backend format to app format (hours and minutes only)
          const formatTime = (timeStr: string | null): string | null => {
            if (!timeStr) return null;
            try {
              const date = new Date(timeStr);
              const hours = date.getHours();
              const minutes = date.getMinutes();
              const ampm = hours >= 12 ? "PM" : "AM";
              const displayHours = hours % 12 || 12;
              return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
            } catch {
              return timeStr;
            }
          };

          // Parse production hours (format: "1h 8m" or "1h 20m")
          let totalHours = 0;
          if (attendance.production_hours) {
            const hoursMatch = attendance.production_hours.match(/(\d+)h/);
            const minutesMatch = attendance.production_hours.match(/(\d+)m/);
            const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
            const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
            totalHours = hours + (minutes / 60);
          }

          // Determine status - check if late
          let status: AttendanceRecord["status"] = attendance.attendance_status.toLowerCase() as AttendanceRecord["status"];
          if (attendance.is_late && status === "present") {
            status = "late";
          }

          // Parse multiple entries - handle different response formats
          let multipleEntries: MultipleCheckEntry[] = [];
          if (attendance.multiple_entries && Array.isArray(attendance.multiple_entries)) {
            try {
              multipleEntries = attendance.multiple_entries.map((entry: any) => ({
                id: entry.id || 0,
                checkInTime: formatTime(entry.check_in_time || entry.check_in || null),
                checkOutTime: formatTime(entry.check_out_time || entry.check_out || null),
                totalWorkingMinutes: entry.total_working_minutes || entry.total_working_hours * 60 || 0,
                remarks: entry.remarks || entry.remark || null,
                checkInImage: entry.check_in_image || entry.checkInImage || null,
                checkOutImage: entry.check_out_image || entry.checkOutImage || null,
              }));
            } catch (error) {
              console.error('Error parsing multiple entries in fetchTodayAttendance:', error, attendance.multiple_entries);
            }
          }

          const attendanceRecord: AttendanceRecord = {
            id: attendance.id.toString(),
            date: dateStr,
            checkIn: formatTime(attendance.check_in),
            checkOut: formatTime(attendance.check_out),
            status: status,
            totalHours: totalHours,
            location: "Office", // Can be enhanced with location data
            lastLoginStatus: attendance.last_login_status || null,
            shiftName: attendance.shift_name || null,
            multipleEntries: multipleEntries.length > 0 ? multipleEntries : undefined,
          };

          set({ todayAttendance: attendanceRecord });
        } else {
          // No attendance record found for today
          set({ todayAttendance: null });
        }
      } else {
        // No attendance data for today
        set({ todayAttendance: null });
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      // Don't set error state, just log it
    }
  },

  // Fetch attendance after punch - uses employee-attendance API with site_id and user_id
  fetchAttendanceAfterPunch: async () => {
    const state = get();
    const userId = state.employee.id;
    const siteId = state.employee.siteId;
    
    if (!userId || !siteId) {
      console.log('Cannot fetch attendance: missing userId or siteId', { userId, siteId });
      return;
    }

    try {
      // Get today's date in local timezone (YYYY-MM-DD format)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;
      console.log('Fetching attendance for user:', { siteId, userId, today });
      
      // Call employee-attendance API with site_id and user_id
      const response = await apiService.getUserAttendanceByDate(siteId, userId, today);
      console.log('Attendance API response (fetchAttendanceAfterPunch):', JSON.stringify(response, null, 2));
      
      if (response.data && response.data.length > 0) {
        // Get the first (and should be only) attendance record for this user
        const attendance = response.data[0];
        
        if (attendance) {
          const now = new Date();
          const dateStr = attendance.attendance_date || now.toISOString().split("T")[0];
          
          // Convert backend format to app format (hours and minutes only)
          const formatTime = (timeStr: string | null): string | null => {
            if (!timeStr) return null;
            try {
              const date = new Date(timeStr);
              const hours = date.getHours();
              const minutes = date.getMinutes();
              const ampm = hours >= 12 ? "PM" : "AM";
              const displayHours = hours % 12 || 12;
              return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
            } catch {
              return timeStr;
            }
          };

          // Parse production hours (format: "1h 8m" or "1h 20m")
          let totalHours = 0;
          if (attendance.production_hours) {
            const hoursMatch = attendance.production_hours.match(/(\d+)h/);
            const minutesMatch = attendance.production_hours.match(/(\d+)m/);
            const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
            const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
            totalHours = hours + (minutes / 60);
          }

          // Determine status - check if late
          let status: AttendanceRecord["status"] = attendance.attendance_status.toLowerCase() as AttendanceRecord["status"];
          if (attendance.is_late && status === "present") {
            status = "late";
          }

          // Parse multiple entries - handle different response formats
          let multipleEntries: MultipleCheckEntry[] = [];
          if (attendance.multiple_entries && Array.isArray(attendance.multiple_entries)) {
            try {
              multipleEntries = attendance.multiple_entries.map((entry: any) => ({
                id: entry.id || 0,
                checkInTime: formatTime(entry.check_in_time || entry.check_in || null),
                checkOutTime: formatTime(entry.check_out_time || entry.check_out || null),
                totalWorkingMinutes: entry.total_working_minutes || entry.total_working_hours * 60 || 0,
                remarks: entry.remarks || entry.remark || null,
                checkInImage: entry.check_in_image || entry.checkInImage || null,
                checkOutImage: entry.check_out_image || entry.checkOutImage || null,
              }));
            } catch (error) {
              console.error('Error parsing multiple entries in fetchAttendanceAfterPunch:', error, attendance.multiple_entries);
            }
          }

          const attendanceRecord: AttendanceRecord = {
            id: attendance.id.toString(),
            date: dateStr,
            checkIn: formatTime(attendance.check_in),
            checkOut: formatTime(attendance.check_out),
            status: status,
            totalHours: totalHours,
            location: "Office",
            lastLoginStatus: attendance.last_login_status || null,
            shiftName: attendance.shift_name || null,
            multipleEntries: multipleEntries.length > 0 ? multipleEntries : undefined,
          };

          set({ todayAttendance: attendanceRecord });
        } else {
          set({ todayAttendance: null });
        }
      } else {
        // No attendance data for today
        set({ todayAttendance: null });
      }
    } catch (error) {
      console.error('Error fetching attendance after punch:', error);
    }
  },

  fetchAttendanceHistory: async (orgId?: string, fromDate?: string, toDate?: string) => {
    const state = get();
    const userId = state.employee.id;
    const employeeOrgId = orgId || state.employee.organizationId;
    const adminId = state.employee.adminId;
    
    console.log('📊 fetchAttendanceHistory called:', {
      userId,
      employeeOrgId,
      adminId,
      fromDate,
      toDate
    });
    
    // Try to use adminId if orgId is not available (some APIs might use adminId instead)
    const finalOrgId = employeeOrgId || adminId;
    
    if (!userId || !finalOrgId) {
      console.warn('⚠️ Cannot fetch attendance history: missing userId or orgId/adminId', {
        userId,
        orgId: employeeOrgId,
        adminId,
        finalOrgId
      });
      return;
    }

    try {
      console.log('📊 Calling getAttendanceHistory with:', {
        orgId: finalOrgId,
        userId,
        fromDate,
        toDate
      });
      
      const response = await apiService.getAttendanceHistory(
        finalOrgId,
        userId,
        fromDate,
        toDate
      );

      // Convert backend format to app format
      const formatTime = (timeStr: string | null): string | null => {
        if (!timeStr) return null;
        try {
          const date = new Date(timeStr);
          const hours = date.getHours();
          const minutes = date.getMinutes();
          const ampm = hours >= 12 ? "PM" : "AM";
          const displayHours = hours % 12 || 12;
          return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
        } catch {
          return timeStr;
        }
      };

      const history: AttendanceRecord[] = response.data.results.map((item) => {
        // Parse production hours (format: "1h 8m" or "1h 20m")
        let totalHours = 0;
        if (item.production_hours) {
          const hoursMatch = item.production_hours.match(/(\d+)h/);
          const minutesMatch = item.production_hours.match(/(\d+)m/);
          const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
          const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
          totalHours = hours + (minutes / 60);
        }

        // Parse multiple entries - handle different response formats
        let multipleEntries: MultipleCheckEntry[] = [];
        if (item.multiple_entries && Array.isArray(item.multiple_entries)) {
          try {
            multipleEntries = item.multiple_entries.map((entry: any) => ({
              id: entry.id || 0,
              checkInTime: formatTime(entry.check_in_time || entry.check_in || null),
              checkOutTime: formatTime(entry.check_out_time || entry.check_out || null),
              totalWorkingMinutes: entry.total_working_minutes || entry.total_working_hours * 60 || 0,
              remarks: entry.remarks || entry.remark || null,
              checkInImage: entry.check_in_image || entry.checkInImage || null,
              checkOutImage: entry.check_out_image || entry.checkOutImage || null,
            }));
          } catch (error) {
            console.error('Error parsing multiple entries in history:', error, item.multiple_entries);
          }
        }

        return {
          id: item.id.toString(),
          date: item.attendance_date,
          checkIn: formatTime(item.check_in),
          checkOut: formatTime(item.check_out),
          status: item.attendance_status.toLowerCase() as AttendanceRecord["status"],
          totalHours: totalHours,
          location: "Office",
          shiftName: item.shift_name || null,
          multipleEntries: multipleEntries.length > 0 ? multipleEntries : undefined,
        };
      });

      set({ attendanceHistory: history });
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      // Keep existing history on error
    }
  },

  // Fetch attendance for a specific date
  fetchAttendanceByDate: async (date: string) => {
    const state = get();
    const userId = state.employee.id;
    const siteId = state.employee.siteId;
    
    if (!userId || !siteId) {
      console.log('❌ Cannot fetch attendance by date: missing userId or siteId', { userId, siteId });
      return null;
    }

    try {
      console.log('📅 Fetching attendance for date:', { siteId, userId, date });
      
      // Call employee-attendance API with site_id and user_id for specific date
      const response = await apiService.getUserAttendanceByDate(siteId, userId, date);
      console.log('📥 Attendance API response for date:', date);
      console.log('📦 Response structure:', {
        hasData: !!response.data,
        dataLength: response.data?.length || 0,
        dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
        status: response.status,
        message: response.message
      });
      
      // Handle different response structures
      let attendanceData = null;
      
      // Check if response.data is an array
      if (response.data && Array.isArray(response.data)) {
        if (response.data.length > 0) {
          attendanceData = response.data[0];
        } else {
          console.log('⚠️ Response.data is empty array - no attendance for this date');
        }
      } else if (response.data && typeof response.data === 'object') {
        // If response.data is an object (not array), use it directly
        attendanceData = response.data;
        console.log('⚠️ Response.data is object (not array), using directly');
      } else {
        console.log('⚠️ Response.data is not in expected format:', typeof response.data);
      }
      
      if (attendanceData) {
        console.log('✅ Found attendance record:', {
          id: attendanceData.id,
          date: attendanceData.attendance_date,
          checkIn: attendanceData.check_in,
          checkOut: attendanceData.check_out,
          status: attendanceData.attendance_status,
          hasMultipleEntries: !!attendanceData.multiple_entries
        });
        
        const attendance = attendanceData;
        const dateStr = attendance.attendance_date || date;
        
        // Convert backend format to app format (hours and minutes only)
        const formatTime = (timeStr: string | null): string | null => {
          if (!timeStr) return null;
          try {
            const date = new Date(timeStr);
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const ampm = hours >= 12 ? "PM" : "AM";
            const displayHours = hours % 12 || 12;
            return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
          } catch {
            return timeStr;
          }
        };

        // Parse production hours (format: "1h 8m" or "1h 20m")
        let totalHours = 0;
        if (attendance.production_hours) {
          const hoursMatch = attendance.production_hours.match(/(\d+)h/);
          const minutesMatch = attendance.production_hours.match(/(\d+)m/);
          const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
          const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
          totalHours = hours + (minutes / 60);
        }

        // Determine status - check if late
        let status: AttendanceRecord["status"] = attendance.attendance_status?.toLowerCase() as AttendanceRecord["status"] || "absent";
        if (attendance.is_late && status === "present") {
          status = "late";
        }

        // Parse multiple entries - handle different response formats
        let multipleEntries: MultipleCheckEntry[] = [];
        if (attendance.multiple_entries && Array.isArray(attendance.multiple_entries)) {
          try {
            multipleEntries = attendance.multiple_entries.map((entry: any) => ({
              id: entry.id || 0,
              checkInTime: formatTime(entry.check_in_time || entry.check_in || null),
              checkOutTime: formatTime(entry.check_out_time || entry.check_out || null),
              totalWorkingMinutes: entry.total_working_minutes || entry.total_working_hours * 60 || 0,
              remarks: entry.remarks || entry.remark || null,
              checkInImage: entry.check_in_image || entry.checkInImage || null,
              checkOutImage: entry.check_out_image || entry.checkOutImage || null,
            }));
          } catch (error) {
            console.error('Error parsing multiple entries in fetchAttendanceByDate:', error, attendance.multiple_entries);
          }
        }

        const attendanceRecord: AttendanceRecord = {
          id: attendance.id?.toString() || `att-${date}`,
          date: dateStr,
          checkIn: formatTime(attendance.check_in),
          checkOut: formatTime(attendance.check_out),
          status: status,
          totalHours: totalHours,
          location: "Office",
          lastLoginStatus: attendance.last_login_status || null,
          shiftName: attendance.shift_name || null,
          multipleEntries: multipleEntries.length > 0 ? multipleEntries : undefined,
        };

        console.log('✅ Parsed attendance record:', attendanceRecord);
        return attendanceRecord;
      } else {
        console.log('⚠️ No attendance data found for date:', date, {
          responseData: response.data,
          responseStatus: response.status,
          responseMessage: response.message
        });
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error fetching attendance by date:', error);
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      return null;
    }
  },

  fetchLeaveTypes: async () => {
    const state = get();
    const siteId = state.employee.siteId;
    
    if (!siteId) {
      return { success: false, error: "Site ID not found. Please login again." };
    }

    try {
      const response = await apiService.getLeaveTypes(siteId);
      // Store leave types if needed for future use
      console.log('Leave types fetched:', response.data?.length || 0);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch leave types.';
      console.error('Error fetching leave types:', error);
      return { success: false, error: errorMessage };
    }
  },

  applyLeave: async (leave) => {
    const state = get();
    const siteId = state.employee.siteId;
    const userId = state.employee.id;
    
    if (!siteId || !userId) {
      return { success: false, error: "User ID or Site ID not found. Please login again." };
    }

    // First, fetch leave types to get the correct ID
    let leaveTypeId: number | null = null;
    try {
      const leaveTypesResponse = await apiService.getLeaveTypes(siteId);
      const leaveTypes = leaveTypesResponse.data || [];
      
      // Map leave type string (casual, sick, etc.) to code (CL, SL, etc.)
      const leaveTypeCodeMap: Record<string, string> = {
        casual: "CL",
        sick: "SL",
        privilege: "PL",
        wfh: "WFH",
      };
      
      const expectedCode = leaveTypeCodeMap[leave.type];
      const matchedType = leaveTypes.find((lt) => lt.code === expectedCode);
      
      if (!matchedType) {
        // Fallback: try to find by name (case-insensitive)
        const matchedByName = leaveTypes.find(
          (lt) => lt.name.toLowerCase().includes(leave.type.toLowerCase())
        );
        if (matchedByName) {
          leaveTypeId = matchedByName.id;
        } else {
          return { success: false, error: `Leave type '${leave.type}' not found. Available types: ${leaveTypes.map(lt => lt.name).join(', ')}` };
        }
      } else {
        leaveTypeId = matchedType.id;
      }
    } catch (error) {
      return { success: false, error: "Failed to fetch leave types. Please try again." };
    }

    if (!leaveTypeId) {
      return { success: false, error: `Invalid leave type: ${leave.type}` };
    }

    try {
      // Format dates to YYYY-MM-DD
      const fromDate = leave.startDate;
      const toDate = leave.endDate;

      const response = await apiService.applyLeave(
        siteId,
        userId,
        leaveTypeId,
        fromDate,
        toDate,
        leave.reason
      );

      if (response.status === 201 && response.data) {
        // Convert API response to LeaveRequest format
    const newLeave: LeaveRequest = {
          id: response.data.id.toString(),
          type: leave.type,
          startDate: response.data.from_date,
          endDate: response.data.to_date,
          reason: response.data.reason,
          status: response.data.status as "pending" | "approved" | "rejected",
          appliedDate: response.data.applied_at.split("T")[0],
    };
    
    set((state) => ({
      leaveRequests: [newLeave, ...state.leaveRequests],
    }));

        return { success: true };
      } else {
        return { success: false, error: response.message || "Failed to apply leave." };
      }
    } catch (error: any) {
      // Handle API error response
      let errorMessage = 'Failed to apply leave. Please try again.';
      
      if (error?.responseData) {
        // Error data from API service
        const errorData = error.responseData;
        errorMessage = errorData.message || errorMessage;
        
        // Handle validation errors
        if (errorData.data) {
          const validationErrors = Object.values(errorData.data).flat();
          if (Array.isArray(validationErrors) && validationErrors.length > 0) {
            errorMessage = validationErrors.join(', ');
          }
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      console.error('Error applying leave:', error);
      return { success: false, error: errorMessage };
    }
  },

  fetchTasks: async () => {
    const state = get();
    const siteId = state.employee.siteId;
    const userId = state.employee.id;

    if (!siteId || !userId) {
      return { success: false, error: "Site ID or User ID not found. Please login again." };
    }

    try {
      // Fetch all tasks (no status filter to get all)
      const response = await apiService.getMyTasks(siteId, userId);

      if (response.data) {
        // Convert API response to Task format
        const tasks: Task[] = response.data.map((taskAPI: TaskAPI) => {
          // Map priority from API to app format
          let priority: "low" | "medium" | "high" = "medium";
          if (taskAPI.priority === "urgent") {
            priority = "high";
          } else if (taskAPI.priority === "low" || taskAPI.priority === "medium" || taskAPI.priority === "high") {
            priority = taskAPI.priority;
          }

          // Map status from API to app format
          // API returns "in_progress" (underscore), app uses "in-progress" (hyphen)
          let status: "pending" | "in-progress" | "completed" = "pending";
          if (taskAPI.status === "in_progress" || taskAPI.status === "in-progress") {
            status = "in-progress";
          } else if (taskAPI.status === "completed") {
            status = "completed";
          } else if (taskAPI.status === "pending") {
            status = "pending";
          }

          return {
            id: taskAPI.id.toString(),
            title: taskAPI.title,
            description: taskAPI.description || "",
            status: status,
            priority: priority,
            dueDate: taskAPI.due_date || new Date().toISOString().split('T')[0],
            assignedBy: taskAPI.assigned_by_email || "Unknown",
            attachments: taskAPI.attachments?.length || 0,
            comments: taskAPI.comments?.map((comment: any, index: number) => ({
              id: `comment-${taskAPI.id}-${index}`,
              author: comment.author || "Unknown",
              text: comment.text || comment.content || "",
              timestamp: comment.timestamp || comment.created_at || new Date().toISOString(),
            })) || [],
            startTime: taskAPI.start_time || null,
            endTime: taskAPI.end_time || null,
            startDate: taskAPI.start_date || null,
            actualHours: taskAPI.actual_hours || null,
            completedAt: taskAPI.completed_at || null,
            taskTypeName: taskAPI.task_type_name || "",
          };
        });

        set({ tasks });
        return { success: true };
      }

      return { success: false, error: "No tasks found." };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tasks. Please try again.';
      console.error('Error fetching tasks:', error);
      return { success: false, error: errorMessage };
    }
  },

  updateTaskStatus: async (taskId, status, comment) => {
    const state = get();
    const siteId = state.employee.siteId;

    if (!siteId) {
      return { success: false, error: "Site ID not found. Please login again." };
    }

    try {
      const taskIdNumber = parseInt(taskId, 10);
      if (isNaN(taskIdNumber)) {
        return { success: false, error: "Invalid task ID." };
      }

      const response = await apiService.updateTaskStatus(siteId, taskIdNumber, status, comment);

      if (response.status === 200 || response.status === 201) {
        // Update local state with new task data
        if (response.data) {
          const updatedTaskAPI = response.data;
          let priority: "low" | "medium" | "high" = "medium";
          if (updatedTaskAPI.priority === "urgent") {
            priority = "high";
          } else if (updatedTaskAPI.priority === "low" || updatedTaskAPI.priority === "medium" || updatedTaskAPI.priority === "high") {
            priority = updatedTaskAPI.priority;
          }

          // Map status from API to app format
          // API returns "in_progress" (underscore), app uses "in-progress" (hyphen)
          let taskStatus: "pending" | "in-progress" | "completed" = "pending";
          if (updatedTaskAPI.status === "in_progress" || updatedTaskAPI.status === "in-progress") {
            taskStatus = "in-progress";
          } else if (updatedTaskAPI.status === "completed") {
            taskStatus = "completed";
          } else if (updatedTaskAPI.status === "pending") {
            taskStatus = "pending";
          }

          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    status: taskStatus,
                    priority: priority,
                    taskTypeName: updatedTaskAPI.task_type_name || task.taskTypeName || "",
                  }
                : task
            ),
          }));
        } else {
          // Fallback: just update status locally
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, status } : task
      ),
    }));
        }

        return { success: true };
      }

      return { success: false, error: "Failed to update task status." };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task status. Please try again.';
      console.error('Error updating task status:', error);
      return { success: false, error: errorMessage };
    }
  },

  addTaskComment: (taskId, text) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author: get().employee.name,
      text,
      timestamp: new Date().toLocaleString(),
    };
    
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, comments: [...task.comments, newComment] }
          : task
      ),
    }));
  },

  fetchHolidays: async () => {
    const state = get();
    const siteId = state.employee.siteId;
    
    if (!siteId) {
      return { success: false, error: "Site ID not found. Please login again." };
    }

    try {
      const response = await apiService.getHolidays(siteId);
      
      // Convert API response to Holiday format
      const holidays: Holiday[] = (response.data || []).map((holiday) => ({
        id: holiday.id.toString(),
        name: holiday.name,
        date: holiday.holiday_date,
        type: holiday.is_optional ? "optional" : "public" as "public" | "company" | "optional",
        isFavorite: false, // Default to false, user can toggle
      }));

      set({ holidays });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch holidays. Please try again.';
      console.error('Error fetching holidays:', error);
      return { success: false, error: errorMessage };
    }
  },

  toggleHolidayFavorite: (holidayId) => {
    set((state) => ({
      holidays: state.holidays.map((holiday) =>
        holiday.id === holidayId
          ? { ...holiday, isFavorite: !holiday.isFavorite }
          : holiday
      ),
    }));
  },

  markAnnouncementRead: (announcementId) => {
    set((state) => ({
      announcements: state.announcements.map((ann) =>
        ann.id === announcementId ? { ...ann, isRead: true } : ann
      ),
    }));
  },

  toggleNotifications: () => {
    set((state) => ({ notificationsEnabled: !state.notificationsEnabled }));
  },

  updateProfile: (updates) => {
    set((state) => ({
      employee: { ...state.employee, ...updates },
    }));
  },

  fetchOrganizationSettings: async () => {
    const state = get();
    const organizationId = state.employee.organizationId;
    
    if (!organizationId) {
      console.warn('⚠️ Cannot fetch organization settings: missing organizationId');
      return;
    }

    try {
      console.log('🔍 Fetching organization settings for organizationId:', organizationId);
      const response = await apiService.getOrganizationSettings(organizationId);
      
      if (response.data) {
        console.log('✅ Organization settings fetched:', response.data);
        set({ organizationSettings: response.data });
      } else {
        console.warn('⚠️ Organization settings response missing data');
        // Set default settings (all enabled) if API doesn't return data
        set({ 
          organizationSettings: {
            id: 0,
            organization: '',
            face_recognition_enabled: false,
            auto_checkout_enabled: false,
            auto_checkout_time: null,
            auto_shiftwise_checkout_enabled: false,
            auto_shiftwise_checkout_in_minutes: 30,
            late_punch_enabled: false,
            late_punch_grace_minutes: null,
            early_exit_enabled: false,
            early_exit_grace_minutes: null,
            auto_shift_assignment_enabled: false,
            compensatory_off_enabled: false,
            custom_week_off_enabled: false,
            location_tracking_enabled: false,
            manual_attendance_enabled: false,
            expense_module_enabled: true,
            chat_module_enabled: false,
            group_location_tracking_enabled: false,
            meeting_module_enabled: true,
            business_intelligence_reports_enabled: false,
            payroll_module_enabled: true,
            location_marking_enabled: false,
            sandwich_leave_enabled: false,
            leave_carry_forward_enabled: false,
            min_hours_for_half_day: null,
            multiple_shift_enabled: false,
            email_notifications_enabled: false,
            sms_notifications_enabled: false,
            push_notifications_enabled: false,
            ip_restriction_enabled: false,
            allowed_ip_ranges: null,
            geofencing_enabled: false,
            geofence_radius_in_meters: null,
            device_binding_enabled: false,
            plan_name: null,
            plan_assigned_date: null,
            plan_expiry_date: null,
            leave_year_type: 'calendar',
            leave_year_start_month: 1,
            enabled_menu_items: {
              attendance: true,
              application: true,
              tasks: true,
              'production-management': true,
              'holiday-calendar': true,
              expense: true,
              payroll: true,
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        });
      }
    } catch (error) {
      console.error('❌ Error fetching organization settings:', error);
      // Set default settings (all enabled) on error
      set({ 
        organizationSettings: {
          id: 0,
          organization: '',
          face_recognition_enabled: false,
          auto_checkout_enabled: false,
          auto_checkout_time: null,
          auto_shiftwise_checkout_enabled: false,
          auto_shiftwise_checkout_in_minutes: 30,
          late_punch_enabled: false,
          late_punch_grace_minutes: null,
          early_exit_enabled: false,
          early_exit_grace_minutes: null,
          auto_shift_assignment_enabled: false,
          compensatory_off_enabled: false,
          custom_week_off_enabled: false,
          location_tracking_enabled: false,
          manual_attendance_enabled: false,
          expense_module_enabled: true,
          chat_module_enabled: false,
          group_location_tracking_enabled: false,
          meeting_module_enabled: true,
          business_intelligence_reports_enabled: false,
          payroll_module_enabled: true,
          location_marking_enabled: false,
          sandwich_leave_enabled: false,
          leave_carry_forward_enabled: false,
          min_hours_for_half_day: null,
          multiple_shift_enabled: false,
          email_notifications_enabled: false,
          sms_notifications_enabled: false,
          push_notifications_enabled: false,
          ip_restriction_enabled: false,
          allowed_ip_ranges: null,
          geofencing_enabled: false,
          geofence_radius_in_meters: null,
          device_binding_enabled: false,
          plan_name: null,
          plan_assigned_date: null,
          plan_expiry_date: null,
          leave_year_type: 'calendar',
          leave_year_start_month: 1,
          enabled_menu_items: {
            attendance: true,
            application: true,
            tasks: true,
            'production-management': true,
            'holiday-calendar': true,
            expense: true,
            payroll: true,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      });
    }
  },

  captureAndUploadProfilePhoto: async () => {
    const state = get();
    const userId = state.employee.id;
    
    if (!userId) {
      console.warn('⚠️ Cannot capture profile photo: missing userId');
      return { success: false, error: "User ID not found" };
    }

    try {
      console.log('📸 Opening camera directly for selfie...');
      
      let base64Image: string | null = null;

      // For web platform, use HTML5 getUserMedia API (same as check-in)
      if (Platform.OS === 'web') {
        base64Image = await new Promise<string | null>((resolve) => {
          if (typeof window === 'undefined' || typeof document === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            Alert.alert('Camera Not Available', 'Camera access is not available.');
            resolve(null);
            return;
          }

          // Request camera access IMMEDIATELY
          navigator.mediaDevices
            .getUserMedia({ video: { facingMode: 'user' } })
            .then((stream) => {
              // Create video element
              const video = document.createElement('video');
              video.srcObject = stream;
              video.autoplay = true;
              video.playsInline = true;
              video.style.position = 'fixed';
              video.style.top = '0';
              video.style.left = '0';
              video.style.width = '100%';
              video.style.height = '100%';
              video.style.zIndex = '9999';
              video.style.objectFit = 'cover';
              document.body.appendChild(video);

              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');

              // Create overlay for camera controls
              const overlay = document.createElement('div');
              overlay.style.position = 'fixed';
              overlay.style.top = '0';
              overlay.style.left = '0';
              overlay.style.width = '100%';
              overlay.style.height = '100%';
              overlay.style.zIndex = '10000';
              overlay.style.pointerEvents = 'none';

              // Close button (X) at top right
              const closeButton = document.createElement('button');
              closeButton.innerHTML = '✕';
              closeButton.style.position = 'fixed';
              closeButton.style.top = '20px';
              closeButton.style.right = '20px';
              closeButton.style.width = '44px';
              closeButton.style.height = '44px';
              closeButton.style.borderRadius = '50%';
              closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
              closeButton.style.color = 'white';
              closeButton.style.border = 'none';
              closeButton.style.fontSize = '24px';
              closeButton.style.cursor = 'pointer';
              closeButton.style.display = 'flex';
              closeButton.style.alignItems = 'center';
              closeButton.style.justifyContent = 'center';
              closeButton.style.pointerEvents = 'auto';
              closeButton.style.zIndex = '10001';

              // Bottom container for capture button
              const bottomContainer = document.createElement('div');
              bottomContainer.style.position = 'fixed';
              bottomContainer.style.bottom = '0';
              bottomContainer.style.left = '0';
              bottomContainer.style.width = '100%';
              bottomContainer.style.padding = '30px';
              bottomContainer.style.display = 'flex';
              bottomContainer.style.justifyContent = 'center';
              bottomContainer.style.alignItems = 'center';
              bottomContainer.style.pointerEvents = 'auto';
              bottomContainer.style.zIndex = '10001';
              bottomContainer.style.background = 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)';

              // Circular capture button
              const captureButton = document.createElement('button');
              captureButton.style.width = '70px';
              captureButton.style.height = '70px';
              captureButton.style.borderRadius = '50%';
              captureButton.style.backgroundColor = 'white';
              captureButton.style.border = 'none';
              captureButton.style.cursor = 'pointer';
              captureButton.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';

              // Inner circle
              const innerCircle = document.createElement('div');
              innerCircle.style.width = '60px';
              innerCircle.style.height = '60px';
              innerCircle.style.borderRadius = '50%';
              innerCircle.style.backgroundColor = 'white';
              innerCircle.style.boxShadow = 'inset 0 0 0 3px rgba(0, 0, 0, 0.1)';
              captureButton.appendChild(innerCircle);

              bottomContainer.appendChild(captureButton);
              overlay.appendChild(closeButton);
              overlay.appendChild(bottomContainer);
              document.body.appendChild(overlay);

              const cleanup = () => {
                stream.getTracks().forEach((track) => track.stop());
                if (video.parentNode) {
                  video.parentNode.removeChild(video);
                }
                if (overlay.parentNode) {
                  overlay.parentNode.removeChild(overlay);
                }
              };

              const capturePhoto = () => {
                if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  const imageData = canvas.toDataURL('image/png', 0.8);
                  cleanup();
                  resolve(imageData);
                } else {
                  setTimeout(capturePhoto, 100);
                }
              };

              captureButton.onclick = capturePhoto;
              closeButton.onclick = () => {
                cleanup();
                resolve(null);
              };
            })
            .catch((error) => {
              console.error('Error accessing camera:', error);
              Alert.alert(
                'Camera Access Denied',
                'Please allow camera access to capture selfie.',
                [{ text: 'OK' }]
              );
              resolve(null);
            });
        });

        if (!base64Image) {
          return { success: false, error: "Photo capture cancelled or failed" };
        }
      } else {
        // For mobile platforms, use expo-image-picker
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Camera permission is required to capture selfie.',
            [{ text: 'OK' }]
          );
          return { success: false, error: "Camera permission denied" };
        }

        // Open camera directly - no file picker, just camera
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          base64: true,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
          console.log('📸 Photo capture cancelled by user');
          return { success: false, error: "Photo capture cancelled" };
        }

        const asset = result.assets[0];
        if (!asset.base64) {
          return { success: false, error: "Failed to capture photo" };
        }

        base64Image = `data:image/png;base64,${asset.base64}`;
      }

      if (!base64Image) {
        return { success: false, error: "Failed to capture photo" };
      }
      
      // Comprehensive face detection validation
      console.log('🔍 Validating face in captured image...');
      const faceValidation = await validateFaceImage(base64Image);
      if (!faceValidation.valid) {
        Alert.alert(
          'Face Detection Failed',
          faceValidation.error || 'Please capture a clear photo of your face.',
          [{ text: 'OK' }]
        );
        return { success: false, error: faceValidation.error || "Face detection failed" };
      }
      console.log('✅ Face detected successfully');
      
      // Strip data URI prefix if present (backend expects just base64 string)
      let base64String = base64Image;
      if (base64Image.startsWith('data:image')) {
        // Remove "data:image/png;base64," or similar prefix
        const base64Match = base64Image.match(/^data:image\/[a-z]+;base64,(.+)$/);
        if (base64Match && base64Match[1]) {
          base64String = base64Match[1];
        }
      }
      
      // Upload to backend silently (like check-in)
      console.log('📤 Uploading profile photo...');
      const uploadResult = await get().uploadProfilePhoto(base64String);
      
      if (uploadResult.success) {
        console.log('✅ Profile photo uploaded successfully');
        // Is photo updated will be toggled to true in uploadProfilePhoto function
        // Silent success - no alert, just like check-in
      } else {
        // Only show alert on error
        Alert.alert(
          'Upload Failed',
          uploadResult.error || 'Failed to upload profile photo. Please try again.',
          [{ text: 'OK' }]
        );
      }
      
      return uploadResult;
    } catch (error) {
      console.error('❌ Error in captureAndUploadProfilePhoto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to capture profile photo';
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
      return { success: false, error: errorMessage };
    }
  },

  uploadProfilePhoto: async (base64Image: string) => {
    const state = get();
    const userId = state.employee.id;
    
    if (!userId) {
      return { success: false, error: "User ID not found" };
    }

    try {
      // Step 1: Upload profile photo using base64_image
      const response = await apiService.uploadProfilePhoto(userId, base64Image);
      
      if (response.status === 200 || response.status === 201) {
        // Update employee avatar if URL is returned (backend returns profile_photo)
        if (response.data?.profile_photo) {
          const photoUrl = response.data.profile_photo;
          set((state) => ({
            employee: {
              ...state.employee,
              avatar: photoUrl || null,
            }
          }));
          console.log('✅ Profile photo stored in state');
        }
        
        // Step 2: Toggle is_photo_updated to ON (true) after successful upload
        // This ensures user won't be asked for selfie again on next login
        // IMPORTANT: Always call this API after successful photo upload
        try {
          console.log('🔄 Calling toggleIsPhotoUpdated API to set is_photo_updated = true...');
          console.log('📋 UserId for toggle API:', userId);
          
          const toggleResponse = await apiService.toggleIsPhotoUpdated(userId);
          
          console.log('📋 Toggle API Response:', {
            status: toggleResponse.status,
            message: toggleResponse.message,
            data: toggleResponse.data,
            fullResponse: toggleResponse
          });
          
          // Update employee state flag to true regardless of response format
          // This prevents camera from opening again
          set((state) => ({
            employee: {
              ...state.employee,
              isPhotoUpdated: true,
            }
          }));
          
          if (toggleResponse.status === 200) {
            console.log('✅ Is photo updated API call successful - flag set to true');
            if (toggleResponse.data?.is_photo_updated === true) {
              console.log('✅ Backend confirmed is_photo_updated = true');
            } else {
              console.log('⚠️ Backend response format unexpected, but state updated locally');
            }
          } else {
            console.warn('⚠️ Toggle API returned non-200 status:', toggleResponse.status);
            console.log('✅ State still updated locally to prevent repeated prompts');
          }
        } catch (toggleError: any) {
          console.error('❌ Error calling toggleIsPhotoUpdated API:', toggleError);
          console.error('❌ Error details:', {
            message: toggleError?.message,
            responseData: toggleError?.responseData,
            status: toggleError?.responseData?.status
          });
          
          // CRITICAL: Still update state to prevent repeated camera prompts
          // Even if API fails, we don't want to ask for photo again
          set((state) => ({
            employee: {
              ...state.employee,
              isPhotoUpdated: true,
            }
          }));
          console.log('✅ State updated to true despite API error - camera will not open again');
        }
        
        return { success: true };
      } else {
        return { success: false, error: response.message || "Upload failed" };
      }
    } catch (error) {
      console.error('❌ Error uploading profile photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload profile photo';
      return { success: false, error: errorMessage };
    }
  },
}));
