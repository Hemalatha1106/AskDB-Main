import os
from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
import litellm
from cryptography.fernet import Fernet
import base64
import hashlib
from app.utils.helper import load_env

# Ensure env variables are loaded
load_env()

# Custom Exceptions for clean backend handling
class AIProviderError(Exception):
    pass

class InvalidAPIKeyError(AIProviderError):
    pass

class ModelUnavailableError(AIProviderError):
    pass


def get_encryption_key() -> bytes:
    key = os.getenv("ENCRYPTION_KEY")
    if not key:
        # Dynamically append ENCRYPTION_KEY to .env to make it persistent
        key = Fernet.generate_key().decode()
        try:
            env_path = ".env"
            needs_newline = False
            if os.path.exists(env_path):
                with open(env_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    if content and not content.endswith("\n"):
                        needs_newline = True
            
            with open(env_path, "a", encoding="utf-8") as f:
                if needs_newline:
                    f.write("\n")
                f.write(f"ENCRYPTION_KEY={key}\n")
            os.environ["ENCRYPTION_KEY"] = key
        except Exception as e:
            print(f"Warning: Failed to persist encryption key to .env: {e}")
            # Fallback to a stable derived key
            default_salt = os.getenv("GEMINI_API_KEY") or os.getenv("gemini_api_key") or "askdb_default_salt"
            key = base64.urlsafe_b64encode(hashlib.sha256(default_salt.encode()).digest()).decode()
    return key.encode()

def encrypt_key(plain_text: str) -> str:
    if not plain_text:
        return ""
    f = Fernet(get_encryption_key())
    return f.encrypt(plain_text.encode()).decode()

def decrypt_key(cipher_text: str) -> str:
    if not cipher_text:
        return ""
    f = Fernet(get_encryption_key())
    return f.decrypt(cipher_text.encode()).decode()


class AIProvider(ABC):
    @abstractmethod
    def generate(self, prompt: str, system_instruction: Optional[str] = None, temperature: float = 0.0) -> str:
        pass


class LiteLLMProvider(AIProvider):
    def __init__(self, provider: str, api_key: str, model: str, temperature: float = 0.0, max_tokens: Optional[int] = None, fallback_models: Optional[List[str]] = None):
        self.provider = provider.lower()
        self.api_key = api_key
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.fallback_models = fallback_models or []

    def generate(self, prompt: str, system_instruction: Optional[str] = None, temperature: float = 0.0) -> str:
        models_to_try = [self.model] + self.fallback_models
        models_to_try = list(dict.fromkeys(models_to_try))
        
        last_error = None
        for m in models_to_try:
            messages = []
            if system_instruction:
                messages.append({"role": "system", "content": system_instruction})
            messages.append({"role": "user", "content": prompt})

            full_model = m
            if "/" not in full_model:
                prefix_map = {
                    "gemini": "gemini",
                    "google": "gemini",
                    "openai": "openai",
                    "anthropic": "anthropic",
                    "groq": "groq",
                    "fireworks": "fireworks",
                }
                prefix = prefix_map.get(self.provider, self.provider)
                full_model = f"{prefix}/{m}"

            kwargs = {
                "model": full_model,
                "messages": messages,
                "temperature": temperature if temperature != 0.0 else self.temperature,
                "api_key": self.api_key
            }
            if self.max_tokens:
                kwargs["max_tokens"] = self.max_tokens

            try:
                response = litellm.completion(**kwargs)
                return response.choices[0].message.content
            except litellm.exceptions.AuthenticationError as e:
                raise InvalidAPIKeyError(f"Authentication failed for provider '{self.provider}' using your API key. Details: {e}") from e
            except (litellm.exceptions.NotFoundError, litellm.exceptions.BadRequestError) as e:
                print(f"Warning: Model '{m}' failed with error: {e}. Trying fallback...")
                last_error = ModelUnavailableError(f"Model '{m}' is unavailable or not supported. Details: {e}")
            except Exception as e:
                err_msg = str(e).lower()
                if "api key" in err_msg or "apikey" in err_msg or "unauthorized" in err_msg or "forbidden" in err_msg or "401" in err_msg or "403" in err_msg:
                    raise InvalidAPIKeyError(f"Invalid API key detected for provider '{self.provider}': {e}") from e
                
                print(f"Warning: Model '{m}' failed with error: {e}. Trying fallback...")
                last_error = AIProviderError(f"AI generation failed: {e}")
                
        if last_error:
            raise last_error
        raise AIProviderError("All models failed to generate content.")


class GeminiProvider(LiteLLMProvider):
    def __init__(self, api_key: str, model: str = "gemini-3.5-flash", temperature: float = 0.0, max_tokens: Optional[int] = None, fallback_models: Optional[List[str]] = None):
        super().__init__("gemini", api_key, model, temperature, max_tokens, fallback_models)


class OpenAIProvider(LiteLLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o-mini", temperature: float = 0.0, max_tokens: Optional[int] = None, fallback_models: Optional[List[str]] = None):
        super().__init__("openai", api_key, model, temperature, max_tokens, fallback_models)


class AnthropicProvider(LiteLLMProvider):
    def __init__(self, api_key: str, model: str = "claude-3-5-haiku-latest", temperature: float = 0.0, max_tokens: Optional[int] = None, fallback_models: Optional[List[str]] = None):
        super().__init__("anthropic", api_key, model, temperature, max_tokens, fallback_models)


def get_user_provider(user_id: Optional[int] = None, default_model: str = "gemini-3.5-flash") -> AIProvider:
    """
    Returns an AIProvider instance. If user_id has custom settings enabled, uses the personal provider.
    Otherwise, falls back to the platform default (Gemini using default API key).
    """
    if user_id:
        from app.database.system_db import get_user_ai_settings
        try:
            settings = get_user_ai_settings(user_id)
            if settings and settings.get("use_personal_key") and settings.get("encrypted_api_key"):
                decrypted_key = decrypt_key(settings["encrypted_api_key"])
                provider_name = settings.get("provider", "gemini").lower()
                model_name = settings.get("model") or default_model
                
                # For user custom keys, we don't apply cross-model fallbacks unless configured.
                if provider_name in ("gemini", "google"):
                    return GeminiProvider(api_key=decrypted_key, model=model_name)
                elif provider_name == "openai":
                    return OpenAIProvider(api_key=decrypted_key, model=model_name)
                elif provider_name == "anthropic":
                    return AnthropicProvider(api_key=decrypted_key, model=model_name)
                else:
                    return LiteLLMProvider(provider=provider_name, api_key=decrypted_key, model=model_name)
        except Exception as e:
            print(f"Error loading personal AI settings for user {user_id}: {e}. Falling back to default.")

    # Fallback to default platform provider
    platform_key = os.getenv("GEMINI_API_KEY") or os.getenv("gemini_api_key")
    if not platform_key:
        raise ValueError("Platform default GEMINI_API_KEY is not configured in the environment.")
    
    # Platform default gets fallbacks
    fallback_models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3.1-flash-lite']
    return GeminiProvider(api_key=platform_key, model=default_model, fallback_models=fallback_models)
