"""
Google services client.

Provides interface for Google Workspace APIs including Sheets,
Drive, Analytics, and Ads.
"""

from typing import Any, Dict, List, Optional

from google.oauth2 import service_account
from googleapiclient.discovery import build
from pydantic import BaseModel

from config.settings import get_settings
from config.api_keys import get_api_key_manager
from core.logger import get_logger


class GoogleClient:
    """
    Base client for Google services.

    Provides authentication and common utilities for Google APIs.
    """

    def __init__(
        self,
        credentials_path: Optional[str] = None,
        scopes: Optional[List[str]] = None,
    ):
        """
        Initialize Google client.

        Args:
            credentials_path: Path to service account credentials
            scopes: OAuth scopes
        """
        self.settings = get_settings()
        self.logger = get_logger("google_client")

        self.credentials_path = credentials_path
        self.scopes = scopes or [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
        ]

        self.credentials = None
        if credentials_path:
            self._load_credentials()

    def _load_credentials(self):
        """Load service account credentials."""
        try:
            self.credentials = service_account.Credentials.from_service_account_file(
                self.credentials_path,
                scopes=self.scopes,
            )
            self.logger.info("Google credentials loaded successfully")
        except Exception as e:
            self.logger.error(f"Failed to load Google credentials: {e}")


class GoogleSheetsClient(GoogleClient):
    """
    Client for Google Sheets API.

    Provides methods for reading and writing Google Sheets data.
    """

    def __init__(self, credentials_path: Optional[str] = None):
        """
        Initialize Sheets client.

        Args:
            credentials_path: Path to service account credentials
        """
        super().__init__(
            credentials_path=credentials_path,
            scopes=["https://www.googleapis.com/auth/spreadsheets"],
        )

        if self.credentials:
            self.service = build("sheets", "v4", credentials=self.credentials)

    def read_range(
        self,
        spreadsheet_id: str,
        range_name: str,
    ) -> List[List[Any]]:
        """
        Read data from a spreadsheet range.

        Args:
            spreadsheet_id: Spreadsheet ID
            range_name: Range in A1 notation (e.g., 'Sheet1!A1:D10')

        Returns:
            List[List[Any]]: Cell values
        """
        try:
            result = (
                self.service.spreadsheets()
                .values()
                .get(spreadsheetId=spreadsheet_id, range=range_name)
                .execute()
            )

            values = result.get("values", [])
            self.logger.info(f"Read {len(values)} rows from {range_name}")
            return values

        except Exception as e:
            self.logger.error(f"Failed to read spreadsheet: {e}")
            return []

    def write_range(
        self,
        spreadsheet_id: str,
        range_name: str,
        values: List[List[Any]],
    ) -> bool:
        """
        Write data to a spreadsheet range.

        Args:
            spreadsheet_id: Spreadsheet ID
            range_name: Range in A1 notation
            values: Cell values to write

        Returns:
            bool: Success status
        """
        try:
            body = {"values": values}

            result = (
                self.service.spreadsheets()
                .values()
                .update(
                    spreadsheetId=spreadsheet_id,
                    range=range_name,
                    valueInputOption="RAW",
                    body=body,
                )
                .execute()
            )

            self.logger.info(f"Wrote {result.get('updatedCells')} cells")
            return True

        except Exception as e:
            self.logger.error(f"Failed to write spreadsheet: {e}")
            return False

    def append_rows(
        self,
        spreadsheet_id: str,
        range_name: str,
        values: List[List[Any]],
    ) -> bool:
        """
        Append rows to a spreadsheet.

        Args:
            spreadsheet_id: Spreadsheet ID
            range_name: Range in A1 notation
            values: Rows to append

        Returns:
            bool: Success status
        """
        try:
            body = {"values": values}

            result = (
                self.service.spreadsheets()
                .values()
                .append(
                    spreadsheetId=spreadsheet_id,
                    range=range_name,
                    valueInputOption="RAW",
                    body=body,
                )
                .execute()
            )

            self.logger.info(f"Appended {result.get('updates').get('updatedRows')} rows")
            return True

        except Exception as e:
            self.logger.error(f"Failed to append rows: {e}")
            return False


class GoogleDriveClient(GoogleClient):
    """
    Client for Google Drive API.

    Provides methods for file management in Google Drive.
    """

    def __init__(self, credentials_path: Optional[str] = None):
        """
        Initialize Drive client.

        Args:
            credentials_path: Path to service account credentials
        """
        super().__init__(
            credentials_path=credentials_path,
            scopes=["https://www.googleapis.com/auth/drive"],
        )

        if self.credentials:
            self.service = build("drive", "v3", credentials=self.credentials)

    def list_files(
        self,
        folder_id: Optional[str] = None,
        query: Optional[str] = None,
        page_size: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        List files in Drive.

        Args:
            folder_id: Folder ID to list from
            query: Search query
            page_size: Results per page

        Returns:
            List[Dict]: File metadata
        """
        try:
            # Build query
            if folder_id:
                q = f"'{folder_id}' in parents"
            elif query:
                q = query
            else:
                q = None

            results = (
                self.service.files()
                .list(
                    pageSize=page_size,
                    q=q,
                    fields="nextPageToken, files(id, name, mimeType, createdTime)",
                )
                .execute()
            )

            files = results.get("files", [])
            self.logger.info(f"Found {len(files)} files")
            return files

        except Exception as e:
            self.logger.error(f"Failed to list files: {e}")
            return []

    def upload_file(
        self,
        file_path: str,
        folder_id: Optional[str] = None,
        mime_type: Optional[str] = None,
    ) -> Optional[str]:
        """
        Upload file to Drive.

        Args:
            file_path: Local file path
            folder_id: Destination folder ID
            mime_type: File MIME type

        Returns:
            Optional[str]: File ID
        """
        try:
            from googleapiclient.http import MediaFileUpload
            import os

            file_metadata = {"name": os.path.basename(file_path)}

            if folder_id:
                file_metadata["parents"] = [folder_id]

            media = MediaFileUpload(file_path, mimetype=mime_type, resumable=True)

            file = (
                self.service.files()
                .create(body=file_metadata, media_body=media, fields="id")
                .execute()
            )

            self.logger.info(f"Uploaded file: {file.get('id')}")
            return file.get("id")

        except Exception as e:
            self.logger.error(f"Failed to upload file: {e}")
            return None
