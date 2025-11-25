export declare enum AuditAction {
    LOGIN = "login",
    LOGOUT = "logout",
    REGISTER = "register",
    PASSWORD_CHANGE = "password_change",
    PASSWORD_RESET_REQUEST = "password_reset_request",
    PASSWORD_RESET_COMPLETE = "password_reset_complete",
    PROFILE_UPDATE = "profile_update",
    TOKEN_REFRESH = "token_refresh",
    FAILED_LOGIN = "failed_login",
    ACCOUNT_LOCKED = "account_locked",
    ACCOUNT_UNLOCKED = "account_unlocked"
}
export declare class AuditLog {
    id: string;
    user_id?: string;
    email: string;
    action: AuditAction;
    ip_address?: string;
    user_agent?: string;
    metadata?: Record<string, unknown>;
    success: boolean;
    error_message?: string;
    created_at: Date;
}
