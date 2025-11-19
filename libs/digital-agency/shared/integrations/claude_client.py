"""
Anthropic Claude AI client.

Provides interface for interacting with Claude API for text generation,
analysis, and agent-specific tasks.
"""

from typing import Any, Dict, List, Optional, Union
from datetime import datetime

from anthropic import Anthropic, AsyncAnthropic
from pydantic import BaseModel

from config.settings import get_settings
from config.api_keys import get_api_key_manager
from core.logger import get_logger


class ClaudeMessage(BaseModel):
    """Represents a message in Claude conversation."""

    role: str  # "user" or "assistant"
    content: str


class ClaudeResponse(BaseModel):
    """Represents a response from Claude."""

    content: str
    model: str
    stop_reason: Optional[str] = None
    usage: Dict[str, int] = {}
    metadata: Dict[str, Any] = {}


class ClaudeClient:
    """
    Client for Anthropic Claude API.

    Provides methods for text generation, analysis, and multi-turn conversations
    with Claude AI models.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ):
        """
        Initialize Claude client.

        Args:
            api_key: Anthropic API key (uses settings if None)
            model: Model to use (uses settings if None)
            temperature: Temperature parameter
            max_tokens: Maximum tokens in response
        """
        self.settings = get_settings()
        self.logger = get_logger("claude_client")

        # Get API key
        if api_key:
            self.api_key = api_key
        else:
            key_manager = get_api_key_manager()
            self.api_key = key_manager.get_key("anthropic")

        # Model settings
        self.model = model or self.settings.claude_model
        self.temperature = temperature or self.settings.claude_temperature
        self.max_tokens = max_tokens or self.settings.claude_max_tokens

        # Initialize clients
        self.client = Anthropic(api_key=self.api_key)
        self.async_client = AsyncAnthropic(api_key=self.api_key)

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs,
    ) -> ClaudeResponse:
        """
        Generate text from prompt.

        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            temperature: Temperature override
            max_tokens: Max tokens override
            **kwargs: Additional parameters

        Returns:
            ClaudeResponse: Response from Claude
        """
        try:
            messages = [{"role": "user", "content": prompt}]

            response = self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens or self.max_tokens,
                temperature=temperature or self.temperature,
                system=system_prompt or "",
                messages=messages,
                **kwargs,
            )

            return ClaudeResponse(
                content=response.content[0].text,
                model=response.model,
                stop_reason=response.stop_reason,
                usage={
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                },
            )

        except Exception as e:
            self.logger.error(f"Claude generation failed: {e}")
            raise

    async def generate_async(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs,
    ) -> ClaudeResponse:
        """
        Generate text asynchronously.

        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            temperature: Temperature override
            max_tokens: Max tokens override
            **kwargs: Additional parameters

        Returns:
            ClaudeResponse: Response from Claude
        """
        try:
            messages = [{"role": "user", "content": prompt}]

            response = await self.async_client.messages.create(
                model=self.model,
                max_tokens=max_tokens or self.max_tokens,
                temperature=temperature or self.temperature,
                system=system_prompt or "",
                messages=messages,
                **kwargs,
            )

            return ClaudeResponse(
                content=response.content[0].text,
                model=response.model,
                stop_reason=response.stop_reason,
                usage={
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                },
            )

        except Exception as e:
            self.logger.error(f"Claude async generation failed: {e}")
            raise

    def chat(
        self,
        messages: List[ClaudeMessage],
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs,
    ) -> ClaudeResponse:
        """
        Multi-turn conversation with Claude.

        Args:
            messages: List of conversation messages
            system_prompt: Optional system prompt
            temperature: Temperature override
            max_tokens: Max tokens override
            **kwargs: Additional parameters

        Returns:
            ClaudeResponse: Response from Claude
        """
        try:
            formatted_messages = [
                {"role": msg.role, "content": msg.content} for msg in messages
            ]

            response = self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens or self.max_tokens,
                temperature=temperature or self.temperature,
                system=system_prompt or "",
                messages=formatted_messages,
                **kwargs,
            )

            return ClaudeResponse(
                content=response.content[0].text,
                model=response.model,
                stop_reason=response.stop_reason,
                usage={
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                },
            )

        except Exception as e:
            self.logger.error(f"Claude chat failed: {e}")
            raise

    async def chat_async(
        self,
        messages: List[ClaudeMessage],
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs,
    ) -> ClaudeResponse:
        """
        Multi-turn conversation asynchronously.

        Args:
            messages: List of conversation messages
            system_prompt: Optional system prompt
            temperature: Temperature override
            max_tokens: Max tokens override
            **kwargs: Additional parameters

        Returns:
            ClaudeResponse: Response from Claude
        """
        try:
            formatted_messages = [
                {"role": msg.role, "content": msg.content} for msg in messages
            ]

            response = await self.async_client.messages.create(
                model=self.model,
                max_tokens=max_tokens or self.max_tokens,
                temperature=temperature or self.temperature,
                system=system_prompt or "",
                messages=formatted_messages,
                **kwargs,
            )

            return ClaudeResponse(
                content=response.content[0].text,
                model=response.model,
                stop_reason=response.stop_reason,
                usage={
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                },
            )

        except Exception as e:
            self.logger.error(f"Claude async chat failed: {e}")
            raise

    def analyze_text(
        self,
        text: str,
        analysis_type: str,
        instructions: Optional[str] = None,
    ) -> str:
        """
        Analyze text with specific instructions.

        Args:
            text: Text to analyze
            analysis_type: Type of analysis (sentiment, summary, etc.)
            instructions: Additional instructions

        Returns:
            str: Analysis result
        """
        system_prompt = f"""You are analyzing text for {analysis_type}.
{instructions or ''}
Provide clear, structured analysis."""

        prompt = f"Analyze the following text:\n\n{text}"

        response = self.generate(prompt, system_prompt=system_prompt)
        return response.content

    def extract_data(
        self,
        text: str,
        schema: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Extract structured data from text.

        Args:
            text: Text to extract from
            schema: Expected data schema

        Returns:
            Dict: Extracted data
        """
        system_prompt = """You extract structured data from text.
Return ONLY valid JSON matching the provided schema."""

        prompt = f"""Extract data matching this schema:
{schema}

From this text:
{text}"""

        response = self.generate(
            prompt,
            system_prompt=system_prompt,
            temperature=0.3,
        )

        # Parse JSON response
        import json
        try:
            return json.loads(response.content)
        except json.JSONDecodeError:
            self.logger.warning("Failed to parse JSON response")
            return {}
