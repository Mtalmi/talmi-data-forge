import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface ErrorContext {
  component?: string;
  action?: string;
  tableName?: string;
  recordId?: string;
  metadata?: Record<string, unknown>;
}

interface UserContext {
  userId?: string;
  userName?: string;
  userRole?: string;
}

/**
 * Error Sentry - Centralized error logging for production auditing
 * Logs errors to system_errors table for CEO/Developer audit
 */
class ErrorSentry {
  private static instance: ErrorSentry;
  private userContext: UserContext = {};
  private isInitialized = false;

  private constructor() {}

  static getInstance(): ErrorSentry {
    if (!ErrorSentry.instance) {
      ErrorSentry.instance = new ErrorSentry();
    }
    return ErrorSentry.instance;
  }

  /**
   * Initialize the Error Sentry with user context
   */
  initialize(userContext: UserContext) {
    this.userContext = userContext;
    this.isInitialized = true;
    this.setupGlobalHandlers();
  }

  /**
   * Update user context (e.g., after login)
   */
  setUserContext(userContext: Partial<UserContext>) {
    this.userContext = { ...this.userContext, ...userContext };
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalHandlers() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { component: 'GlobalHandler', action: 'unhandledrejection' }
      );
    });

    // Catch uncaught errors
    window.addEventListener('error', (event) => {
      this.captureError(
        event.error || new Error(event.message),
        { 
          component: 'GlobalHandler', 
          action: 'uncaughtError',
          metadata: { 
            filename: event.filename, 
            lineno: event.lineno, 
            colno: event.colno 
          }
        }
      );
    });
  }

  /**
   * Capture and log an error
   */
  async captureError(
    error: Error | string,
    context: ErrorContext = {}
  ): Promise<string | null> {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    const errorData = {
      error_type: errorObj.name || 'Error',
      error_message: errorObj.message,
      error_stack: errorObj.stack,
      error_code: (errorObj as { code?: string }).code || null,
      user_id: this.userContext.userId || null,
      user_name: this.userContext.userName || null,
      user_role: this.userContext.userRole || null,
      component: context.component || null,
      action: context.action || null,
      table_name: context.tableName || null,
      record_id: context.recordId || null,
      url: window.location.href,
      user_agent: navigator.userAgent,
      metadata: (context.metadata || {}) as Json,
    };

    try {
      const { data, error: insertError } = await supabase
        .from('system_errors')
        .insert([errorData])
        .select('id')
        .single();

      if (insertError) {
        // Fallback: log to console if DB insert fails
        console.error('[ErrorSentry] Failed to log error to DB:', insertError);
        console.error('[ErrorSentry] Original error:', errorData);
        return null;
      }

      console.warn(`[ErrorSentry] Error logged: ${data.id}`);
      return data.id;
    } catch (e) {
      // Last resort fallback
      console.error('[ErrorSentry] Critical failure logging error:', e);
      console.error('[ErrorSentry] Original error:', errorData);
      return null;
    }
  }

  /**
   * Capture a Supabase/Database error
   */
  async captureDbError(
    error: { message: string; code?: string; details?: string; hint?: string },
    context: ErrorContext = {}
  ): Promise<string | null> {
    return this.captureError(
      new Error(`DB Error: ${error.message}`),
      {
        ...context,
        metadata: {
          ...context.metadata,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
      }
    );
  }

  /**
   * Capture an API/Network error
   */
  async captureApiError(
    endpoint: string,
    status: number,
    message: string,
    context: ErrorContext = {}
  ): Promise<string | null> {
    return this.captureError(
      new Error(`API Error (${status}): ${message}`),
      {
        ...context,
        action: context.action || 'apiCall',
        metadata: {
          ...context.metadata,
          endpoint,
          status,
        },
      }
    );
  }

  /**
   * Wrap an async function with error capturing
   */
  wrap<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    context: ErrorContext = {}
  ): T {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        await this.captureError(
          error instanceof Error ? error : new Error(String(error)),
          context
        );
        throw error;
      }
    }) as T;
  }
}

// Export singleton instance
export const errorSentry = ErrorSentry.getInstance();

// Convenience functions
export const captureError = (error: Error | string, context?: ErrorContext) =>
  errorSentry.captureError(error, context);

export const captureDbError = (
  error: { message: string; code?: string; details?: string; hint?: string },
  context?: ErrorContext
) => errorSentry.captureDbError(error, context);

export const captureApiError = (
  endpoint: string,
  status: number,
  message: string,
  context?: ErrorContext
) => errorSentry.captureApiError(endpoint, status, message, context);

export const initializeErrorSentry = (userContext: UserContext) =>
  errorSentry.initialize(userContext);

export const setErrorSentryUser = (userContext: Partial<UserContext>) =>
  errorSentry.setUserContext(userContext);
