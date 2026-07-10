import os
import json
import base64
import urllib.request
import urllib.parse
import uuid
from datetime import datetime
from abc import ABC, abstractmethod
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

from app.database.system_db import get_user_google_tokens, save_user_google_tokens


class EmailProvider(ABC):
    """
    Abstract interface for email delivery.
    """
    @abstractmethod
    def send_email(
        self,
        user_id: int,
        sender: str,
        recipients: list[str],
        subject: str,
        body: str,
        attachments: list[dict] = None,
        cc: list[str] = None,
        bcc: list[str] = None
    ) -> dict:
        """
        Sends an email with attachments.
        Attachments list format:
        [{"filename": "Report.pdf", "content": b"...", "mime_type": "application/pdf"}]
        Returns dict containing: {"success": True/False, "message_id": "...", "error": "..."}
        """
        pass


class GmailOAuthProvider(EmailProvider):
    """
    Sends email reports using the Gmail REST API with User OAuth credentials.
    """
    def __init__(self):
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET")

    def _refresh_access_token(self, user_id: int, refresh_token: str) -> str:
        """
        Refreshes the Google Access Token using the Refresh Token.
        """
        if not self.client_id or not self.client_secret:
            raise ValueError("Google Client ID or Client Secret is not configured in the environment.")

        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
        
        encoded_data = urllib.parse.urlencode(data).encode("utf-8")
        req = urllib.request.Request(token_url, data=encoded_data, method="POST")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
        
        try:
            with urllib.request.urlopen(req) as res:
                response = json.loads(res.read().decode("utf-8"))
            
            new_access_token = response.get("access_token")
            expires_in = response.get("expires_in", 3600)
            
            # Save refreshed token (pass None for refresh_token so we don't overwrite it in DB)
            # Fetch existing tokens first to preserve email
            existing = get_user_google_tokens(user_id)
            email = existing.get("email") if existing else "unknown@gmail.com"
            save_user_google_tokens(user_id, email, new_access_token, None, expires_in)
            
            return new_access_token
        except Exception as e:
            raise Exception(f"Failed to refresh Google OAuth access token: {str(e)}")

    def _get_valid_token(self, user_id: int) -> str:
        """
        Retrieves user tokens and refreshes them if expired or expiring soon.
        """
        tokens = get_user_google_tokens(user_id)
        if not tokens:
            raise ValueError("Gmail connection not found. Please link your Google Account first.")

        access_token = tokens["access_token"]
        refresh_token = tokens["refresh_token"]
        expires_at = tokens["expires_at"]

        # Check if expired or expiring within 5 minutes
        is_expired = datetime.now() >= (expires_at - urllib.parse.timedelta(minutes=5)) if hasattr(urllib.parse, 'timedelta') else datetime.now() >= expires_at
        # Fallback check if timedelta import fails
        from datetime import timedelta
        is_expired = datetime.now() >= (expires_at - timedelta(minutes=5))

        if is_expired:
            if not refresh_token:
                raise ValueError("Google OAuth access token is expired, and no refresh token is available. Please re-authenticate.")
            print(f"Refreshing Google Access Token for user {user_id}...")
            access_token = self._refresh_access_token(user_id, refresh_token)

        return access_token

    def send_email(
        self,
        user_id: int,
        sender: str,
        recipients: list[str],
        subject: str,
        body: str,
        attachments: list[dict] = None,
        cc: list[str] = None,
        bcc: list[str] = None
    ) -> dict:
        try:
            access_token = self._get_valid_token(user_id)
            
            from email.utils import formatdate, make_msgid
            
            # Create standard multipart MIME message
            msg = MIMEMultipart("mixed")
            msg["Subject"] = subject
            if "<" not in sender:
                msg["From"] = f"AskDB Reports <{sender}>"
            else:
                msg["From"] = sender
            msg["To"] = ", ".join(recipients)
            msg["Date"] = formatdate(localtime=True)
            msg["Message-ID"] = make_msgid()
            
            if cc:
                msg["Cc"] = ", ".join(cc)
            
            # Add message body
            msg_alternative = MIMEMultipart("alternative")
            msg.attach(msg_alternative)
            
            # Convert body newlines to HTML br for email clients
            html_body = body.replace("\n", "<br/>")
            msg_alternative.attach(MIMEText(body, "plain", "utf-8"))
            msg_alternative.attach(MIMEText(f"<html><body><p>{html_body}</p></body></html>", "html", "utf-8"))
            
            # Process attachments
            if attachments:
                for att in attachments:
                    maintype, subtype = att["mime_type"].split("/", 1)
                    part = MIMEBase(maintype, subtype)
                    part.set_payload(att["content"])
                    encoders.encode_base64(part)
                    part.add_header(
                        "Content-Disposition",
                        f'attachment; filename="{att["filename"]}"'
                    )
                    msg.attach(part)
            
            # Encode MIME message to raw base64 urlsafe string (as required by Gmail REST API)
            raw_mime = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")
            
            # Gmail REST API Send endpoint
            gmail_url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
            post_data = json.dumps({"raw": raw_mime}).encode("utf-8")
            
            req = urllib.request.Request(gmail_url, data=post_data, method="POST")
            req.add_header("Authorization", f"Bearer {access_token}")
            req.add_header("Content-Type", "application/json")
            
            with urllib.request.urlopen(req) as res:
                response = json.loads(res.read().decode("utf-8"))
                
            return {
                "success": True,
                "message_id": response.get("id", "gmail_sent"),
                "error": None
            }
        except Exception as e:
            return {
                "success": False,
                "message_id": None,
                "error": str(e)
            }


