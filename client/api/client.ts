import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const API_TIMEOUT = 30000;

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RefreshSubscriber = {
  onSuccess: (token: string) => void;
  onError: (error: unknown) => void;
};
type AuthErrorCallback = () => void;
type RefreshFn = () => Promise<string>;

class ApiClient {
  private instance: AxiosInstance;
  private token: string | null = null;
  private isRefreshing = false;
  private pendingRefresh: Promise<string> | null = null;
  private refreshSubscribers: RefreshSubscriber[] = [];
  private onAuthError: AuthErrorCallback | null = null;
  private refreshFn: RefreshFn | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      withCredentials: true, // required for httpOnly refresh token cookie
      headers: { "Content-Type": "application/json" },
    });

    this.setupInterceptors();
  }

  /** Register a callback to be called when token refresh fails (e.g. redirect to login) */
  setAuthErrorCallback(cb: AuthErrorCallback) {
    this.onAuthError = cb;
  }

  /** Register the function that performs the actual token refresh (called by both explicit refresh and the interceptor) */
  setRefreshFn(fn: RefreshFn) {
    this.refreshFn = fn;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private addRefreshSubscriber(
    onSuccess: (token: string) => void,
    onError: (error: unknown) => void,
  ) {
    this.refreshSubscribers.push({ onSuccess, onError });
  }

  private notifySubscribers(token: string) {
    this.refreshSubscribers.forEach((s) => s.onSuccess(token));
    this.refreshSubscribers = [];
  }

  private rejectSubscribers(error: unknown) {
    this.refreshSubscribers.forEach((s) => s.onError(error));
    this.refreshSubscribers = [];
  }

  /**
   * Single entry point for token refresh — used by both the explicit store.refresh() call
   * and the 401 interceptor. The isRefreshing flag and pendingRefresh promise ensure only
   * one refresh call is in-flight at a time, regardless of which path triggered it.
   */
  triggerRefresh(): Promise<string> {
    if (this.pendingRefresh) return this.pendingRefresh;

    if (!this.refreshFn) {
      const err = new Error("No refresh function registered");
      this.onAuthError?.();
      return Promise.reject(err);
    }

    this.isRefreshing = true;
    this.pendingRefresh = this.refreshFn()
      .then((token) => {
        this.setToken(token);
        this.notifySubscribers(token);
        return token;
      })
      .catch((err) => {
        this.rejectSubscribers(err);
        this.setToken(null);
        this.onAuthError?.();
        throw err;
      })
      .finally(() => {
        this.isRefreshing = false;
        this.pendingRefresh = null;
      });

    return this.pendingRefresh;
  }

  /**
   * TODO: Change this base on the actual Backend API's endpoint structure.
   * This is only a example of how to handle axios interceptors for token refresh and error handling, 
   * and may need to be adjusted to fit the specific API's response structure.
   * The current implementation assumes that the API returns errors 
   * in the format { message: string, errors?: Record<string, string[]> },
   * which is a common pattern but may not match your actual API.
   * Adjust the error handling logic in the response interceptor
   * as needed to correctly parse and throw ApiError instances 
   * based on your API's error response structure.
   */
  private setupInterceptors() {
    // Request — attach access token, but don't override an already-set Authorization header
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.token && !config.headers["Authorization"]) {
          config.headers["Authorization"] = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response — handle 401 with silent token refresh + request retry
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const original = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        const isAuthEndpoint =
          original?.url?.includes("/auth/refresh") ||
          original?.url?.includes("/auth/login") ||
          original?.url?.includes("/auth/verify-auth");

        if (
          error.response?.status === 401 &&
          !original?._retry &&
          !isAuthEndpoint
        ) {
          original._retry = true;

          if (this.isRefreshing) {
            // Queue while another refresh is in progress
            return new Promise<AxiosResponse>((resolve, reject) => {
              this.addRefreshSubscriber(
                (newToken) => {
                  original.headers["Authorization"] = `Bearer ${newToken}`;
                  resolve(this.instance(original));
                },
                (err) => reject(err),
              );
            });
          }

          try {
            const newToken = await this.triggerRefresh();
            original.headers["Authorization"] = `Bearer ${newToken}`;
            return this.instance(original);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }

        // Standard error normalisation
        if (error.response) {
          const data = error.response.data as Record<string, unknown>;
          throw new ApiError(
            (data?.message as string) || "Request failed",
            error.response.status,
            data?.errors as Record<string, string[]>,
          );
        } else if (error.request) {
          throw new ApiError("Network error. Please check your connection.");
        } else {
          throw new ApiError(error.message || "Request failed");
        }
      },
    );
  }

  async get<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config);
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config);
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data, config);
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data, config);
  }

  async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, config);
  }

  async upload<T>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, formData, {
      ...config,
      headers: { "Content-Type": "multipart/form-data", ...config?.headers },
    });
  }

  async postForm<T>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, formData, {
      ...config,
      headers: { "Content-Type": "multipart/form-data", ...config?.headers },
    });
  }
}

export const apiClient = new ApiClient();
