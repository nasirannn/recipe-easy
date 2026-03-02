export const AUTH_REQUIRED_ERROR_CODE = "AUTH_REQUIRED";

type AuthError = Error & { code?: string };

export function createAuthRequiredError(message: string): AuthError {
  const error = new Error(message) as AuthError;
  error.code = AUTH_REQUIRED_ERROR_CODE;
  return error;
}

export function isAuthRequiredError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  return (error as AuthError).code === AUTH_REQUIRED_ERROR_CODE;
}

