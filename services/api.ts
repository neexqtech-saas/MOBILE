// Backend URL — sirf MOBILE/.env → constants/backend.ts
import { Platform } from "react-native";
import Constants from "expo-constants";

import { resolveBackendUrl } from "@/constants/backend";
import { countryNameFromIsoCode } from "@/utils/punchLocationTime";
import {
  compressImageForUpload,
  compressImagesForUpload,
  stripDataUriPrefix,
} from "@/utils/compressImage";

export const BACKEND_URL = resolveBackendUrl();

if (__DEV__) {
  console.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.warn("🚀 API BACKEND:", BACKEND_URL);
  console.warn("📱 Device:", Constants.isDevice ? "physical" : "simulator/emulator");
  console.warn("📡 Metro hostUri:", Constants.expoConfig?.hostUri ?? "n/a");
  console.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

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
    admin_id?: string; // For user role — scoped API paths use this UUID
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
  check_in_latitude?: number | null;
  check_in_longitude?: number | null;
  check_out_latitude?: number | null;
  check_out_longitude?: number | null;
  check_in_location?: string | null;
  check_out_location?: string | null;
  check_in_country?: string | null;
  check_in_country_code?: string | null;
  check_out_country?: string | null;
  check_out_country_code?: string | null;
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
  check_in_latitude?: number | null;
  check_in_longitude?: number | null;
  check_out_latitude?: number | null;
  check_out_longitude?: number | null;
  check_in_location?: string | null;
  check_out_location?: string | null;
  check_in_country?: string | null;
  check_in_country_code?: string | null;
  check_out_country?: string | null;
  check_out_country_code?: string | null;
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

/** Sent with attendance punch — lat/lng in body + country + human-readable location text for DB */
export type PunchCountryMeta = {
  country?: string | null;
  countryCode?: string | null;
  /** Saved as check_in_location / check_out_location (reverse-geocoded or GPS fallback) */
  location?: string | null;
};

/** Server reverse-geocode (Nominatim via backend) — fills country when device geocode fails */
export interface ReverseGeocodeData {
  country?: string | null;
  country_code?: string | null;
  display_name?: string | null;
}

export interface ReverseGeocodeResponse {
  status: number;
  message: string;
  data?: ReverseGeocodeData | null;
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
    /** Present dates mapped to 3S work type (piece_rate | subsidy) */
    three_s_by_date?: Record<string, string>;
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

export interface AttachmentBreadcrumb {
  id: number;
  name: string;
}

export interface AttachmentFolderItem {
  id: number;
  name: string;
  parent_id: number | null;
  child_folder_count: number;
  file_count: number;
  created_by_name?: string;
  created_at?: string;
}

export interface AttachmentFileItem {
  id: number;
  folder_id: number | null;
  file_url: string | null;
  original_name: string;
  file_size: number;
  mime_type: string;
  file_kind: string;
  notes?: string;
  uploaded_by_name?: string;
  created_at: string;
}

export interface AttachmentBrowseData {
  folder_id: number | null;
  breadcrumbs: AttachmentBreadcrumb[];
  folders: AttachmentFolderItem[];
  files: AttachmentFileItem[];
  stats: { folder_count: number; file_count: number };
}

export type AttachmentUploadInput = {
  uri: string;
  name: string;
  type: string;
};

export interface InventoryMaterialAssignment {
  id: string;
  employeeName?: string;
  item: string;
  quantity: number;
  unit: string;
  site: string;
  assignedDate: string;
  isReceived?: boolean;
  receivedAt?: string | null;
  receiveRemark?: string;
}

export interface NotificationHistoryItem {
  id: string;
  user: string;
  title: string;
  body: string;
  notification_type: string | null;
  data: any;
  is_read: boolean;
  created_at: string;
}

export interface NotificationHistoryResponse {
  count: number;
  total_pages: number;
  current_page_number: number;
  page_size: number;
  total_objects: number;
  results: NotificationHistoryItem[];
  next: string | null;
  previous: string | null;
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
        if (response.status === 413 || text.includes("413")) {
          throw new Error(
            "Photo is too large for the server. Please capture again — the app will compress the image automatically."
          );
        }
        throw new Error(
          response.status >= 500
            ? `Server error (${response.status}). Please try again later.`
            : `Request failed (${response.status}). Please try again.`
        );
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
          console.error('   1. Backend chal raha hai? (manage.py runserver)');
          console.error('   2. Phone aur PC same WiFi par hain?');
          console.error('   3. MOBILE/.env mein sahi EXPO_PUBLIC_BACKEND_URL uncomment hai?');
          console.error('   4. Test URL:', BACKEND_URL + endpoint);
          console.error('   5. Request URL:', url);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('');

          const detailedError = `Network Error: Cannot connect to ${BACKEND_URL}\n\nCheck MOBILE/.env — sirf ek EXPO_PUBLIC_BACKEND_URL uncomment ho, phir: npx expo start -c`;
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

  private async requestMultipart<T>(
    endpoint: string,
    formData: FormData,
    method: string = "POST"
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {};
    if (this.getAccessToken) {
      const token = await this.getAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    const response = await fetch(url, { method, headers, body: formData });
    const contentType = response.headers.get("content-type");
    let data: T;
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
    }
    if (!response.ok) {
      if (response.status === 413) {
        throw new Error(
          "Photo is too large for the server. Please capture again — the app will compress automatically."
        );
      }
      const errMsg =
        (data as { message?: string }).message ||
        `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errMsg);
    }
    return data;
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

  /** GET lat,lng → country + display_name (authenticated; server calls Nominatim). */
  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResponse> {
    const q = `lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`;
    return this.request<ReverseGeocodeResponse>(`/api/reverse-geocode/?${q}`, { method: "GET" }, true);
  }

  // Attendance APIs
  async checkInOut(
    userId: string,
    base64Images?: string[],
    latitude?: number,
    longitude?: number,
    isCheckIn: boolean = true,
    projectId?: number,
    countryMeta?: PunchCountryMeta | null,
    threeSData?: {
      workType: "piece_rate" | "subsidy";
      liftInstallationNumber: string;
      liftImage: string;
      selfieImage: string;
    } | null
  ): Promise<AttendanceCheckResponse> {
    const body: any = {
      marked_by: "mobile"
    };
    // Standard check-in does not store base64_images on server — omit to avoid nginx 413
    if (isCheckIn && threeSData) {
      body.three_s_work_type = threeSData.workType;
      body.three_s_lift_installation_number = threeSData.liftInstallationNumber;
      body.three_s_lift_image = await compressImageForUpload(threeSData.liftImage);
      body.three_s_selfie_image = await compressImageForUpload(threeSData.selfieImage);
    }

    let merged: PunchCountryMeta | null = countryMeta ? { ...countryMeta } : null;
    let roundedLat: number | undefined;
    let roundedLng: number | undefined;

    if (latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null) {
      // Round to 6 decimal places to match API validation
      roundedLat = parseFloat(latitude.toFixed(6));
      roundedLng = parseFloat(longitude.toFixed(6));

      if (isCheckIn) {
        body.check_in_latitude = roundedLat;
        body.check_in_longitude = roundedLng;
      } else {
        body.check_out_latitude = roundedLat;
        body.check_out_longitude = roundedLng;
      }

      const hasCountry = !!(merged?.country?.trim() || merged?.countryCode?.trim());
      if (!hasCountry) {
        try {
          const rg = await this.reverseGeocode(roundedLat, roundedLng);
          const d = rg.data;
          if (d && (d.country || d.country_code || d.display_name?.trim())) {
            const codeRaw = d.country_code;
            const code =
              typeof codeRaw === "string" && codeRaw.trim()
                ? String(codeRaw).toUpperCase().slice(0, 3)
                : undefined;
            const nameRaw = d.country;
            const nameFromApi =
              typeof nameRaw === "string" && nameRaw.trim() ? String(nameRaw).trim().slice(0, 120) : undefined;
            const resolvedName =
              nameFromApi || (code ? countryNameFromIsoCode(code)?.slice(0, 120) : undefined);
            merged = {
              ...(merged ?? {}),
              country: merged?.country?.trim() || resolvedName || undefined,
              countryCode: merged?.countryCode?.trim() || code || undefined,
              location:
                merged?.location?.trim() ||
                (d.display_name?.trim() ? d.display_name.trim().slice(0, 4000) : undefined),
            };
          }
        } catch (e) {
          console.warn("reverseGeocode (checkInOut) failed:", e);
        }
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

    if (merged && (merged.country || merged.countryCode || merged.location?.trim())) {
      const rawCode = merged.countryCode?.trim();
      const code = rawCode ? String(rawCode).toUpperCase().slice(0, 3) : undefined;
      const explicitName = merged.country?.trim();
      const resolvedCountryName =
        (explicitName && String(explicitName).slice(0, 120)) ||
        (code ? countryNameFromIsoCode(code)?.slice(0, 120) : undefined) ||
        undefined;

      if (isCheckIn) {
        if (resolvedCountryName) {
          body.check_in_country = resolvedCountryName;
        } else if (code) {
          body.check_in_country = code;
        }
        if (code) {
          body.check_in_country_code = code;
        }
        if (merged.location?.trim()) {
          body.check_in_location = String(merged.location).trim().slice(0, 4000);
        }
      } else {
        if (resolvedCountryName) {
          body.check_out_country = resolvedCountryName;
        } else if (code) {
          body.check_out_country = code;
        }
        if (code) {
          body.check_out_country_code = code;
        }
        if (merged.location?.trim()) {
          body.check_out_location = String(merged.location).trim().slice(0, 4000);
        }
      }
    }

    console.log('📤 Attendance check-in/out payload:', {
      userId,
      isCheckIn,
      hasProject: !!body.project,
      projectId: body.project,
      hasImages: !!body.base64_images,
      hasLocation: !!(body.check_in_latitude || body.check_out_latitude),
      hasLocationText: !!(body.check_in_location || body.check_out_location),
      hasCountry: !!(body.check_in_country || body.check_out_country || body.check_in_country_code || body.check_out_country_code),
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

  // Get attendance for specific user (first path segment is admin UUID)
  async getUserAttendanceByDate(adminId: string, userId: string, date: string): Promise<AttendanceResponse> {
    const url = `/api/employee-attendance/${adminId}/${userId}?date=${date}`;
    console.log('🔍 getUserAttendanceByDate called:', { adminId, userId, date, url });
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

  // Get monthly attendance status (first path segment is admin UUID)
  async getMonthlyAttendance(adminId: string, userId: string, month: number, year: number): Promise<MonthlyAttendanceResponse> {
    const url = `/api/employee-monthly-attendance/${adminId}/${userId}/${month}/${year}`;
    console.log('🔍 getMonthlyAttendance called:', { adminId, userId, month, year, url });
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
  async getHolidays(adminId: string): Promise<HolidayAPIResponse> {
    const url = `/api/holidays/${adminId}`;
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
  async getLeaveTypes(adminId: string): Promise<LeaveTypeAPIResponse> {
    const url = `/api/leave-types/${adminId}`;
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
  async getLeaveBalances(adminId: string, userId: string, year?: number): Promise<LeaveBalanceAPIResponse> {
    let url = `/api/leave-balances/${adminId}/${userId}`;
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
    adminId: string,
    userId: string,
    leaveTypeId: number,
    fromDate: string,
    toDate: string,
    reason: string,
    leaveDayType: "full_day" | "first_half" | "second_half" = "full_day"
  ): Promise<LeaveApplicationAPIResponse> {
    const url = `/api/leave-applications/${adminId}/${userId}/`;
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
    adminId: string,
    userId: string,
    year?: number
  ): Promise<LeaveApplicationsListAPIResponse> {
    let url = `/api/leave-applications/${adminId}/${userId}/`;
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
    adminId: string,
    userId: string,
    fromDate?: string,
    toDate?: string,
    status?: 'pending' | 'in-progress' | 'completed'
  ): Promise<TaskListAPIResponse> {
    let url = `/api/task/employee/my-tasks/${adminId}/${userId}`;
    
    // Add parameters if provided
    const params = new URLSearchParams();
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    if (status) {
      // Convert app format (in-progress) to API format (in_progress)
      const apiStatus = status === 'in-progress' ? 'in_progress' : status;
      params.append('status', apiStatus);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log('🔍 Fetching tasks for userId:', userId, { fromDate, toDate, status });
    return this.request<TaskListAPIResponse>(
      url,
      { method: 'GET' },
      true
    );
  }

  // Update task status (accept/complete)
  async updateTaskStatus(
    adminId: string,
    taskId: number,
    status: 'pending' | 'in-progress' | 'completed',
    comment?: string
  ): Promise<TaskUpdateAPIResponse> {
    const url = `/api/task/employee/update-task-status/${adminId}/${taskId}/`;
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

  // Photo refresh toggle — same as web admin (PATCH photo-refresh/<user_id>)
  async toggleIsPhotoUpdated(
    userId: string,
    isPhotoUpdated = true
  ): Promise<{ status: number; message: string; data?: { is_photo_updated?: boolean } }> {
    const url = `/api/photo-refresh/${userId}`;
    console.log('🔍 Setting is_photo_updated for userId:', userId, '→', isPhotoUpdated);
    const response = await this.request<{
      status: number;
      message: string;
      data?: { is_photo_updated?: boolean };
    }>(
      url,
      {
        method: 'PATCH',
        body: JSON.stringify({ is_photo_updated: isPhotoUpdated }),
      },
      true
    );
    console.log('🔍 Photo refresh toggle response:', response);
    return response;
  }

  // Employee Profile Photo Upload API — expects pre-compressed raw base64 (no data: prefix)
  async uploadProfilePhoto(
    userId: string,
    rawBase64: string
  ): Promise<{ status: number; message: string; data?: { profile_photo?: string; is_photo_updated?: boolean } }> {
    const url = `/api/employee/profile-photo-upload/${userId}`;
    const payload = stripDataUriPrefix(rawBase64);
    console.log("📤 Uploading profile photo for userId:", userId, "sizeKB:", Math.round(payload.length / 1024));

    const body = { base64_image: payload };

    const response = await this.request<{
      status: number;
      message: string;
      data?: { profile_photo?: string; is_photo_updated?: boolean };
    }>(url, { method: "POST", body: JSON.stringify(body) }, true);
    console.log("📤 Profile photo upload response:", response.status);
    return response;
  }

  // Update FCM Token for Employee
  async updateFcmToken(
    userId: string,
    fcmToken: string
  ): Promise<{ status: number; message: string; data?: { user_id: string; fcm_token: string } }> {
    const url = `/api/fcm-token/${userId}`;
    console.log('📱 Updating FCM token for userId:', userId);

    const body = {
      fcm_token: fcmToken,
    };

    const response = await this.request<{ status: number; message: string; data?: { user_id: string; fcm_token: string } }>(
      url,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      true
    );
    console.log('📱 FCM token update response:', response);
    return response;
  }

  // ==================== INVENTORY (My Materials) ====================

  async getMyInventoryMaterials(
    adminId: string,
    userId?: string
  ): Promise<{
    status: number;
    message: string;
    data: InventoryMaterialAssignment[];
  }> {
    const url = userId
      ? `/api/inventory/my-materials/${adminId}/${userId}/`
      : `/api/inventory/my-materials/${adminId}/`;
    return this.request(url, { method: "GET" }, true);
  }

  async acknowledgeInventoryMaterial(
    adminId: string,
    userId: string,
    issueId: string,
    remark: string
  ): Promise<{
    status: number;
    message: string;
    data: InventoryMaterialAssignment;
  }> {
    const url = `/api/inventory/my-materials/${adminId}/${userId}/${issueId}/acknowledge/`;
    return this.request(
      url,
      {
        method: "POST",
        body: JSON.stringify({ remark }),
      },
      true
    );
  }

  // ==================== ATTACHMENT MANAGEMENT ====================

  async browseAttachments(
    adminId: string,
    params?: { folder_id?: number | null; search?: string }
  ): Promise<{
    status: number;
    message: string;
    data: AttachmentBrowseData;
  }> {
    const query = new URLSearchParams();
    if (params?.folder_id != null) {
      query.append("folder_id", String(params.folder_id));
    }
    if (params?.search?.trim()) {
      query.append("search", params.search.trim());
    }
    const qs = query.toString();
    const url = `/api/attachments/browse/${adminId}/${qs ? `?${qs}` : ""}`;
    return this.request(url, { method: "GET" }, true);
  }

  async createAttachmentFolder(
    adminId: string,
    name: string,
    parentId?: number | null
  ): Promise<{
    status: number;
    message: string;
    data: AttachmentFolderItem;
  }> {
    const body: { name: string; parent_id?: number | null } = { name };
    if (parentId != null) {
      body.parent_id = parentId;
    }
    return this.request(
      `/api/attachments/folders/${adminId}/`,
      { method: "POST", body: JSON.stringify(body) },
      true
    );
  }

  async deleteAttachmentFolder(
    adminId: string,
    folderId: number
  ): Promise<{ status: number; message: string; data: null }> {
    return this.request(
      `/api/attachments/folders/${adminId}/${folderId}/`,
      { method: "DELETE" },
      true
    );
  }

  async deleteAttachmentFile(
    adminId: string,
    fileId: number
  ): Promise<{ status: number; message: string; data: null }> {
    return this.request(
      `/api/attachments/files/${adminId}/${fileId}/`,
      { method: "DELETE" },
      true
    );
  }

  private async buildAttachmentUploadFormData(
    file: AttachmentUploadInput,
    folderId?: number | null
  ): Promise<FormData> {
    const formData = new FormData();

    if (Platform.OS === "web") {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      formData.append("file", blob, file.name);
    } else {
      formData.append(
        "file",
        {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as unknown as Blob
      );
    }

    if (folderId != null) {
      formData.append("folder_id", String(folderId));
    }
    return formData;
  }

  async uploadAttachmentFile(
    adminId: string,
    file: AttachmentUploadInput,
    folderId?: number | null
  ): Promise<{
    status: number;
    message: string;
    data: AttachmentFileItem;
  }> {
    const formData = await this.buildAttachmentUploadFormData(file, folderId);
    return this.requestMultipart(`/api/attachments/files/${adminId}/`, formData);
  }

  /** Upload one or more files via single-file API (reliable on React Native). */
  async uploadAttachmentFiles(
    adminId: string,
    files: AttachmentUploadInput[],
    folderId?: number | null
  ): Promise<{
    status: number;
    message: string;
    data: { uploaded: AttachmentFileItem[]; errors: { name: string; error: string }[] };
  }> {
    const uploaded: AttachmentFileItem[] = [];
    const errors: { name: string; error: string }[] = [];

    for (const file of files) {
      try {
        const res = await this.uploadAttachmentFile(adminId, file, folderId);
        if (res.data) {
          uploaded.push(res.data);
        }
      } catch (err) {
        errors.push({
          name: file.name,
          error: err instanceof Error ? err.message : "Upload failed",
        });
      }
    }

    if (uploaded.length === 0 && errors.length > 0) {
      throw new Error(errors[0].error);
    }

    return {
      status: uploaded.length > 0 ? 201 : 400,
      message: `${uploaded.length} file(s) uploaded`,
      data: { uploaded, errors },
    };
  }

  // ==================== NOTIFICATION APIs ====================

  async getNotificationHistory(
    params?: {
      page?: number;
      type?: string;
      is_read?: boolean;
    }
  ): Promise<NotificationHistoryResponse> {
    let url = '/api/notifications/history';
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.is_read !== undefined) queryParams.append('is_read', params.is_read.toString());

    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    console.log('🔔 Fetching notification history:', url);
    return this.request<NotificationHistoryResponse>(url, { method: 'GET' }, true);
  }

  async markNotificationAsRead(id?: string): Promise<{ status: number; message: string }> {
    const url = id ? `/api/notifications/history/${id}` : '/api/notifications/history';
    console.log('🔔 Marking notification as read:', id || 'all');
    return this.request<{ status: number; message: string }>(
      url,
      { method: 'PUT' },
      true
    );
  }

  // ==================== EXPENSE APIs ====================

  // Get Expense Categories
  async getExpenseCategories(adminId: string): Promise<{ status: number; message: string; data?: ExpenseCategoryAPI[] }> {
    const url = `/api/expense-categories/${adminId}`;
    console.log('🔍 Fetching expense categories for adminId:', adminId);
    const response = await this.request<{ status: number; message: string; data?: ExpenseCategoryAPI[] }>(
      url,
      { method: 'GET' },
      true
    );
    console.log('🔍 Expense categories response:', response);
    return response;
  }

  // Get Expense Projects
  async getExpenseProjects(adminId: string): Promise<{ status: number; message: string; data?: ExpenseProjectAPI[] }> {
    const url = `/api/expense-projects/${adminId}`;
    console.log('🔍 Fetching expense projects for adminId:', adminId);
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
    adminId: string,
    userId: string,
    expenseData: {
      category?: number;
      project?: number | null;
      title?: string;
      expense_date?: string;
      amount?: number;
      description?: string;
      receipt_images?: string[];
    }
  ): Promise<{ status: number; message: string; data?: any }> {
    const url = `/api/expenses/${adminId}/${userId}/`;
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
    adminId: string,
    userId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<{ status: number; message: string; data?: ExpenseAPI[] }> {
    let url = `/api/expenses/${adminId}/${userId}/`;
    
    // Add date parameters if provided
    const params = new URLSearchParams();
    if (fromDate) params.append('date_from', fromDate);
    if (toDate) params.append('date_to', toDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log('🔍 Fetching expenses for userId:', userId, { fromDate, toDate });
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
    adminId: string,
    userId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<{ status: number; message: string; data?: VisitListResponse }> {
    let url = `/api/visit/visit-list-create-by-user/${adminId}/${userId}/`;
    
    // Add date parameters if provided
    const params = new URLSearchParams();
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log('🔍 Fetching visits for userId:', userId, { fromDate, toDate });
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
    adminId: string,
    userId: string,
    visitData: {
      title: string;
      description?: string;
      schedule_date: string;
      schedule_time?: string;
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
      latitude?: number;
      longitude?: number;
      check_in_note?: string;
    }
  ): Promise<{ status: number; message: string; data?: VisitAPI }> {
    const url = `/api/visit/visit-list-create-by-user/${adminId}/${userId}/`;
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
    adminId: string,
    userId: string,
    visitId: number,
    checkInData: {
      latitude: number;
      longitude: number;
      note?: string;
    }
  ): Promise<{ status: number; message: string; data?: any }> {
    const url = `/api/visit/visit-check-in/${adminId}/${userId}/${visitId}/`;
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
    adminId: string,
    userId: string,
    visitId: number,
    checkOutData: {
      latitude: number;
      longitude: number;
      note?: string;
    }
  ): Promise<{ status: number; message: string; data?: any }> {
    const url = `/api/visit/visit-check-out/${adminId}/${userId}/${visitId}/`;
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

  async getLiftComplianceDefaults(
    userId: string
  ): Promise<{ status: number; message: string; data?: Record<string, unknown> }> {
    return this.request(
      `/api/lift-compliance/defaults/${userId}/`,
      { method: "GET" },
      true
    );
  }

  async getMyCOCertificates(
    userId: string,
    params?: { date_from?: string; date_to?: string; page?: number; page_size?: number }
  ): Promise<{
    status: number;
    message: string;
    data: LiftComplianceRecord[];
    pagination?: {
      total_items: number;
      total_pages: number;
      current_page: number;
      page_size: number;
      has_next: boolean;
      has_previous: boolean;
    };
  }> {
    const q = new URLSearchParams();
    if (params?.date_from) q.set("date_from", params.date_from);
    if (params?.date_to) q.set("date_to", params.date_to);
    if (params?.page) q.set("page", String(params.page));
    if (params?.page_size) q.set("page_size", String(params.page_size));
    const qs = q.toString();
    const url = `/api/lift-compliance/my-certificates/${userId}${qs ? `?${qs}` : ""}`;
    return this.request(url, { method: "GET" }, true);
  }

  async submitLiftCompliance(
    userId: string,
    payload: LiftComplianceSubmitPayload
  ): Promise<{ status: number; message: string; data?: LiftComplianceRecord }> {
    const response = await this.request<{
      status: number;
      message: string;
      data?: LiftComplianceRecord;
    }>(
      `/api/lift-compliance/submit/${userId}/`,
      { method: "POST", body: JSON.stringify(payload) },
      true
    );
    if (response.status >= 400) {
      throw new Error(response.message || "Failed to submit compliance certificate");
    }
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
  data?: TaskAPI[] | { results?: TaskAPI[]; data?: TaskAPI[] };
}

/** Normalize employee task list from API (array or paginated wrapper). */
export function parseEmployeeTaskList(data: TaskListAPIResponse['data'] | unknown): TaskAPI[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const nested = data as { results?: TaskAPI[]; data?: TaskAPI[] };
    if (Array.isArray(nested.results)) return nested.results;
    if (Array.isArray(nested.data)) return nested.data;
  }
  return [];
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
  is_3s_client?: boolean;
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
    "production-management"?: boolean;
    "holiday-calendar"?: boolean;
    "shift-management"?: boolean;
    locations?: boolean;
    "week-offs"?: boolean;
    "leave-types"?: boolean;
    "inventory-management"?: boolean;
    "attachment-management"?: boolean;
    complianceCertificates?: boolean;
    [key: string]: boolean | undefined;
  };
  created_at: string;
  updated_at: string;
}

export interface LiftComplianceSubmitPayload {
  email: string;
  username: string;
  phone_number: string;
  custom_employee_id: string;
  gender: string;
  date_of_joining: string;
  user_name: string;
  state: string;
  city: string;
  date_of_issue: string;
  /** Optional hint; server assigns unique issue number if taken or omitted */
  issue_number?: number;
  location_number: string;
  product_manufacturer: string;
  lift_model: string;
  customer_name: string;
  customer_address: string;
  date_of_assessment: string;
  reference_text: string;
  inspection_date: string;
  site_location_name: string;
  lift_serial_number: string;
  operating_hours: string;
  inspected_done_by: string;
  inspection_remarks: string;
  certificate_valid_from: string;
  certificate_valid_to: string;
  lift_installed_by: string;
  compliance_inference: string;
}

export interface LiftComplianceRecord {
  id: number;
  certificate_number: string;
  date_of_issue?: string;
  pdf_file_url?: string | null;
  excel_file_url?: string | null;
  user_name?: string;
  custom_employee_id?: string;
  location_number?: string;
  site_location_name?: string;
  lift_serial_number?: string;
  lift_model?: string;
  inspection_date?: string;
  created_at: string;
  [key: string]: unknown;
}

export const apiService = new ApiService(BACKEND_URL);

