"""
Supabase Client Module
Handles Supabase integration for AI insights worker.
"""
import os
import logging
from typing import Dict, Any, Optional
from supabase import create_client, Client
from json_utils import convert_to_json_serializable

logger = logging.getLogger(__name__)


class SupabaseClient:
    """Wrapper for Supabase client with error handling."""

    def __init__(self):
        """Initialize Supabase client."""
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

        self.client: Client = create_client(supabase_url, supabase_key)
        logger.info("Supabase client initialized")

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get job details from database.

        Args:
            job_id: Job UUID

        Returns:
            Job data dictionary or None
        """
        try:
            response = self.client.table('analysis_jobs').select('*').eq('id', job_id).execute()

            if response.data:
                return response.data[0]
            return None

        except Exception as e:
            logger.error(f"Error fetching job {job_id}: {e}")
            return None

    def update_job_status(self, job_id: str, status: str, error_message: str = None) -> bool:
        """
        Update job status in database.

        Args:
            job_id: Job UUID
            status: New status
            error_message: Optional error message

        Returns:
            True if successful
        """
        try:
            update_data = {
                'status': status
            }

            if error_message:
                update_data['error_message'] = error_message

            if status == 'processing':
                from datetime import datetime
                update_data['processing_started_at'] = datetime.utcnow().isoformat()

            if status == 'completed':
                from datetime import datetime
                update_data['processing_completed_at'] = datetime.utcnow().isoformat()

            self.client.table('analysis_jobs').update(update_data).eq('id', job_id).execute()

            logger.info(f"Updated job {job_id} status to {status}")
            return True

        except Exception as e:
            logger.error(f"Error updating job status: {e}")
            return False

    def save_analysis_result(self, job_id: str, result_type: str, result_data: Dict[str, Any]) -> bool:
        """
        Save analysis result to database.

        Args:
            job_id: Job UUID
            result_type: Type of result (statistics, quality, etc.)
            result_data: Result data

        Returns:
            True if successful
        """
        try:
            # Convert to JSON-serializable format
            serializable_data = convert_to_json_serializable(result_data)

            result = {
                'job_id': job_id,
                'result_type': result_type,
                'result_data': serializable_data
            }

            self.client.table('analysis_results').insert(result).execute()

            logger.info(f"Saved {result_type} result for job {job_id}")
            return True

        except Exception as e:
            logger.error(f"Error saving result: {e}")
            return False

    def get_file_path(self, job_id: str) -> Optional[str]:
        """
        Get file path for job.

        Args:
            job_id: Job UUID

        Returns:
            File path or None
        """
        try:
            job = self.get_job(job_id)
            if job:
                return job.get('file_path')
            return None

        except Exception as e:
            logger.error(f"Error getting file path: {e}")
            return None