import type { SignInWithPasswordCredentials } from "@supabase/supabase-js";

export type LoginCredentials = Extract<
  SignInWithPasswordCredentials,
  { email: string }
>;

export interface AuthState {
  loading: boolean;
  errorMsg: string | null;
  success: boolean;
}
