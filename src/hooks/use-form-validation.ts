import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';

// User-friendly error messages for common validation issues
const ERROR_MESSAGES: Record<string, string> = {
  // General
  'Required': 'This field is required',
  'Invalid type': 'Please enter a valid value',

  // String validations
  'String must contain at least 1 character(s)': 'This field cannot be empty',
  'String must contain at most 50 character(s)': 'Maximum 50 characters allowed',
  'String must contain at most 100 character(s)': 'Maximum 100 characters allowed',
  'String must contain at most 200 character(s)': 'Maximum 200 characters allowed',
  'String must contain at most 500 character(s)': 'Maximum 500 characters allowed',

  // Identifier
  'Identifier must start with lowercase letter and contain only lowercase letters, numbers, and hyphens':
    'Use lowercase letters, numbers, and hyphens only. Must start with a letter (e.g., my-agent-1)',

  // Array validations
  'Array must contain at least 1 element(s)': 'Please add at least one item',

  // UUID
  'Invalid uuid': 'Invalid ID format',

  // Datetime
  'Invalid datetime': 'Invalid date format',
};

export interface FieldError {
  path: string;
  message: string;
  code: string;
}

export interface FormValidationState {
  errors: Map<string, FieldError>;
  isValid: boolean;
  isDirty: boolean;
  touchedFields: Set<string>;
}

export interface UseFormValidationReturn {
  errors: Map<string, FieldError>;
  isValid: boolean;
  isDirty: boolean;
  validate: (data: unknown) => boolean;
  validateField: (path: string, value: unknown) => string | null;
  getError: (path: string) => string | null;
  hasError: (path: string) => boolean;
  clearErrors: () => void;
  clearFieldError: (path: string) => void;
  touchField: (path: string) => void;
  isTouched: (path: string) => boolean;
}

function friendlyMessage(message: string): string {
  return ERROR_MESSAGES[message] || message;
}

export function useFormValidation<T extends z.ZodType>(
  schema: T
): UseFormValidationReturn {
  const [state, setState] = useState<FormValidationState>({
    errors: new Map(),
    isValid: true,
    isDirty: false,
    touchedFields: new Set(),
  });

  const validate = useCallback((data: unknown): boolean => {
    const result = schema.safeParse(data);

    if (result.success) {
      setState(prev => ({
        ...prev,
        errors: new Map(),
        isValid: true,
        isDirty: true,
      }));
      return true;
    }

    const errors = new Map<string, FieldError>();
    result.error.issues.forEach(issue => {
      const path = issue.path.join('.');
      if (!errors.has(path)) {
        errors.set(path, {
          path,
          message: friendlyMessage(issue.message),
          code: issue.code,
        });
      }
    });

    setState(prev => ({
      ...prev,
      errors,
      isValid: false,
      isDirty: true,
    }));

    return false;
  }, [schema]);

  const validateField = useCallback((path: string, value: unknown): string | null => {
    // Try to extract the field schema - this is a simplified version
    // In a real app, you might want to use schema.shape for object schemas
    try {
      const result = schema.safeParse({ [path]: value });
      if (result.success) {
        setState(prev => {
          const newErrors = new Map(prev.errors);
          newErrors.delete(path);
          return {
            ...prev,
            errors: newErrors,
            isValid: newErrors.size === 0,
          };
        });
        return null;
      }

      const fieldError = result.error.issues.find(
        issue => issue.path.join('.') === path
      );

      if (fieldError) {
        const message = friendlyMessage(fieldError.message);
        setState(prev => {
          const newErrors = new Map(prev.errors);
          newErrors.set(path, {
            path,
            message,
            code: fieldError.code,
          });
          return {
            ...prev,
            errors: newErrors,
            isValid: false,
          };
        });
        return message;
      }

      return null;
    } catch {
      return null;
    }
  }, [schema]);

  const getError = useCallback((path: string): string | null => {
    return state.errors.get(path)?.message || null;
  }, [state.errors]);

  const hasError = useCallback((path: string): boolean => {
    return state.errors.has(path);
  }, [state.errors]);

  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: new Map(),
      isValid: true,
    }));
  }, []);

  const clearFieldError = useCallback((path: string) => {
    setState(prev => {
      const newErrors = new Map(prev.errors);
      newErrors.delete(path);
      return {
        ...prev,
        errors: newErrors,
        isValid: newErrors.size === 0,
      };
    });
  }, []);

  const touchField = useCallback((path: string) => {
    setState(prev => ({
      ...prev,
      touchedFields: new Set([...prev.touchedFields, path]),
    }));
  }, []);

  const isTouched = useCallback((path: string): boolean => {
    return state.touchedFields.has(path);
  }, [state.touchedFields]);

  return useMemo(() => ({
    errors: state.errors,
    isValid: state.isValid,
    isDirty: state.isDirty,
    validate,
    validateField,
    getError,
    hasError,
    clearErrors,
    clearFieldError,
    touchField,
    isTouched,
  }), [
    state.errors,
    state.isValid,
    state.isDirty,
    validate,
    validateField,
    getError,
    hasError,
    clearErrors,
    clearFieldError,
    touchField,
    isTouched,
  ]);
}

// Helper component for displaying field errors
export function useFieldError(
  validation: UseFormValidationReturn,
  path: string
): {
  error: string | null;
  hasError: boolean;
  showError: boolean;
} {
  const error = validation.getError(path);
  const hasError = validation.hasError(path);
  const isTouched = validation.isTouched(path);

  return {
    error,
    hasError,
    showError: hasError && isTouched,
  };
}
