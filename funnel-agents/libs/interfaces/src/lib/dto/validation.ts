import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom validator: Check if value matches another property
 */
@ValidatorConstraint({ name: 'Match', async: false })
export class MatchConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as Record<string, unknown>)[relatedPropertyName];
    return value === relatedValue;
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName] = args.constraints;
    return `${args.property} must match ${relatedPropertyName}`;
  }
}

export function Match(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: MatchConstraint,
    });
  };
}

/**
 * Custom validator: Check if string is a valid slug
 */
@ValidatorConstraint({ name: 'IsSlug', async: false })
export class IsSlugConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (typeof value !== 'string') return false;
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(value);
  }

  defaultMessage(): string {
    return 'Value must be a valid slug (lowercase letters, numbers, and hyphens only)';
  }
}

export function IsSlug(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsSlugConstraint,
    });
  };
}

/**
 * Custom validator: Check if value is a valid JSON string
 */
@ValidatorConstraint({ name: 'IsJSONString', async: false })
export class IsJSONStringConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (typeof value !== 'string') return false;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'Value must be a valid JSON string';
  }
}

export function IsJSONString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsJSONStringConstraint,
    });
  };
}

/**
 * Custom validator: Check if array has no duplicates
 */
@ValidatorConstraint({ name: 'ArrayUnique', async: false })
export class ArrayUniqueConstraint implements ValidatorConstraintInterface {
  validate(value: unknown[]): boolean {
    if (!Array.isArray(value)) return false;
    return new Set(value).size === value.length;
  }

  defaultMessage(): string {
    return 'Array must not contain duplicate values';
  }
}

export function ArrayUnique(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: ArrayUniqueConstraint,
    });
  };
}

/**
 * Custom validator: Check if date is in the future
 */
@ValidatorConstraint({ name: 'IsFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: Date): boolean {
    if (!(value instanceof Date) || isNaN(value.getTime())) return false;
    return value > new Date();
  }

  defaultMessage(): string {
    return 'Date must be in the future';
  }
}

export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsFutureDateConstraint,
    });
  };
}
