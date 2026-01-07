// API Configuration and Service
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get the appropriate API URL based on platform
// IMPORTANT: For Expo Go on physical devices, update YOUR_COMPUTER_IP with your actual IP address
// Find your IP: Windows (ipconfig) or Mac/Linux (ifconfig)
// Make sure your phone and computer are on the same WiFi network
const YOUR_COMPUTER_IP = '192.168.10.41'; // UPDATE THIS with your computer's IP address

const getApiBaseUrl = () => {
  if (!__DEV__) {
    return 'https://your-production-api.com'; // Production - Update this
  }

  // Check if running in Expo Go (physical device)
  const isExpoGo = Constants.appOwnership === 'expo';
  const isWeb = Platform.OS === 'web';
  
  // For Expo Go on physical devices, always use computer's IP address
  // Make sure your phone and computer are on the same WiFi network
  if (isExpoGo && !isWeb) {
    const url = `http://${YOUR_COMPUTER_IP}:8000`;
    console.log('🔗 Using API URL for Expo Go (Physical Device):', url);
    console.log('📱 Platform:', Platform.OS);
    console.log('🔧 App Ownership:', Constants.appOwnership);
    console.log('💡 Make sure backend is running: python manage.py runserver 0.0.0.0:8000');
    return url;
  }
  
  // For emulators/simulators/web
  if (Platform.OS === 'android') {
    const url = 'http://10.0.2.2:8000'; // Android emulator
    console.log('🔗 Using API URL for Android emulator:', url);
    return url;
  } else if (Platform.OS === 'ios') {
    const url = 'http://localhost:8000'; // iOS simulator
    console.log('🔗 Using API URL for iOS simulator:', url);
    return url;
  } else {
    // Web platform
    const url = 'http://localhost:8000';
    console.log('🔗 Using API URL for web:', url);
    return url;
  }
};

const API_BASE_URL = getApiBaseUrl();

// Log the API URL being used (helpful for debugging)
console.log('🚀 API Base URL:', API_BASE_URL);
console.log('📱 Platform:', Platform.OS);
console.log('🔧 App Ownership:', Constants.appOwnership);
console.log('🌐 Network Info:', {
  isExpoGo: Constants.appOwnership === 'expo',
  isWeb: Platform.OS === 'web',
  isAndroid: Platform.OS === 'android',
  isIOS: Platform.OS === 'ios',
});

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  refresh_token: string;
  access_token: string;
  user_id: string;
  role: string;
}

export interface AssignedProject {
  assignment_id: number;
  project_id: number;
  project_name: string;
  project_address: string;
  project_city: string;
  project_state: string;
  project_pincode: string;
  is_active: boolean;
}

export interface SessionInfoResponse {
  success?: boolean; // Optional - backend may not return this
  status: number;
  message: string;
  data: {
    user_id: string;
    email: string;
    username: string;
    role: string;
    user_name?: string; // For user role
    admin_name?: string; // For admin role
    organization_id?: string;
    admin_id?: string; // For user role
    site_id?: string; // Site ID from session info
    user_type?: string;
    designation?: string;
    job_title?: string;
    date_joined?: string; // Backend returns this
    is_photo_updated?: boolean; // If false, need to capture profile photo
    assigned_projects?: AssignedProject[]; // Array of assigned projects
  };
}

export interface ApiError {
  error: string;
  detail?: string;
}

export interface AttendanceCheckResponse {
  detail: string;
}

export interface AttendanceImage {
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  image_type: string;
  captured_at: string;
  url: string;
}

export interface MultipleEntry {
  id: number;
  check_in_time: string;
  check_out_time: string | null;
  total_working_minutes: number;
  remarks: string | null;
  check_in_image: string | null;
  check_out_image: string | null;
}

export interface AttendanceHistoryItem {
  id: number;
  user_id: string;
  employee_name: string;
  employee_id: string;
  employee_email: string;
  attendance_status: string;
  last_login_status: string | null;
  check_in: string | null;
  check_out: string | null;
  break_duration: string;
  late_minutes_display: string;
  production_hours: string;
  attendance_date: string;
  shift_name: string;
  is_late: boolean;
  late_minutes: number;
  is_early_exit: boolean;
  early_exit_minutes: number;
  multiple_entries: MultipleEntry[];
  remarks: string | null;
  images?: AttendanceImage[];
}

export interface AttendanceSummary {
  total_employees: number;
  present: number;
  late_login: number;
  absent: number;
  attendance_date: string;
}

export interface AttendanceResponse {
  status: number;
  message: string;
  data: AttendanceHistoryItem[];
  summary?: AttendanceSummary;
  total_objects?: number;
  current_page_number?: number;
}

export interface CheckInOutEntry {
  time: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_late?: boolean;
  late_minutes?: number;
  is_early_exit?: boolean;
  early_exit_minutes?: number;
  total_working_minutes?: number;
}

export interface EmployeeDailyInfo {
  employee_id: string;
  user_id: string;
  employee_name: string;
  username: string;
  email: string;
  custom_employee_id: string;
  designation?: string | null;
  profile_photo_url?: string | null;
  is_active: boolean;
  last_login: string | null;
  last_login_status: string;
  current_day_attendance: {
    date: string;
    first_checkin: string | null;
    last_checkout: string | null;
    total_checkins: number;
    total_checkouts: number;
    check_ins: CheckInOutEntry[];
    check_outs: CheckInOutEntry[];
  };
}

export interface HolidayAPIResponse {
  status?: number;
  message?: string;
  data?: HolidayAPI[];
}

export interface HolidayAPI {
  id: number;
  admin: string;
  organization: string;
  name: string;
  holiday_date: string; // YYYY-MM-DD format
  is_optional: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  day?: string; // Day of week (computed field)
}

// Backend returns array directly or wrapped in response
export type HolidayAPIResponseData = HolidayAPI[] | HolidayAPIResponse;

