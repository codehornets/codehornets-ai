/**
 * Cryptographic utility functions
 */
/**
 * Generate a random UUID v4
 */
export declare function generateUUID(): string;
/**
 * Generate a secure random string
 */
export declare function generateSecureToken(length?: number): string;
/**
 * Generate a URL-safe random string
 */
export declare function generateUrlSafeToken(length?: number): string;
/**
 * Hash a string using SHA-256
 */
export declare function sha256(data: string): string;
/**
 * Hash a string using SHA-512
 */
export declare function sha512(data: string): string;
/**
 * Hash a string using MD5 (not recommended for security, only for checksums)
 */
export declare function md5(data: string): string;
/**
 * Create HMAC signature
 */
export declare function hmacSign(data: string, secret: string, algorithm?: string): string;
/**
 * Verify HMAC signature
 */
export declare function hmacVerify(data: string, signature: string, secret: string, algorithm?: string): boolean;
/**
 * Encrypt data using AES-256-GCM
 */
export declare function encrypt(plaintext: string, key: string): string;
/**
 * Decrypt data using AES-256-GCM
 */
export declare function decrypt(ciphertext: string, key: string): string;
/**
 * Generate a random OTP code
 */
export declare function generateOTP(length?: number): string;
/**
 * Hash password using PBKDF2
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Verify password against hash
 */
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
