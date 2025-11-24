/**
 * Session-Based API Client
 *
 * Provides API client for OAuth-authenticated session-based Claude interactions.
 * Uses /v1/sessions endpoints instead of standard /v1/messages for OAuth auth.
 *
 * @module core/session-api
 */
import { randomUUID } from 'crypto';
import { readCredentials, getOAuthConfig } from './auth.js';
/**
 * Gets the organization UUID from stored credentials or fetches from profile API.
 *
 * @param accessToken - OAuth access token
 * @returns Organization UUID or null
 */
export async function getOrganizationUuid(accessToken) {
    const credentials = readCredentials();
    // Check if we have it cached
    if (credentials.oauthAccount?.organizationUuid) {
        return credentials.oauthAccount.organizationUuid;
    }
    // Fetch from profile API
    try {
        const config = getOAuthConfig();
        const profileUrl = `${config.BASE_API_URL}/api/oauth/claude_cli/profile`;
        const response = await fetch(profileUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            console.error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
            return null;
        }
        const data = await response.json();
        return data.organization?.uuid ?? null;
    }
    catch (error) {
        console.error('Failed to get organization UUID:', error);
        return null;
    }
}
/**
 * Builds the authorization headers for session API requests.
 *
 * @param accessToken - OAuth access token
 * @param orgUuid - Organization UUID
 * @returns Headers object
 */
export function buildSessionHeaders(accessToken, orgUuid) {
    return {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-organization-uuid': orgUuid,
    };
}
/**
 * Gets available environments for session creation.
 *
 * @param accessToken - OAuth access token
 * @param orgUuid - Organization UUID
 * @returns List of available environments
 */
export async function getEnvironments(accessToken, orgUuid) {
    const config = getOAuthConfig();
    const url = `${config.BASE_API_URL}/v1/environments`;
    const headers = buildSessionHeaders(accessToken, orgUuid);
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            console.error(`Failed to fetch environments: ${response.status}`);
            return [];
        }
        const data = await response.json();
        return data.data ?? [];
    }
    catch (error) {
        console.error('Failed to get environments:', error);
        return [];
    }
}
/**
 * Creates a new session for Claude interactions.
 *
 * @param accessToken - OAuth access token
 * @param orgUuid - Organization UUID
 * @param options - Session creation options
 * @returns Session ID or null on failure
 */
