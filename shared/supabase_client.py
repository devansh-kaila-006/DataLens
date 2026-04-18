"""
Supabase client for Python workers.
Uses service role key for backend operations.
"""
import os
from supabase import create_client, Client

# Get environment variables
supabase_url: str = os.getenv("SUPABASE_URL")
supabase_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Validate environment variables
if not supabase_url or not supabase_key:
    raise ValueError(
        "Missing Supabase environment variables. "
        "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    )

# Create Supabase client
supabase: Client = create_client(supabase_url, supabase_key)


def get_supabase_client() -> Client:
    """
    Get the Supabase client instance.

    Returns:
        Supabase client instance
    """
    return supabase
