/**
 * Configuration management module
 * Handles environment variables, config directories, and AWS region settings
 */
/** Environment variable validation status */
export type ValidationStatus = 'valid' | 'invalid' | 'capped';
/** Environment variable validation result */
export interface ValidationResult {
    /** The effective value to use */
    effective: number;
    /** Validation status */
    status: ValidationStatus;
    /** Optional message describing the validation result */
    message?: string;
}
/** Environment variable validator definition */
export interface EnvVarValidator {
    /** Name of the environment variable */
    name: string;
    /** Default value if not set */
    default: number;
    /** Validation function */
    validate: (value: string | undefined) => ValidationResult;
}
/**
 * Validator for BASH_MAX_OUTPUT_LENGTH environment variable
 */
export declare const bashMaxOutputLengthValidator: EnvVarValidator;
/**
 * Validator for CLAUDE_CODE_MAX_OUTPUT_TOKENS environment variable
 */
export declare const maxOutputTokensValidator: EnvVarValidator;
/** Default environment variable validators */
export declare const defaultValidators: EnvVarValidator[];
/**
 * Gets the Claude configuration directory path
 * Uses CLAUDE_CONFIG_DIR environment variable if set, otherwise ~/.claude
 * @returns Path to config directory
 */
export declare function getConfigDir(): string;
/**
 * Parses a boolean-like environment variable value
 * @param value - Value to parse
 * @returns True for truthy values (1, true, yes, on)
 */
export declare function parseBooleanEnv(value: string | undefined | boolean): boolean;
/**
 * Parses a boolean environment variable as explicitly false
 * @param value - Value to parse
 * @returns True for falsy values (0, false, no, off)
 */
export declare function isExplicitlyFalse(value: string | undefined | boolean): boolean;
/**
 * Parses environment variable assignments from command line arguments
 * @param envArgs - Array of "KEY=value" strings
 * @returns Object with parsed environment variables
 * @throws Error if format is invalid
 */
export declare function parseEnvArgs(envArgs: string[] | undefined): Record<string, string>;
/**
 * Gets the AWS region from environment variables
 * @returns AWS region string
 */
export declare function getAwsRegion(): string;
/**
 * Gets the Google Cloud ML region from environment variables
 * @returns Cloud ML region string
 */
export declare function getCloudMlRegion(): string;
/**
 * Gets the Vertex AI region for a specific Claude model
 * @param modelName - Name of the Claude model
 * @returns Appropriate Vertex region for the model
 */
export declare function getVertexRegion(modelName?: string): string;
/**
 * Checks if the bash tool should maintain the project working directory
 * @returns True if CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR is set to a truthy value
 */
export declare function shouldMaintainWorkingDir(): boolean;
/**
 * Gets the context window size for a model string
 * @param modelString - Model identifier string
 * @returns Context window size in tokens
 */
export declare function getContextWindow(modelString: string): number;
/** Default conversation token limit */
export declare const DEFAULT_CONVERSATION_TOKEN_LIMIT = 20000;
/**
 * Type for allowed setting sources
 */
export type SettingSource = 'userSettings' | 'projectSettings' | 'localSettings' | 'flagSettings' | 'policySettings';
/** Default allowed setting sources */
export declare const DEFAULT_ALLOWED_SETTING_SOURCES: SettingSource[];
/**
 * Configuration object type
 */
export interface Config {
    /** Configuration directory path */
    configDir: string;
    /** AWS region */
    awsRegion: string;
    /** Cloud ML region */
    cloudMlRegion: string;
    /** Whether to maintain working directory */
    maintainWorkingDir: boolean;
}
/**
 * Gets the current configuration
 * @returns Configuration object
 */
export declare function getConfig(): Config;
/**
 * Validates an environment variable using a validator
 * @param validator - Validator to use
 * @returns Validation result
 */
export declare function validateEnvVar(validator: EnvVarValidator): ValidationResult;
/**
 * Gets the effective value for an environment variable
 * @param validator - Validator to use
 * @returns Effective value after validation
 */
export declare function getEffectiveValue(validator: EnvVarValidator): number;
/**
 * Validates all configured environment variables
 * @param validators - Array of validators to run
 * @returns Map of variable names to validation results
 */
export declare function validateAllEnvVars(validators?: EnvVarValidator[]): Map<string, ValidationResult>;
//# sourceMappingURL=config.d.ts.map