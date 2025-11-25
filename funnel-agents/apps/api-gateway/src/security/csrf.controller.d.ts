/**
 * CSRF Token Controller
 * Provides CSRF token endpoints for client-side protection
 */
export declare class CsrfController {
    /**
     * Get CSRF token for the current session
     * This endpoint should be called on app initialization
     *
     * @returns CSRF token
     */
    getCsrfToken(req: any, res: any): any;
}
