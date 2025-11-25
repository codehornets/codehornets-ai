import { ValidationOptions, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
/**
 * Custom validator: Check if value matches another property
 */
export declare class MatchConstraint implements ValidatorConstraintInterface {
    validate(value: unknown, args: ValidationArguments): boolean;
    defaultMessage(args: ValidationArguments): string;
}
export declare function Match(property: string, validationOptions?: ValidationOptions): (object: object, propertyName: string) => void;
/**
 * Custom validator: Check if string is a valid slug
 */
export declare class IsSlugConstraint implements ValidatorConstraintInterface {
    validate(value: string): boolean;
    defaultMessage(): string;
}
export declare function IsSlug(validationOptions?: ValidationOptions): (object: object, propertyName: string) => void;
/**
 * Custom validator: Check if value is a valid JSON string
 */
export declare class IsJSONStringConstraint implements ValidatorConstraintInterface {
    validate(value: string): boolean;
    defaultMessage(): string;
}
export declare function IsJSONString(validationOptions?: ValidationOptions): (object: object, propertyName: string) => void;
/**
 * Custom validator: Check if array has no duplicates
 */
export declare class ArrayUniqueConstraint implements ValidatorConstraintInterface {
    validate(value: unknown[]): boolean;
    defaultMessage(): string;
}
export declare function ArrayUnique(validationOptions?: ValidationOptions): (object: object, propertyName: string) => void;
/**
 * Custom validator: Check if date is in the future
 */
export declare class IsFutureDateConstraint implements ValidatorConstraintInterface {
    validate(value: Date): boolean;
    defaultMessage(): string;
}
export declare function IsFutureDate(validationOptions?: ValidationOptions): (object: object, propertyName: string) => void;
