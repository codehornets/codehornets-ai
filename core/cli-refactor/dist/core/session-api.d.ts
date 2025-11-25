/**
 * Session-Based API Client
 *
 * Provides API client for OAuth-authenticated session-based Claude interactions.
 * Uses /v1/sessions endpoints instead of standard /v1/messages for OAuth auth.
 *
 * @module core/session-api
 */
/**
 * Session API configuration
 */
export interface SessionApiConfig {
    baseUrl: string;
    accessToken: string;
    organizationUuid: string;
}
/**
 * Message content in session events
 */
export interface SessionMessage {
    role: 'user' | 'assistant';
    content: string;
}
/**
 * Session event structure
 */
export interface SessionEvent {
    uuid: string;
    session_id: string;
    type: 'user' | 'assistant';
    parent_tool_use_id: string | null;
    message: SessionMessage;
}
/**
 * Session creation response
 */
export interface SessionResponse {
    id: string;
    title?: string;
    session_status?: string;
    session_context?: {
        sources?: Array<{
            type: string;
            url?: string;
            revision?: string;
        }>;
        outcomes?: Array<{
            type: string;
        }>;
        model?: string;
    };
}
/**
 * Stream event types from session API
 */
export interface StreamEvent {
    type: 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_start' | 'message_delta' | 'message_stop' | 'error';
    delta?: {
        type: string;
        text?: string;
    };
    content_block?: {
        type: string;
        text?: string;
    };
    message?: {
        role: string;
        content?: string;
    };
    error?: {
        type: string;
        message: string;
    };
}
/**
 * Environment info for session creation
 */
export interface Environment {
    environment_id: string;
    name: string;
}
/**
 * Gets the organization UUID from stored credentials or fetches from profile API.
 *
 * @param accessToken - OAuth access token
 * @returns Organization UUID or null
 */
export declare function getOrganizationUuid(accessToken: string): Promise<string | null>;
/**
 * Builds the authorization headers for session API requests.
 *
 * @param accessToken - OAuth access token
 * @param orgUuid - Organization UUID
 * @returns Headers object
 */
export declare function buildSessionHeaders(accessToken: string, orgUuid: string): Record<string, string>;
/**
 * Gets available environments for session creation.
 *
 * @param accessToken - OAuth access token
 * @param orgUuid - Organization UUID
 * @returns List of available environments
 */
export declare function getEnvironments(accessToken: string, orgUuid: string): Promise<Environment[]>;
/**
 * Creates a new session for Claude interactions.
 *
 * @param accessToken - OAuth access token
 * @param orgUuid - Organization UUID
 * @param options - Session creation options
 * @returns Session ID or null on failure
 */
export declare function createSession(accessToken: string, orgUuid: string, options?: {
    title?: string;
    model?: string;
    initialMessage?: string;
}): Promise<string | null>;
/**
 * Sends a message to an existing session.
 *
 * @param sessionId - Session ID
 * @param message - Message content
 * @param accessToken - OAuth access token
 * @param orgUuid - Organization UUID
 * @returns True on success
 */
export declare function sendMessage(sessionId: string, message: string, accessToken: string, orgUuid: string): Promise<boolean>;
/**
 * Gets events from a session (for fetching assistant responses).
 *
 * @param sessionId - Session ID
 * @param accessToken - OAuth access token
 * @param orgUuid - Organization UUID
 * @returns Session events
 */
export declare function getSessionEvents(sessionId: string, accessToken: string, orgUuid: string): Promise<SessionEvent[]>;
/**
 * Session API client class for managing OAuth-authenticated sessions.
 */
export declare class SessionApiClient {
    private accessToken;
    private orgUuid;
    private sessionId;
    private model;
    constructor(accessToken: string, model?: string);
    /**
     * Initializes the client by fetching organization UUID.
     */
    initialize(): Promise<boolean>;
    /**
     * Gets or creates a session.
     */
    ensureSession(): Promise<string | null>;
    /**
     * Sends a message and returns the response.
     * This is a simplified implementation that polls for response.
     *
     * @param message - User message
     * @returns Assistant response or null on failure
     */
    chat(message: string): Promise<string | null>;
    /**
     * Gets the current session ID.
     */
    getSessionId(): string | null;
    /**
     * Resets the session (creates new session on next chat).
     */
    resetSession(): void;
}
/**
 * Creates a session API client from stored OAuth credentials.
 *
 * @returns SessionApiClient or null if no credentials
 */
export declare function createSessionClient(model?: string): Promise<SessionApiClient | null>;
export default SessionApiClient;
//# sourceMappingURL=session-api.d.ts.map