class MockEmailProvider(EmailProvider):
    """
    Mock Email Provider that writes sent emails to the local filesystem.
    Facilitates testing without needing external mail keys.
    """
    def __init__(self, output_dir: str = "data/sent_emails"):
        self.output_dir = output_dir
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

    def send_email(
        self,
        user_id: int,
        sender: str,
        recipients: list[str],
        subject: str,
        body: str,
        attachments: list[dict] = None,
        cc: list[str] = None,
        bcc: list[str] = None
    ) -> dict:
        try:
            email_id = str(uuid.uuid4())
            email_data = {
                "id": email_id,
                "user_id": user_id,
                "sender": sender,
                "recipients": recipients,
                "cc": cc,
                "bcc": bcc,
                "subject": subject,
                "body": body,
                "timestamp": datetime.now().isoformat(),
                "attachments": []
            }
            
            # Write attachments
            if attachments:
                for att in attachments:
                    file_uuid_name = f"{email_id}_{att['filename']}"
                    file_path = os.path.join(self.output_dir, file_uuid_name)
                    with open(file_path, "wb") as f:
                        f.write(att["content"])
                    email_data["attachments"].append({
                        "original_filename": att["filename"],
                        "disk_filename": file_uuid_name,
                        "size_bytes": len(att["content"]),
                        "mime_type": att["mime_type"]
                    })
                    
            # Write metadata file
            meta_path = os.path.join(self.output_dir, f"{email_id}_meta.json")
            with open(meta_path, "w", encoding="utf-8") as f:
                json.dump(email_data, f, indent=2)
                
            print(f"[MOCK EMAIL] Email sent successfully! Saved to {meta_path}")
            return {
                "success": True,
                "message_id": email_id,
                "error": None
            }
        except Exception as e:
            return {
                "success": False,
                "message_id": None,
                "error": str(e)
            }


def get_email_provider() -> EmailProvider:
    """
    Factory function to retrieve the configured email provider.
    Defaults to MockEmailProvider if Google credentials are not fully set up.
    """
    env_provider = os.getenv("EMAIL_PROVIDER", "gmail_oauth").lower()
    
    # If using gmail_oauth, but Google client secrets are missing, fall back to mock
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    
    if env_provider == "gmail_oauth":
        if client_id and client_secret:
            return GmailOAuthProvider()
        else:
            print("Warning: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. Defaulting to MockEmailProvider.")
            return MockEmailProvider()
            
    return MockEmailProvider()
