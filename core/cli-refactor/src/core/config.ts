/**
 * Configuration management module
 * Handles environment variables, config directories, and AWS region settings
 */

import * as path from 'path';
import * as os from 'os';

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
export const bashMaxOutputLengthValidator: EnvVarValidator = {
  name: 'BASH_MAX_OUTPUT_LENGTH',
  default: 30000,
  validate: (value: string | undefined): ValidationResult => {
    if (!value) {
      return { effective: 30000, status: 'valid' };
    }

    const parsed = parseInt(value, 10);

    if (isNaN(parsed) || parsed <= 0) {
      return {
        effective: 30000,
        status: 'invalid',
        message: `Invalid value "${value}" (using default: 30000)`,
      };
    }

    if (parsed > 150000) {
      return {
        effective: 150000,
        status: 'capped',
        message: `Capped from ${parsed} to 150000`,
      };
    }

    return { effective: parsed, status: 'valid' };
  },
};

/**
 * Validator for CLAUDE_CODE_MAX_OUTPUT_TOKENS environment variable
 */
export const maxOutputTokensValidator: EnvVarValidator = {
  name: 'CLAUDE_CODE_MAX_OUTPUT_TOKENS',
  default: 32000,
  validate: (value: string | undefined): ValidationResult => {
    if (!value) {
      return { effective: 32000, status: 'valid' };
    }

    const parsed = parseInt(value, 10);

    if (isNaN(parsed) || parsed <= 0) {
      return {
        effective: 32000,
        status: 'invalid',
        message: `Invalid value "${value}" (using default: 32000)`,
      };
    }

    if (parsed > 64000) {
      return {
        effective: 64000,
        status: 'capped',
        message: `Capped from ${parsed} to 64000`,
      };
    }

    return { effective: parsed, status: 'valid' };
  },
};

/** Default environment variable validators */
export const defaultValidators: EnvVarValidator[] = [
  bashMaxOutputLengthValidator,
  maxOutputTokensValidator,
];

/**
 * Gets the Claude configuration directory path
 * Uses CLAUDE_CONFIG_DIR environment variable if set, otherwise ~/.claude
 * @returns Path to config directory
 */
export function getConfigDir(): string {
  return process.env.CLAUDE_CONFIG_DIR ?? path.join(os.homedir(), '.claude');
}

/**
 * Parses a boolean-like environment variable value
 * @param value - Value to parse
 * @returns True for truthy values (1, true, yes, on)
 */
