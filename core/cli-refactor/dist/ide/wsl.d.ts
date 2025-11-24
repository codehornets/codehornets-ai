/**
 * WSL Path Conversion Utilities
 *
 * Handles path conversion between Windows and WSL (Windows Subsystem for Linux).
 * Provides bidirectional path translation for IDE integration in WSL environments.
 */
/**
 * WSL path converter for translating paths between Windows and Linux formats.
 *
 * @example
 * ```typescript
 * const converter = new WslPathConverter('Ubuntu');
 * const linuxPath = converter.toLocalPath('C:\\Users\\user\\project');
 * // Returns: /mnt/c/Users/user/project
 *
 * const windowsPath = converter.toIdePath('/home/user/project');
 * // Returns: \\\\wsl.localhost\\Ubuntu\\home\\user\\project
 * ```
 */
export declare class WslPathConverter {
    private readonly wslDistroName;
    /**
     * Creates a new WSL path converter.
     *
     * @param wslDistroName - The name of the WSL distribution (e.g., "Ubuntu", "Debian")
     */
    constructor(wslDistroName?: string);
    /**
     * Converts a Windows path to a WSL (Linux) path.
     *
     * Uses the `wslpath` utility when available, falling back to manual conversion.
     * Handles UNC paths (\\\\wsl.localhost\\...) and standard Windows paths.
     *
     * @param windowsPath - The Windows path to convert
     * @returns The converted Linux path, or the original path if conversion fails
     *
     * @example
     * ```typescript
     * converter.toLocalPath('C:\\Users\\user\\project');
     * // Returns: /mnt/c/Users/user/project
     *
     * converter.toLocalPath('\\\\wsl.localhost\\Ubuntu\\home\\user');
     * // Returns: /home/user (if distro matches)
     * ```
     */
    toLocalPath(windowsPath: string | undefined): string | undefined;
    /**
     * Converts a WSL (Linux) path to a Windows path.
     *
     * Uses the `wslpath` utility when available.
     *
     * @param linuxPath - The Linux path to convert
     * @returns The converted Windows path, or the original path if conversion fails
     *
     * @example
     * ```typescript
     * converter.toIdePath('/mnt/c/Users/user/project');
     * // Returns: C:\Users\user\project
     *
     * converter.toIdePath('/home/user/project');
     * // Returns: \\wsl.localhost\Ubuntu\home\user\project
     * ```
     */
    toIdePath(linuxPath: string | undefined): string | undefined;
}
/**
 * Checks if a path belongs to the specified WSL distribution.
 *
 * @param path - The path to check (Windows UNC format)
 * @param distroName - The expected WSL distribution name
 * @returns True if the path is not a WSL path or belongs to the specified distro
 *
 * @example
 * ```typescript
 * isPathForDistro('\\\\wsl.localhost\\Ubuntu\\home', 'Ubuntu'); // true
 * isPathForDistro('\\\\wsl.localhost\\Debian\\home', 'Ubuntu'); // false
 * isPathForDistro('C:\\Users\\user', 'Ubuntu'); // true (not a WSL path)
 * ```
 */
export declare function isPathForDistro(path: string, distroName: string): boolean;
/**
 * Gets the Windows USERPROFILE path from within WSL.
 *
 * Executes PowerShell to retrieve the Windows user profile directory.
 *
 * @returns The Windows USERPROFILE path, or undefined if unable to retrieve
 *
 * @example
 * ```typescript
 * const profile = getWindowsUserProfile();
 * // Returns: 'C:\\Users\\username'
 * ```
 */
export declare function getWindowsUserProfile(): string | undefined;
/**
 * Gets the WSL host IP address for connecting to Windows services.
 *
 * In WSL2, the Windows host is accessible via the default gateway IP.
 * This function retrieves that IP address.
 *
 * @returns The host IP address, or '127.0.0.1' as fallback
 *
 * @example
 * ```typescript
 * const host = getWslHostIp();
 * // Returns: '172.x.x.1' (WSL2) or '127.0.0.1' (fallback)
 * ```
 */
export declare function getWslHostIp(): string;
//# sourceMappingURL=wsl.d.ts.map