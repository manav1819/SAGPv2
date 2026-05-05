'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Profile, OrgMembership } from '@/types/database';

export interface AuthSignUpMetadata {
  first_name: string;
  last_name: string;
  role?: 'superadmin' | 'org_admin' | 'manager' | 'employee';
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data: data.user,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
      data: null,
    };
  }
}

/**
 * Sign up with email, password, and metadata
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata: AuthSignUpMetadata
) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: metadata.first_name,
          last_name: metadata.last_name,
          role: metadata.role || 'employee',
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data: data.user,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
      data: null,
    };
  }
}

/**
 * Sign in with SSO provider
 */
export async function signInWithSSO(
  provider: 'google' | 'azure' | 'okta'
) {
  try {
    const supabase = await createServerSupabaseClient();

    // Map provider names to Supabase supported providers
    let supabaseProvider: 'google' | 'azure' = provider === 'okta' ? 'azure' : provider;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: supabaseProvider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/sso-callback`,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        url: null,
      };
    }

    return {
      success: true,
      error: null,
      url: data?.url,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
      url: null,
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Get the current session
 */
export async function getSession() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      return {
        success: false,
        error: error.message,
        session: null,
      };
    }

    return {
      success: true,
      error: null,
      session,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
      session: null,
    };
  }
}

/**
 * Get the current user's profile
 */
export async function getCurrentProfile(): Promise<{
  success: boolean;
  error: string | null;
  profile: Profile | null;
  membership: OrgMembership | null;
}> {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: userError?.message || 'No user found',
        profile: null,
        membership: null,
      };
    }

    // Fetch profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return {
        success: false,
        error: profileError.message,
        profile: null,
        membership: null,
      };
    }

    // Fetch membership
    const { data: membershipData } = await supabase
      .from('org_memberships')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Membership might not exist, so we don't treat this error as critical
    return {
      success: true,
      error: null,
      profile: profileData as Profile,
      membership: membershipData as OrgMembership | null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
      profile: null,
      membership: null,
    };
  }
}