export function parseBooleanEnv(value: string | undefined | boolean): boolean {
  if (!value) return false;
  if (typeof value === 'boolean') return value;

  const normalized = value.toLowerCase().trim();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

/**
 * Parses a boolean environment variable as explicitly false
 * @param value - Value to parse
 * @returns True for falsy values (0, false, no, off)
 */
export function isExplicitlyFalse(value: string | undefined | boolean): boolean {
  if (value === undefined) return false;
  if (typeof value === 'boolean') return !value;
  if (!value) return false;

  const normalized = value.toLowerCase().trim();
  return ['0', 'false', 'no', 'off'].includes(normalized);
}

/**
 * Parses environment variable assignments from command line arguments
 * @param envArgs - Array of "KEY=value" strings
 * @returns Object with parsed environment variables
 * @throws Error if format is invalid
 */
export function parseEnvArgs(envArgs: string[] | undefined): Record<string, string> {
  const result: Record<string, string> = {};

  if (!envArgs) return result;

  for (const arg of envArgs) {
    const [key, ...valueParts] = arg.split('=');

    if (!key || valueParts.length === 0) {
      throw new Error(
        `Invalid environment variable format: ${arg}, environment variables should be added as: -e KEY1=value1 -e KEY2=value2`
      );
    }

    result[key] = valueParts.join('=');
  }

  return result;
}

/**
 * Gets the AWS region from environment variables
 * @returns AWS region string
 */
export function getAwsRegion(): string {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
}

/**
 * Gets the Google Cloud ML region from environment variables
 * @returns Cloud ML region string
 */
export function getCloudMlRegion(): string {
  return process.env.CLOUD_ML_REGION || 'us-east5';
}

/**
 * Gets the Vertex AI region for a specific Claude model
 * @param modelName - Name of the Claude model
 * @returns Appropriate Vertex region for the model
 */
export function getVertexRegion(modelName?: string): string {
  const defaultRegion = getCloudMlRegion();

  if (!modelName) return defaultRegion;

  // Haiku models
  if (modelName.startsWith('claude-haiku-4-5')) {
    return process.env.VERTEX_REGION_CLAUDE_HAIKU_4_5 || defaultRegion;
  }
  if (modelName.startsWith('claude-3-5-haiku')) {
    return process.env.VERTEX_REGION_CLAUDE_3_5_HAIKU || defaultRegion;
  }

  // Sonnet models
  if (modelName.startsWith('claude-3-5-sonnet')) {
    return process.env.VERTEX_REGION_CLAUDE_3_5_SONNET || defaultRegion;
  }
  if (modelName.startsWith('claude-3-7-sonnet')) {
    return process.env.VERTEX_REGION_CLAUDE_3_7_SONNET || defaultRegion;
  }
  if (modelName.startsWith('claude-sonnet-4-5')) {
    return process.env.VERTEX_REGION_CLAUDE_4_5_SONNET || defaultRegion;
  }
  if (modelName.startsWith('claude-sonnet-4')) {
    return process.env.VERTEX_REGION_CLAUDE_4_0_SONNET || defaultRegion;
  }

  // Opus models
  if (modelName.startsWith('claude-opus-4-1')) {
    return process.env.VERTEX_REGION_CLAUDE_4_1_OPUS || defaultRegion;
  }
  if (modelName.startsWith('claude-opus-4')) {
    return process.env.VERTEX_REGION_CLAUDE_4_0_OPUS || defaultRegion;
  }

  return defaultRegion;
}

/**
 * Checks if the bash tool should maintain the project working directory
 * @returns True if CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR is set to a truthy value
 */
export function shouldMaintainWorkingDir(): boolean {
  return parseBooleanEnv(process.env.CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR);
}

/**
 * Gets the context window size for a model string
 * @param modelString - Model identifier string
 * @returns Context window size in tokens
 */
export function getContextWindow(modelString: string): number {
  // Check for 1M context models
  if (modelString.includes('[1m]')) {
    return 1_000_000;
  }
  return 200_000;
}

/** Default conversation token limit */
export const DEFAULT_CONVERSATION_TOKEN_LIMIT = 20_000;

/**
 * Type for allowed setting sources
 */
export type SettingSource =
  | 'userSettings'
  | 'projectSettings'
  | 'localSettings'
  | 'flagSettings'
  | 'policySettings';

/** Default allowed setting sources */
export const DEFAULT_ALLOWED_SETTING_SOURCES: SettingSource[] = [
  'userSettings',
  'projectSettings',
  'localSettings',
  'flagSettings',
  'policySettings',
];

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
export function getConfig(): Config {
  return {
    configDir: getConfigDir(),
    awsRegion: getAwsRegion(),
    cloudMlRegion: getCloudMlRegion(),
    maintainWorkingDir: shouldMaintainWorkingDir(),
  };
}

/**
 * Validates an environment variable using a validator
 * @param validator - Validator to use
 * @returns Validation result
 */
export function validateEnvVar(validator: EnvVarValidator): ValidationResult {
  const value = process.env[validator.name];
  return validator.validate(value);
}

/**
 * Gets the effective value for an environment variable
 * @param validator - Validator to use
 * @returns Effective value after validation
 */
export function getEffectiveValue(validator: EnvVarValidator): number {
  return validateEnvVar(validator).effective;
}

/**
 * Validates all configured environment variables
 * @param validators - Array of validators to run
 * @returns Map of variable names to validation results
 */
export function validateAllEnvVars(
  validators: EnvVarValidator[] = defaultValidators
): Map<string, ValidationResult> {
  const results = new Map<string, ValidationResult>();

  for (const validator of validators) {
    results.set(validator.name, validateEnvVar(validator));
  }

  return results;
}