export interface EmployeeDailyInfoResponse {
  status: number;
  message: string;
  results: EmployeeDailyInfo[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

export interface AttendanceHistoryResponse {
  status: number;
  message: string;
  data: {
    results: AttendanceHistoryItem[];
    count: number;
    next: string | null;
    previous: string | null;
  };
}

export interface MonthlyAttendanceResponse {
  status: number;
  message: string;
  data: {
    present: {
      count: number;
      dates: string[];
    };
    absent: {
      count: number;
      dates: string[];
    };
  };
  summary: {
    employee_id: string;
    employee_name: string;
    month: number;
    year: number;
    total_days: number;
    present_days: number;
    absent_days: number;
  };
}

class ApiService {
  private baseURL: string;
  private getAccessToken: (() => Promise<string | null>) | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Set access token getter for authenticated requests
  setAccessTokenGetter(getter: () => Promise<string | null>) {
    this.getAccessToken = getter;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = false
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Add authorization header if required
    if (requireAuth && this.getAccessToken) {
      const token = await this.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      // Extract API endpoint name for better logging
      const endpointName = endpoint.split('?')[0].split('/').pop() || endpoint.split('/').slice(-2).join('/');
      const apiName = endpoint.split('/')[2] || 'unknown'; // e.g., 'login', 'session-info', 'attendance-check'
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📡 API CALL STARTED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔗 Endpoint:', endpoint);
      console.log('📌 API Name:', apiName);
      console.log('🌐 Full URL:', url);
      console.log('📋 Method:', config.method || 'GET');
      console.log('🔐 Requires Auth:', requireAuth ? '✅ Yes' : '❌ No');
      console.log('📦 Headers:', Object.keys(config.headers || {}));
      if (config.body) {
        const bodyPreview = typeof config.body === 'string' 
          ? JSON.parse(config.body) 
          : config.body;
        console.log('📝 Request Body:', {
          ...bodyPreview,
          base64_images: bodyPreview.base64_images ? `[${bodyPreview.base64_images.length} images]` : undefined
        });
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const response = await fetch(url, config);
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📥 API RESPONSE RECEIVED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔗 Endpoint:', endpoint);
      console.log('📌 API Name:', apiName);
      console.log('✅ Status:', response.status, response.statusText);
      
      // Handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('📦 Response Type: JSON');
        console.log('📦 Response Data:', JSON.stringify(data, null, 2).substring(0, 500));
        if (JSON.stringify(data).length > 500) {
          console.log('... (truncated)');
        }
      } else {
        const text = await response.text();
        console.error('❌ Response Type: Non-JSON');
        console.error('❌ Response Text:', text.substring(0, 200));
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        // Backend returns error in different formats:
        // { error: "message" } or { detail: "message" } or { message: "message", data: {...} }
        const errorMessage = data.message || data.error || data.detail || `HTTP ${response.status}: ${response.statusText}`;
        
        // Include full error data in error object for better handling
        const errorWithData = new Error(errorMessage);
        (errorWithData as any).responseData = data;
        (errorWithData as any).status = response.status;
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ API CALL FAILED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('🔗 Endpoint:', endpoint);
        console.error('📌 API Name:', apiName);
        console.error('❌ Error Message:', errorMessage);
        console.error('❌ Full Error Data:', JSON.stringify(data, null, 2));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        throw errorWithData;
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ API CALL SUCCESSFUL');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔗 Endpoint:', endpoint);
      console.log('📌 API Name:', apiName);
      console.log('✅ Status:', response.status);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      return data;
    } catch (error) {
      const endpointName = endpoint.split('?')[0].split('/').pop() || endpoint.split('/').slice(-2).join('/');
      const apiName = endpoint.split('/')[2] || 'unknown';
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ API CALL ERROR');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('🔗 Endpoint:', endpoint);
      console.error('📌 API Name:', apiName);
      
      if (error instanceof Error) {
        // Enhanced error message for network issues
        const isNetworkError = 
          error.message.includes('Network request failed') || 
          error.message.includes('fetch') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError') ||
          error.message.includes('ERR_INTERNET_DISCONNECTED') ||
          error.message.includes('ERR_NETWORK_CHANGED');
          
        if (isNetworkError) {
          console.error('❌ Error Type: Network Error');
          console.error('❌ Error Message:', error.message);
          console.error('💡 Troubleshooting Steps:');
          console.error('   1. Check backend server is running: python manage.py runserver 0.0.0.0:8000');
          console.error('   2. Verify phone and computer are on same WiFi network');
          console.error('   3. Check firewall allows port 8000');
          console.error('   4. Verify IP address is correct:', YOUR_COMPUTER_IP);
          console.error('   5. Test URL in browser: http://' + YOUR_COMPUTER_IP + ':8000' + endpoint);
          console.error('   6. Current API URL:', url);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('');
          
          const detailedError = `Network Error: Cannot connect to server at ${YOUR_COMPUTER_IP}:8000\n\nPlease check:\n1. Backend server is running (python manage.py runserver 0.0.0.0:8000)\n2. Phone and computer are on same WiFi\n3. IP address is correct: ${YOUR_COMPUTER_IP}\n4. Firewall allows port 8000`;
          throw new Error(detailedError);
        }
        console.error('❌ Error Type: Other Error');
        console.error('❌ Error Message:', error.message);
        if (error.stack) {
          console.error('❌ Stack Trace:', error.stack);
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        throw error;
      }
      console.error('❌ Unknown Error:', error);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      throw new Error('Network error occurred. Please check your connection.');
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // Get session info (user profile data)
  async getSessionInfo(): Promise<SessionInfoResponse> {
    console.log('🔍 Calling getSessionInfo API...');
    const response = await this.request<SessionInfoResponse>('/api/session-info', {
      method: 'GET',
    }, true); // Require authentication
    
    console.log('🔍 getSessionInfo response:', {
      success: response.success,
      status: response.status,
      message: response.message,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
      admin_id: response.data?.admin_id,
      organization_id: response.data?.organization_id,
      user_id: response.data?.user_id,
      fullData: response.data
    });
    
    return response;
  }

  // Attendance APIs
  async checkInOut(
    userId: string, 
    base64Images?: string[],
    latitude?: number,
    longitude?: number,
    isCheckIn: boolean = true,
    projectId?: number
  ): Promise<AttendanceCheckResponse> {
    const body: any = {
      marked_by: "mobile"
    };
    if (base64Images && base64Images.length > 0) {
      body.base64_images = base64Images;
    }
    if (latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null) {
      // Round to 6 decimal places to match API validation
      const roundedLat = parseFloat(latitude.toFixed(6));
      const roundedLng = parseFloat(longitude.toFixed(6));
      
      if (isCheckIn) {
        body.check_in_latitude = roundedLat;
        body.check_in_longitude = roundedLng;
      } else {
        body.check_out_latitude = roundedLat;
        body.check_out_longitude = roundedLng;
      }
    }
    // Include project_id if available (only if assigned project exists)
    // Note: projectId can be 0, so we check for undefined and null specifically
    console.log('🔍 API checkInOut - projectId check:', {
      projectId,
      projectIdType: typeof projectId,
      isUndefined: projectId === undefined,
      isNull: projectId === null,
      willInclude: projectId !== undefined && projectId !== null
    });
    
    if (projectId !== undefined && projectId !== null) {
      body.project = projectId;
      console.log('✅ Including project_id in attendance payload:', projectId);
    } else {
      console.log('❌ No project_id available - skipping project field in payload. projectId:', projectId);
    }
    
    console.log('📤 Attendance check-in/out payload:', {
      userId,
      isCheckIn,
      hasProject: !!body.project,
      projectId: body.project,
      hasImages: !!body.base64_images,
      hasLocation: !!(body.check_in_latitude || body.check_out_latitude)
    });
    
    return this.request<AttendanceCheckResponse>(
      `/api/attendance-check/${userId}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      true // Require authentication
    );
  }

  async getAttendanceHistory(
    orgId: string,
    employeeId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<AttendanceHistoryResponse> {
    let url = `/api/employee-history/${orgId}/${employeeId}`;
    const params = new URLSearchParams();
    
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.request<AttendanceHistoryResponse>(
      url,
      { method: 'GET' },
      true // Require authentication
    );
  }

  async getTodayAttendance(userId: string, adminId?: string): Promise<AttendanceHistoryItem | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Use employee-attendance endpoint if adminId is available
      if (adminId) {
        const url = `/api/employee-attendance/${adminId}?date=${today}`;
        const response = await this.request<AttendanceResponse>(
          url,
          { method: 'GET' },
          true
        );
        
        if (response.data && response.data.length > 0) {
          // Find the attendance record for this user
          const userAttendance = response.data.find(item => item.user_id === userId);
          return userAttendance || null;
        }
        return null;
      }
      
      // Fallback to employee-history if orgId is available
      // This would require orgId which we might not have
      return null;
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      return null;
    }
  }

  async getAttendanceByDate(adminId: string, date: string): Promise<AttendanceResponse> {
    const url = `/api/employee-attendance/${adminId}?date=${date}`;
    return this.request<AttendanceResponse>(
      url,
      { method: 'GET' },
      true
    );
  }

  // Get attendance for specific user by site_id and user_id
  async getUserAttendanceByDate(siteId: string, userId: string, date: string): Promise<AttendanceResponse> {
    const url = `/api/employee-attendance/${siteId}/${userId}?date=${date}`;
    console.log('🔍 getUserAttendanceByDate called:', { siteId, userId, date, url });
    const response = await this.request<AttendanceResponse>(
      url,
      { method: 'GET' },
      true
    );
    console.log('🔍 getUserAttendanceByDate response:', {
      hasData: !!response.data,
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
      status: response.status,
      message: response.message
    });
    return response;
  }

  // Get monthly attendance status
  async getMonthlyAttendance(siteId: string, userId: string, month: number, year: number): Promise<MonthlyAttendanceResponse> {
    const url = `/api/employee-monthly-attendance/${siteId}/${userId}/${month}/${year}`;
    console.log('🔍 getMonthlyAttendance called:', { siteId, userId, month, year, url });
    const response = await this.request<MonthlyAttendanceResponse>(
      url,
      { method: 'GET' },
      true
    );
    console.log('🔍 getMonthlyAttendance response:', {
      hasData: !!response.data,
      hasSummary: !!response.summary,
      presentDates: response.data?.present?.dates?.length || 0,
      absentDates: response.data?.absent?.dates?.length || 0,
      status: response.status,
      message: response.message
    });
    return response;
  }

  // Get employee daily info (new API)
  async getEmployeeDailyInfo(adminId: string, userId?: string): Promise<EmployeeDailyInfoResponse> {
    const url = `/api/employee-daily-info/${adminId}`;
    return this.request<EmployeeDailyInfoResponse>(
      url,
      { method: 'GET' },
      true
    );
  }

  // Get holidays
  async getHolidays(siteId: string): Promise<HolidayAPIResponse> {
    const url = `/api/holidays/${siteId}`;
    const response = await this.request<HolidayAPI[] | HolidayAPIResponse>(
      url,
      { method: 'GET' },
      true
    );
    
    // Backend returns array directly (from Django REST framework)
    if (Array.isArray(response)) {
      return { data: response };
    }
    // If wrapped in response object
    return response as HolidayAPIResponse;
  }

  // Get leave types
  async getLeaveTypes(siteId: string): Promise<LeaveTypeAPIResponse> {
    const url = `/api/leave-types/${siteId}`;
    const response = await this.request<LeaveTypeAPI[] | LeaveTypeAPIResponse>(
      url,
      { method: 'GET' },
      true
    );
    
    // Backend returns array directly or wrapped
    if (Array.isArray(response)) {
      return { data: response };
    }
    return response as LeaveTypeAPIResponse;
  }

  // Get leave balances
  async getLeaveBalances(siteId: string, userId: string, year?: number): Promise<LeaveBalanceAPIResponse> {
    let url = `/api/leave-balances/${siteId}/${userId}`;
    if (year) {
      url += `?year=${year}`;
    }
    const response = await this.request<LeaveBalanceAPI[] | LeaveBalanceAPIResponse>(
      url,
      { method: 'GET' },
      true
    );
    
    // Backend returns array directly or wrapped
    if (Array.isArray(response)) {
      return { data: response };
    }
    return response as LeaveBalanceAPIResponse;
  }

  // Apply for leave
  async applyLeave(
    siteId: string,
    userId: string,
    leaveTypeId: number,
    fromDate: string,
    toDate: string,
    reason: string,
    leaveDayType: "full_day" | "first_half" | "second_half" = "full_day"
  ): Promise<LeaveApplicationAPIResponse> {
    const url = `/api/leave-applications/${siteId}/${userId}`;
    const body = {
      leave_type: leaveTypeId,
      from_date: fromDate,
      to_date: toDate,
      reason: reason,
      leave_day_type: leaveDayType,
    };
    
    return this.request<LeaveApplicationAPIResponse>(
      url,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      true
    );
  }

  // Get leave applications list
  async getLeaveApplications(
    siteId: string,
    userId: string,
    year?: number
  ): Promise<LeaveApplicationsListAPIResponse> {
    let url = `/api/leave-applications/${siteId}/${userId}`;
    if (year) {
      url += `?year=${year}`;
    }
    return this.request<LeaveApplicationsListAPIResponse>(
      url,
      { method: 'GET' },
      true
    );
  }

  // Get employee tasks
  async getMyTasks(
    siteId: string,
    userId: string,
    status?: 'pending' | 'in-progress' | 'completed'
  ): Promise<TaskListAPIResponse> {
    let url = `/api/task/employee/my-tasks/${siteId}/${userId}`;
    if (status) {
      // Convert app format (in-progress) to API format (in_progress)
      const apiStatus = status === 'in-progress' ? 'in_progress' : status;
      url += `?status=${apiStatus}`;
    }
    return this.request<TaskListAPIResponse>(
      url,
      { method: 'GET' },
      true
    );
  }

  // Update task status (accept/complete)
  async updateTaskStatus(
    siteId: string,
    taskId: number,
    status: 'pending' | 'in-progress' | 'completed',
    comment?: string
  ): Promise<TaskUpdateAPIResponse> {
    const url = `/api/task/employee/update-task-status/${siteId}/${taskId}`;
    // Convert app format (in-progress) to API format (in_progress)
    const apiStatus = status === 'in-progress' ? 'in_progress' : status;
    const body: { status: string; comment?: string } = {
      status: apiStatus,
    };
    if (comment) {
      body.comment = comment;
    }
    console.log('📤 Updating task status:', { taskId, status: apiStatus, comment: comment || 'none' });
    return this.request<TaskUpdateAPIResponse>(
      url,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      },
      true
    );
  }

  // ==================== PRODUCTION MANAGEMENT APIs ====================

  // Work Orders
  async getMyWorkOrders(
    adminId: string,
    userId: string,
    params?: {
      status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      date_from?: string;
      date_to?: string;
      search?: string;
    }
  ): Promise<ProductionListAPIResponse<WorkOrderAPI>> {
    let url = `/api/production/work-orders/${adminId}/user/${userId}`;
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.search) queryParams.append('search', params.search);
    const queryString = queryParams.toString();
    if (queryString) url += `?${queryString}`;
    return this.request<ProductionListAPIResponse<WorkOrderAPI>>(
      url,
      { method: 'GET' },
      true
    );
  }

  async getWorkOrder(
    adminId: string,
    userId: string,
    workOrderId: string
  ): Promise<ProductionItemAPIResponse<WorkOrderAPI>> {
    const url = `/api/production/work-orders/${adminId}/user/${userId}/${workOrderId}`;
    return this.request<ProductionItemAPIResponse<WorkOrderAPI>>(
      url,
      { method: 'GET' },
      true
    );
  }

  async updateWorkOrderStatus(
    adminId: string,
    userId: string,
    workOrderId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  ): Promise<ProductionItemAPIResponse<WorkOrderAPI>> {
    const url = `/api/production/work-orders/${adminId}/user/${userId}/${workOrderId}`;
    return this.request<ProductionItemAPIResponse<WorkOrderAPI>>(
      url,
      {
        method: 'PUT',
        body: JSON.stringify({ status }),
      },
      true
    );
  }

  // Production Entries
  async getMyProductionEntries(
    adminId: string,
    userId: string,
    params?: {
      work_order?: string;
      machine?: string;
      status?: 'draft' | 'submitted' | 'approved' | 'rejected';
      shift?: 'Morning' | 'Evening' | 'Night';
      date_from?: string;
      date_to?: string;
    }
  ): Promise<ProductionListAPIResponse<ProductionEntryAPI>> {
    let url = `/api/production/production-entries/${adminId}/user/${userId}`;
    const queryParams = new URLSearchParams();
    if (params?.work_order) queryParams.append('work_order', params.work_order);
    if (params?.machine) queryParams.append('machine', params.machine);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.shift) queryParams.append('shift', params.shift);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    const queryString = queryParams.toString();
    if (queryString) url += `?${queryString}`;
    return this.request<ProductionListAPIResponse<ProductionEntryAPI>>(
      url,
      { method: 'GET' },
      true
    );
  }

  async createProductionEntry(
    adminId: string,
    userId: string,
    data: {
      work_order: string;
      machine: string;
      start_time: string;
      end_time: string;
      good_qty: number;
      scrap_qty: number;
      status?: 'draft' | 'submitted';
      shift?: 'Morning' | 'Evening' | 'Night';
      downtime_minutes?: number;
      quality_score?: number;
      remarks?: string;
    }
  ): Promise<ProductionItemAPIResponse<ProductionEntryAPI>> {
    const url = `/api/production/production-entries/${adminId}/user/${userId}`;
    return this.request<ProductionItemAPIResponse<ProductionEntryAPI>>(
      url,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      true
    );
  }

  async getProductionEntry(
    adminId: string,
    userId: string,
    entryId: string
  ): Promise<ProductionItemAPIResponse<ProductionEntryAPI>> {
    const url = `/api/production/production-entries/${adminId}/user/${userId}/${entryId}`;
    return this.request<ProductionItemAPIResponse<ProductionEntryAPI>>(
      url,
      { method: 'GET' },
      true
    );
  }

  async updateProductionEntry(
    adminId: string,
    userId: string,
    entryId: string,
    data: {
      good_qty?: number;
      scrap_qty?: number;
      status?: 'draft' | 'submitted';
      shift?: 'Morning' | 'Evening' | 'Night';
      downtime_minutes?: number;
      quality_score?: number;
      remarks?: string;
    }
  ): Promise<ProductionItemAPIResponse<ProductionEntryAPI>> {
    const url = `/api/production/production-entries/${adminId}/user/${userId}/${entryId}`;
    return this.request<ProductionItemAPIResponse<ProductionEntryAPI>>(
      url,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      true
    );
  }

  async deleteProductionEntry(
    adminId: string,
    userId: string,
    entryId: string
  ): Promise<{ status: number; message: string }> {
    const url = `/api/production/production-entries/${adminId}/user/${userId}/${entryId}`;
    return this.request<{ status: number; message: string }>(
      url,
      { method: 'DELETE' },
      true
    );
  }

  // Material Requisitions
  async getMyMaterialRequisitions(
    adminId: string,
    userId: string,
    params?: {
      status?: 'pending' | 'approved' | 'rejected' | 'issued';
      date_from?: string;
      date_to?: string;
    }
  ): Promise<ProductionListAPIResponse<MaterialRequisitionAPI>> {
    let url = `/api/production/material-requisitions/${adminId}/user/${userId}`;
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    const queryString = queryParams.toString();
    if (queryString) url += `?${queryString}`;
    return this.request<ProductionListAPIResponse<MaterialRequisitionAPI>>(
      url,
      { method: 'GET' },
      true
    );
  }

  async createMaterialRequisition(
    adminId: string,
    userId: string,
    data: {
      requisition_number: string;
      requisition_date: string;
      department?: string;
      status?: 'pending';
      items: Array<{
        raw_material: string;
        requested_qty: number;
        unit?: string;
        remarks?: string;
      }>;
      remarks?: string;
    }
  ): Promise<ProductionItemAPIResponse<MaterialRequisitionAPI>> {
    const url = `/api/production/material-requisitions/${adminId}/user/${userId}`;
    return this.request<ProductionItemAPIResponse<MaterialRequisitionAPI>>(
      url,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      true
    );
  }

  // Material Returns
  async getMyMaterialReturns(
    adminId: string,
    userId: string,
    params?: {
      date_from?: string;
      date_to?: string;
    }
  ): Promise<ProductionListAPIResponse<MaterialReturnAPI>> {
    let url = `/api/production/material-returns/${adminId}/user/${userId}`;
    const queryParams = new URLSearchParams();
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    const queryString = queryParams.toString();
    if (queryString) url += `?${queryString}`;
    return this.request<ProductionListAPIResponse<MaterialReturnAPI>>(
      url,
      { method: 'GET' },
      true
    );
  }

  async createMaterialReturn(
    adminId: string,
    userId: string,
    data: {
      return_number: string;
      return_date: string;
      reason: string;
      items: Array<{
        raw_material: string;
        returned_qty: number;
        remarks?: string;
      }>;
      remarks?: string;
    }
  ): Promise<ProductionItemAPIResponse<MaterialReturnAPI>> {
    const url = `/api/production/material-returns/${adminId}/user/${userId}`;
    return this.request<ProductionItemAPIResponse<MaterialReturnAPI>>(
      url,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      true
    );
  }

  // Scrap Entries
  async getMyScrapEntries(
    adminId: string,
    userId: string,
    params?: {
      date_from?: string;
      date_to?: string;
      reason?: string;
    }
  ): Promise<ProductionListAPIResponse<ScrapEntryAPI>> {
    let url = `/api/production/scrap-entries/${adminId}/user/${userId}`;
    const queryParams = new URLSearchParams();
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.reason) queryParams.append('reason', params.reason);
    const queryString = queryParams.toString();
    if (queryString) url += `?${queryString}`;
    return this.request<ProductionListAPIResponse<ScrapEntryAPI>>(
      url,
      { method: 'GET' },
      true
    );
  }

  async createScrapEntry(
    adminId: string,
    userId: string,
    data: {
      product: string;
      machine: string;
      scrap_date: string;
      qty: number;
      reason: 'defect' | 'damage' | 'quality_issue' | 'material_issue' | 'machine_issue' | 'operator_error' | 'other';
      reason_description?: string;
      scrap_category?: string;
      disposal_method?: string;
      cost_impact?: number;
      corrective_action?: string;
    }
  ): Promise<ProductionItemAPIResponse<ScrapEntryAPI>> {
    const url = `/api/production/scrap-entries/${adminId}/user/${userId}`;
    return this.request<ProductionItemAPIResponse<ScrapEntryAPI>>(
      url,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      true
    );
  }

  async updateScrapEntry(
    adminId: string,
    userId: string,
    scrapId: string,
    data: Partial<{
      qty: number;
      reason: string;
      reason_description: string;
      scrap_category: string;
      disposal_method: string;
      cost_impact: number;
      corrective_action: string;
    }>
  ): Promise<ProductionItemAPIResponse<ScrapEntryAPI>> {
    const url = `/api/production/scrap-entries/${adminId}/user/${userId}/${scrapId}`;
    return this.request<ProductionItemAPIResponse<ScrapEntryAPI>>(
      url,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      true
    );
  }

  async deleteScrapEntry(
    adminId: string,
    userId: string,
    scrapId: string
  ): Promise<{ status: number; message: string }> {
    const url = `/api/production/scrap-entries/${adminId}/user/${userId}/${scrapId}`;
    return this.request<{ status: number; message: string }>(
      url,
      { method: 'DELETE' },
      true
    );
  }

  // Machine Downtime
  async getMyMachineDowntimes(
    adminId: string,
    userId: string,
    params?: {
      machine?: string;
      date_from?: string;
      date_to?: string;
    }
  ): Promise<ProductionListAPIResponse<MachineDowntimeAPI>> {
    let url = `/api/production/machine-downtimes/${adminId}/user/${userId}`;
    const queryParams = new URLSearchParams();
    if (params?.machine) queryParams.append('machine', params.machine);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    const queryString = queryParams.toString();
    if (queryString) url += `?${queryString}`;
    return this.request<ProductionListAPIResponse<MachineDowntimeAPI>>(
      url,
      { method: 'GET' },
      true
    );
  }

  async createMachineDowntime(
    adminId: string,
    userId: string,
    data: {
      machine: string;
      start_time: string;
      end_time: string;
      downtime_reason: string;
      impact_on_production?: string;
    }
  ): Promise<ProductionItemAPIResponse<MachineDowntimeAPI>> {
    const url = `/api/production/machine-downtimes/${adminId}/user/${userId}`;
    // Backend expects "reason" field, not "downtime_reason"
    const requestData = {
      machine: data.machine,
      start_time: data.start_time,
      end_time: data.end_time,
      reason: data.downtime_reason, // Map downtime_reason to reason
      impact_on_production: data.impact_on_production,
    };
    return this.request<ProductionItemAPIResponse<MachineDowntimeAPI>>(
      url,
      {
        method: 'POST',
        body: JSON.stringify(requestData),
      },
      true
    );
  }

  async updateMachineDowntime(
    adminId: string,
    userId: string,
    downtimeId: string,
    data: {
      start_time?: string;
      end_time?: string;
      downtime_reason?: string;
      impact_on_production?: string;
    }
  ): Promise<ProductionItemAPIResponse<MachineDowntimeAPI>> {
    const url = `/api/production/machine-downtimes/${adminId}/user/${userId}/${downtimeId}`;
    // Backend expects "reason" field, not "downtime_reason"
    const requestData: any = {
      start_time: data.start_time,
      end_time: data.end_time,
      impact_on_production: data.impact_on_production,
    };
    if (data.downtime_reason) {
      requestData.reason = data.downtime_reason; // Map downtime_reason to reason
    }
    return this.request<ProductionItemAPIResponse<MachineDowntimeAPI>>(
      url,
      {
        method: 'PUT',
        body: JSON.stringify(requestData),
      },
      true
    );
  }

  // Read-only endpoints
  async getMachines(
    adminId: string,
    params?: {
      status?: string;
    }
  ): Promise<ProductionListAPIResponse<MachineAPI>> {
    let url = `/api/production/machines/${adminId}`;
    if (params?.status) {
      url += `?status=${params.status}`;
    }
    return this.request<ProductionListAPIResponse<MachineAPI>>(
      url,
      { method: 'GET' },
      true
    );
  }

  // Get user assigned machines
  async getUserAssignedMachines(
    adminId: string,
    userId: string
  ): Promise<ProductionListAPIResponse<MachineAPI>> {
    const url = `/api/production/machines/${adminId}/user/${userId}`;
    return this.request<ProductionListAPIResponse<MachineAPI>>(
      url,
      { method: 'GET' },
      true
    );
  }

  async getProducts(
    adminId: string
  ): Promise<ProductionListAPIResponse<ProductAPI>> {
    const url = `/api/production/products/${adminId}`;
    return this.request<ProductionListAPIResponse<ProductAPI>>(
      url,
      { method: 'GET' },
      true
    );
  }

  async getRawMaterials(
    adminId: string
  ): Promise<ProductionListAPIResponse<RawMaterialAPI>> {
    const url = `/api/production/raw-materials/${adminId}`;
    return this.request<ProductionListAPIResponse<RawMaterialAPI>>(
      url,
      { method: 'GET' },
      true
    );
  }

  // Get organization settings/flags
  async getOrganizationSettings(organizationId: string): Promise<OrganizationSettingsResponse> {
    const url = `/api/organization-settings/${organizationId}`;
    console.log('🔍 Fetching organization settings for organizationId:', organizationId);
    const response = await this.request<OrganizationSettingsResponse>(
      url,
      { method: 'GET' },
      true
    );
    console.log('🔍 Organization settings response:', response);
    return response;
  }

  // Is Photo Updated Toggle API
  async toggleIsPhotoUpdated(userId: string): Promise<{ status: number; message: string; data?: any }> {
    const url = `/api/is-photo-updated/${userId}`;
    console.log('🔍 Toggling is_photo_updated for userId:', userId);
    const response = await this.request<{ status: number; message: string; data?: any }>(
      url,
      { method: 'POST' },
      true
    );
    console.log('🔍 Is photo updated toggle response:', response);
    return response;
  }

  // Employee Profile Photo Upload API
  async uploadProfilePhoto(
    userId: string,
    base64Image: string
  ): Promise<{ status: number; message: string; data?: { profile_photo?: string; is_photo_updated?: boolean } }> {
    const url = `/api/employee/profile-photo-upload/${userId}`;
    console.log('📤 Uploading profile photo for userId:', userId);
    
    // Backend expects base64_image field (not profile_photo)
    const body = {
      base64_image: base64Image,
    };
    
    const response = await this.request<{ status: number; message: string; data?: { profile_photo?: string; is_photo_updated?: boolean } }>(
      url,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      true
    );
    console.log('📤 Profile photo upload response:', response);
    return response;
  }

  // ==================== EXPENSE APIs ====================

  // Get Expense Categories
  async getExpenseCategories(siteId: string): Promise<{ status: number; message: string; data?: ExpenseCategoryAPI[] }> {
    const url = `/api/expense-categories/${siteId}`;
    console.log('🔍 Fetching expense categories for siteId:', siteId);
    const response = await this.request<{ status: number; message: string; data?: ExpenseCategoryAPI[] }>(
      url,
      { method: 'GET' },
      true
    );
    console.log('🔍 Expense categories response:', response);
    return response;
  }

  // Get Expense Projects
  async getExpenseProjects(siteId: string): Promise<{ status: number; message: string; data?: ExpenseProjectAPI[] }> {
    const url = `/api/expense-projects/${siteId}`;
    console.log('🔍 Fetching expense projects for siteId:', siteId);
    const response = await this.request<{ status: number; message: string; data?: ExpenseProjectAPI[] }>(
      url,
      { method: 'GET' },
      true
    );
    console.log('🔍 Expense projects response:', response);
    return response;
  }

  // Create Expense
  async createExpense(
    siteId: string,
    userId: string,
    expenseData: {
      category: number;
      project: number;
      title: string;
      expense_date: string;
      amount: number;
      description?: string;
    }
  ): Promise<{ status: number; message: string; data?: any }> {
    const url = `/api/expenses/${siteId}/${userId}`;
    console.log('📤 Creating expense for userId:', userId);
    const response = await this.request<{ status: number; message: string; data?: any }>(
      url,
      {
        method: 'POST',
        body: JSON.stringify(expenseData),
      },
      true
    );
    console.log('📤 Create expense response:', response);
    return response;
  }

  // Get Expenses List
  async getExpenses(
    siteId: string,
    userId: string
  ): Promise<{ status: number; message: string; data?: ExpenseAPI[] }> {
    const url = `/api/expenses/${siteId}/${userId}`;
    console.log('🔍 Fetching expenses for userId:', userId);
    const response = await this.request<{ status: number; message: string; data?: ExpenseAPI[] }>(
      url,
      { method: 'GET' },
      true
    );
    console.log('🔍 Expenses list response:', response);
    return response;
  }

  // ==================== VISIT APIs ====================

  // Get Visits List
  async getVisits(
    siteId: string,
    userId: string
  ): Promise<{ status: number; message: string; data?: VisitListResponse }> {
    const url = `/api/visit/visit-list-create-by-user/${siteId}/${userId}`;
    console.log('🔍 Fetching visits for userId:', userId);
    const response = await this.request<{ status: number; message: string; data?: VisitListResponse }>(
      url,
      { method: 'GET' },
      true
    );
    console.log('🔍 Visits list response:', response);
    return response;
  }

  // Create Visit
  async createVisit(
    siteId: string,
    userId: string,
    visitData: {
      title: string;
      description?: string;
      schedule_date: string;
      schedule_time: string;
      client_name: string;
      location_name?: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
      country: string;
      contact_person: string;
      contact_phone: string;
      contact_email?: string;
    }
  ): Promise<{ status: number; message: string; data?: VisitAPI }> {
    const url = `/api/visit/visit-list-create-by-user/${siteId}/${userId}`;
    console.log('📤 Creating visit for userId:', userId);
    const response = await this.request<{ status: number; message: string; data?: VisitAPI }>(
      url,
      {
        method: 'POST',
        body: JSON.stringify(visitData),
      },
      true
    );
    console.log('📤 Create visit response:', response);
    return response;
  }

  // Visit Check-In
  async visitCheckIn(
    siteId: string,
    userId: string,
    visitId: number,
    checkInData: {
      latitude: number;
      longitude: number;
      note?: string;
    }
  ): Promise<{ status: number; message: string; data?: any }> {
    const url = `/api/visit/visit-check-in/${siteId}/${userId}/${visitId}`;
    console.log('📍 Visit check-in for visitId:', visitId);
    const response = await this.request<{ status: number; message: string; data?: any }>(
      url,
      {
        method: 'POST',
        body: JSON.stringify(checkInData),
      },
      true
    );
    console.log('📍 Visit check-in response:', response);
    return response;
  }

  // Visit Check-Out
  async visitCheckOut(
    siteId: string,
    userId: string,
    visitId: number,
    checkOutData: {
      latitude: number;
      longitude: number;
      note?: string;
    }
  ): Promise<{ status: number; message: string; data?: any }> {
    const url = `/api/visit/visit-check-out/${siteId}/${userId}/${visitId}`;
    console.log('📍 Visit check-out for visitId:', visitId);
    const response = await this.request<{ status: number; message: string; data?: any }>(
      url,
      {
        method: 'POST',
        body: JSON.stringify(checkOutData),
      },
      true
    );
    console.log('📍 Visit check-out response:', response);
    return response;
  }
}

// ==================== EXPENSE TYPES ====================

export interface ExpenseCategoryAPI {
  id: number;
  name: string;
  admin?: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseProjectAPI {
  id: number;
  name: string;
  admin?: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseAPI {
  id: string;
  employee_name?: string;
  employee_email?: string;
  category_name?: string;
  project_name?: string;
  approved_by_name?: string | null;
  approved_by_email?: string | null;
  rejected_by_name?: string | null;
  rejected_by_email?: string | null;
  title: string;
  description?: string | null;
  expense_date: string;
  amount: string;
  currency?: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  rejected_at?: string | null;
  reimbursement_amount?: string | null;
  reimbursement_date?: string | null;
  reimbursement_mode?: string | null;
  reimbursement_reference?: string | null;
  receipts?: any[];
  supporting_documents?: any[];
  remarks?: string | null;
  created_at?: string;
  updated_at?: string;
  admin?: string;
  employee?: string;
  category: number;
  project: number;
  approved_by?: string | null;
  rejected_by?: string | null;
  created_by?: string | null;
}

// ==================== VISIT TYPES ====================

export interface VisitAPI {
  id: number;
  assigned_employee_email?: string;
  assigned_employee_name?: string;
  created_by_email?: string;
  created_by_name?: string;
  title: string;
  description?: string | null;
  schedule_date: string;
  schedule_time: string;
  client_name: string;
  location_name?: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  contact_person: string;
  contact_phone: string;
  contact_email?: string | null;
  status?: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  check_in_timestamp?: string | null;
  check_out_timestamp?: string | null;
  check_in_latitude?: number | null;
  check_in_longitude?: number | null;
  check_out_latitude?: number | null;
  check_out_longitude?: number | null;
  check_in_note?: string | null;
  check_out_note?: string | null;
  created_at?: string;
  updated_at?: string;
  admin?: string;
  assigned_employee?: string;
  created_by?: string;
}

export interface VisitListResponse {
  results: VisitAPI[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface LeaveTypeAPIResponse {
  status?: number;
  message?: string;
  data?: LeaveTypeAPI[];
}

export interface LeaveTypeAPI {
  id: number;
  admin: string;
  name: string;
  code: string;
  description?: string;
  default_count: number;
  is_paid: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  admin_email?: string;
}

export interface LeaveApplicationAPIResponse {
  status: number;
  message: string;
  data?: LeaveApplicationAPI;
}

export interface LeaveApplicationsListAPIResponse {
  status?: number;
  message?: string;
  data?: LeaveApplicationAPI[];
}

export interface LeaveApplicationAPI {
  id: number;
  admin: string;
  organization: string;
  user: string;
  leave_type: number;
  from_date: string;
  to_date: string;
  total_days: number;
  reason: string;
  leave_day_type?: 'full_day' | 'first_half' | 'second_half';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  applied_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  comments?: string | null;
  user_email?: string;
  user_name?: string;
  leave_type_name?: string;
  leave_type_code?: string;
  reviewed_by_email?: string | null;
}

export interface LeaveBalanceAPIResponse {
  status?: number;
  message?: string;
  data?: LeaveBalanceAPI[];
}

export interface LeaveBalanceAPI {
  id: number;
  user: string;
  leave_type: number;
  year: number;
  assigned: number;
  used: number;
  balance: number;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
  leave_type_name?: string;
  leave_type_code?: string;
}

// Task API Interfaces
export interface TaskAPI {
  id: number;
  assigned_to_email: string;
  assigned_to_name: string;
  assigned_by_email: string;
  task_type_name: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in-progress" | "in_progress" | "completed";
  start_date: string | null;
  due_date: string | null;
  start_time: string | null;
  end_time: string | null;
  actual_hours: number | null;
  completed_at: string | null;
  schedule_frequency?: string;
  week_day?: number | null;
  month_date?: number | null;
  schedule_end_date?: string;
  is_scheduled_instance?: boolean;
  is_recurring?: boolean;
  recurrence_frequency?: string | null;
  recurrence_end_date?: string | null;
  tags?: string[];
  attachments?: any[];
  progress_percentage?: string;
  checklist?: any[];
  comments?: any[];
  created_at: string;
  updated_at: string;
  admin: string;
  task_type: number;
  assigned_to: string;
  assigned_by: string;
  parent_task?: number | null;
  dependencies?: any[];
}

export interface TaskListAPIResponse {
  status: number;
  message: string;
  data?: TaskAPI[];
}

export interface TaskUpdateAPIResponse {
  status: number;
  message: string;
  data?: TaskAPI;
}

// ==================== PRODUCTION MANAGEMENT TYPES ====================

export interface WorkOrderAPI {
  id: string;
  code: string;
  product_name: string;
  target_qty: string;
  completed_qty: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  start_date: string | null;
  due_date: string | null;
  completion_percentage: number;
  assigned_to_name: string;
}

export interface ProductionEntryAPI {
  id: string;
  work_order_code: string;
  machine_name: string;
  start_time: string;
  end_time: string;
  good_qty: string;
  scrap_qty: string;
  efficiency: number;
  downtime_minutes: number | null;
  status: "draft" | "submitted" | "approved" | "rejected";
  shift: "Morning" | "Evening" | "Night" | null;
}

export interface MaterialRequisitionAPI {
  id: string;
  requisition_number: string;
  requisition_date: string;
  department: string;
  status: "pending" | "approved" | "rejected" | "issued";
  total_items: number;
  requested_by_name: string;
}

export interface MaterialReturnAPI {
  id: string;
  return_number: string;
  return_date: string;
  material_name: string;
  return_qty: string;
  return_reason: string;
  returned_by_name: string;
}

export interface ScrapEntryAPI {
  id: string;
  product_name: string;
  machine_name: string;
  scrap_date: string;
  qty: string;
  reason: string;
  reason_description: string | null;
  scrap_cost: number | null;
}

export interface MachineDowntimeAPI {
  id: string;
  machine_name: string;
  start_time: string;
  end_time: string;
  downtime_minutes: number;
  downtime_reason: string;
  impact_on_production: string | null;
  reported_by_name: string;
}

export interface MachineAPI {
  id: string;
  name: string;
  code: string;
  status: string;
}

export interface ProductAPI {
  id: string;
  name: string;
  code: string;
}

export interface RawMaterialAPI {
  id: string;
  name: string;
  code: string;
  stock_level: string;
  unit: string;
}

export interface ProductionListAPIResponse<T> {
  status: number;
  message: string;
  data?: T[];
}

export interface ProductionItemAPIResponse<T> {
  status: number;
  message: string;
  data?: T;
}

// Organization Settings API Interfaces
export interface OrganizationSettingsResponse {
  status: number;
  message?: string;
  data?: OrganizationSettings;
}

export interface OrganizationSettings {
  id: number;
  organization: string;
  organization_logo_url?: string | null;
  organization_logo?: string | null;
  face_recognition_enabled: boolean;
  auto_checkout_enabled: boolean;
  auto_checkout_time?: string | null;
  auto_shiftwise_checkout_enabled: boolean;
  auto_shiftwise_checkout_in_minutes: number;
  late_punch_enabled: boolean;
  late_punch_grace_minutes?: number | null;
  early_exit_enabled: boolean;
  early_exit_grace_minutes?: number | null;
  auto_shift_assignment_enabled: boolean;
  compensatory_off_enabled: boolean;
  custom_week_off_enabled: boolean;
  location_tracking_enabled: boolean;
  manual_attendance_enabled: boolean;
  expense_module_enabled: boolean;
  chat_module_enabled: boolean;
  group_location_tracking_enabled: boolean;
  meeting_module_enabled: boolean;
  business_intelligence_reports_enabled: boolean;
  payroll_module_enabled: boolean;
  location_marking_enabled: boolean;
  sandwich_leave_enabled: boolean;
  leave_carry_forward_enabled: boolean;
  min_hours_for_half_day?: number | null;
  multiple_shift_enabled: boolean;
  email_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  ip_restriction_enabled: boolean;
  allowed_ip_ranges?: string | null;
  geofencing_enabled: boolean;
  geofence_radius_in_meters?: number | null;
  device_binding_enabled: boolean;
  plan_name?: string | null;
  plan_assigned_date?: string | null;
  plan_expiry_date?: string | null;
  leave_year_type: string;
  leave_year_start_month: number;
  enabled_menu_items: {
    attendance?: boolean;
    application?: boolean; // Leave
    allEmployees?: boolean;
    deactivatedEmployees?: boolean;
    employeeLeaves?: boolean;
    crm?: boolean;
    contact?: boolean;
    visit?: boolean;
    "visit-map"?: boolean;
    tasks?: boolean;
    "schedule-task"?: boolean;
    expense?: boolean;
    invoice?: boolean;
    payroll?: boolean;
    "employee-advance"?: boolean;
    "salary-structure"?: boolean;
    "run-payroll"?: boolean;
    "payslip-generator"?: boolean;
    "payroll-settings"?: boolean;
    "asset-management"?: boolean;
    "production-management"?: boolean;
    "holiday-calendar"?: boolean;
    "shift-management"?: boolean;
    locations?: boolean;
    "week-offs"?: boolean;
    "leave-types"?: boolean;
    [key: string]: boolean | undefined;
  };
  created_at: string;
  updated_at: string;
}

export const apiService = new ApiService(API_BASE_URL);

