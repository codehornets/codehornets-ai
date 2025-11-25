/**
 * Base value object class
 */
export declare abstract class ValueObject<T> {
    protected readonly props: T;
    constructor(props: T);
    equals(vo?: ValueObject<T>): boolean;
}
/**
 * Unique identifier value object
 */
export declare class UniqueId extends ValueObject<{
    value: string;
}> {
    private constructor();
    get value(): string;
    static create(id?: string): UniqueId;
    static fromString(id: string): UniqueId;
    toString(): string;
}
/**
 * Email value object with validation
 */
export declare class Email extends ValueObject<{
    value: string;
}> {
    private constructor();
    get value(): string;
    static create(email: string): Email;
    static isValid(email: string): boolean;
}
/**
 * Money value object
 */
export declare class Money extends ValueObject<{
    amount: number;
    currency: string;
}> {
    private constructor();
    get amount(): number;
    get currency(): string;
    static create(amount: number, currency?: string): Money;
    add(money: Money): Money;
    subtract(money: Money): Money;
    multiply(factor: number): Money;
}
/**
 * Date range value object
 */
export declare class DateRange extends ValueObject<{
    startDate: Date;
    endDate: Date;
}> {
    private constructor();
    get startDate(): Date;
    get endDate(): Date;
    static create(startDate: Date, endDate: Date): DateRange;
    contains(date: Date): boolean;
    overlaps(other: DateRange): boolean;
}
/**
 * Percentage value object
 */
export declare class Percentage extends ValueObject<{
    value: number;
}> {
    private constructor();
    get value(): number;
    static create(value: number): Percentage;
    toDecimal(): number;
}