export async function createSession(accessToken, orgUuid, options = {}) {
    const config = getOAuthConfig();
    const url = `${config.BASE_API_URL}/v1/sessions`;
    const headers = buildSessionHeaders(accessToken, orgUuid);
    // Get environment
    const environments = await getEnvironments(accessToken, orgUuid);
    if (environments.length === 0) {
        console.error('No environments available for session creation');
        return null;
    }
    const firstEnv = environments[0];
    if (!firstEnv) {
        console.error('No environments available for session creation');
        return null;
    }
    const environmentId = firstEnv.environment_id;
    // Build session payload
    const sessionContext = {
        sources: [],
        outcomes: [],
        model: options.model ?? 'claude-sonnet-4-20250514',
    };
    const events = options.initialMessage
        ? [
            {
                type: 'event',
                data: {
                    uuid: randomUUID(),
                    session_id: '',
                    type: 'user',
                    parent_tool_use_id: null,
                    message: {
                        role: 'user',
                        content: options.initialMessage,
                    },
                },
            },
        ]
        : [];
    const payload = {
        title: options.title ?? 'Claude Code Session',
        events,
        session_context: sessionContext,
        environment_id: environmentId,
    };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to create session: ${response.status} ${errorText}`);
            return null;
        }
        const data = await response.json();
        return data.id;
    }
    catch (error) {
        console.error('Failed to create session:', error);
        return null;
    }
}
/**
 * Sends a message to an existing session.
 *
 * @param sessionId - Session ID
 * @param message - Message content
 * @param accessToken - OAuth access token
 * @param orgUuid - Organization UUID
 * @returns True on success
 */
export async function sendMessage(sessionId, message, accessToken, orgUuid) {
    const config = getOAuthConfig();
    const url = `${config.BASE_API_URL}/v1/sessions/${sessionId}/events`;
    const headers = buildSessionHeaders(accessToken, orgUuid);
    const payload = {
        events: [
            {
                uuid: randomUUID(),
                session_id: sessionId,
                type: 'user',
                parent_tool_use_id: null,
                message: {
                    role: 'user',
                    content: message,
                },
            },
        ],
    };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });
        return response.ok;
    }
    catch (error) {
        console.error('Failed to send message:', error);
        return false;
    }
}
/**
 * Gets events from a session (for fetching assistant responses).
 *
 * @param sessionId - Session ID
 * @param accessToken - OAuth access token
 * @param orgUuid - Organization UUID
 * @returns Session events
 */
export async function getSessionEvents(sessionId, accessToken, orgUuid) {
    const config = getOAuthConfig();
    const url = `${config.BASE_API_URL}/v1/sessions/${sessionId}/events`;
    const headers = buildSessionHeaders(accessToken, orgUuid);
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            console.error(`Failed to fetch events: ${response.status}`);
            return [];
        }
        const data = await response.json();
        return data.data ?? [];
    }
    catch (error) {
        console.error('Failed to get session events:', error);
        return [];
    }
}
/**
 * Session API client class for managing OAuth-authenticated sessions.
 */
export class SessionApiClient {
    accessToken;
    orgUuid = null;
    sessionId = null;
    model;
    constructor(accessToken, model = 'claude-sonnet-4-20250514') {
        this.accessToken = accessToken;
        this.model = model;
    }
    /**
     * Initializes the client by fetching organization UUID.
     */
    async initialize() {
        this.orgUuid = await getOrganizationUuid(this.accessToken);
        return this.orgUuid !== null;
    }
    /**
     * Gets or creates a session.
     */
    async ensureSession() {
        if (this.sessionId) {
            return this.sessionId;
        }
        if (!this.orgUuid) {
            const initialized = await this.initialize();
            if (!initialized) {
                return null;
            }
        }
        this.sessionId = await createSession(this.accessToken, this.orgUuid, { model: this.model });
        return this.sessionId;
    }
    /**
     * Sends a message and returns the response.
     * This is a simplified implementation that polls for response.
     *
     * @param message - User message
     * @returns Assistant response or null on failure
     */
    async chat(message) {
        const sessionId = await this.ensureSession();
        if (!sessionId || !this.orgUuid) {
            return null;
        }
        // Send the message
        const sent = await sendMessage(sessionId, message, this.accessToken, this.orgUuid);
        if (!sent) {
            return null;
        }
        // Poll for response (simple implementation)
        // In production, this should use streaming or webhooks
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds timeout
        const pollInterval = 1000; // 1 second
        while (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            const events = await getSessionEvents(sessionId, this.accessToken, this.orgUuid);
            // Find the latest assistant message after our user message
            const assistantMessages = events.filter((e) => e.type === 'assistant' && e.message.role === 'assistant');
            if (assistantMessages.length > 0) {
                const lastMessage = assistantMessages[assistantMessages.length - 1];
                if (lastMessage) {
                    return lastMessage.message.content;
                }
            }
            attempts++;
        }
        console.error('Timeout waiting for assistant response');
        return null;
    }
    /**
     * Gets the current session ID.
     */
    getSessionId() {
        return this.sessionId;
    }
    /**
     * Resets the session (creates new session on next chat).
     */
    resetSession() {
        this.sessionId = null;
    }
}
/**
 * Creates a session API client from stored OAuth credentials.
 *
 * @returns SessionApiClient or null if no credentials
 */
export async function createSessionClient(model) {
    const credentials = readCredentials();
    if (!credentials.oauthTokens?.accessToken) {
        return null;
    }
    const client = new SessionApiClient(credentials.oauthTokens.accessToken, model);
    const initialized = await client.initialize();
    if (!initialized) {
        return null;
    }
    return client;
}
export default SessionApiClient;
//# sourceMappingURL=session-api.js.map