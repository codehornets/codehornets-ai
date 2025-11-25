import { v4 as uuidv4 } from 'uuid';

/**
 * Base value object class
 */
export abstract class ValueObject<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}

/**
 * Unique identifier value object
 */
export class UniqueId extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }

  public static create(id?: string): UniqueId {
    return new UniqueId(id ?? uuidv4());
  }

  public static fromString(id: string): UniqueId {
    return new UniqueId(id);
  }

  public toString(): string {
    return this.props.value;
  }
}

/**
 * Email value object with validation
 */
export class Email extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }

  public static create(email: string): Email {
    if (!Email.isValid(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }
    return new Email(email.toLowerCase().trim());
  }

  public static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * Money value object
 */
export class Money extends ValueObject<{ amount: number; currency: string }> {
  private constructor(amount: number, currency: string) {
    super({ amount, currency });
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  public static create(amount: number, currency: string = 'USD'): Money {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
    return new Money(amount, currency.toUpperCase());
  }

  public add(money: Money): Money {
    if (this.currency !== money.currency) {
      throw new Error('Cannot add money with different currencies');
    }
    return Money.create(this.amount + money.amount, this.currency);
  }

  public subtract(money: Money): Money {
    if (this.currency !== money.currency) {
      throw new Error('Cannot subtract money with different currencies');
    }
    return Money.create(this.amount - money.amount, this.currency);
  }

  public multiply(factor: number): Money {
    return Money.create(this.amount * factor, this.currency);
  }
}

/**
 * Date range value object
 */
export class DateRange extends ValueObject<{ startDate: Date; endDate: Date }> {
  private constructor(startDate: Date, endDate: Date) {
    super({ startDate, endDate });
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  public static create(startDate: Date, endDate: Date): DateRange {
    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }
    return new DateRange(startDate, endDate);
  }

  public contains(date: Date): boolean {
    return date >= this.startDate && date <= this.endDate;
  }

  public overlaps(other: DateRange): boolean {
    return this.startDate <= other.endDate && this.endDate >= other.startDate;
  }
}

/**
 * Percentage value object
 */
export class Percentage extends ValueObject<{ value: number }> {
  private constructor(value: number) {
    super({ value });
  }

  get value(): number {
    return this.props.value;
  }

  public static create(value: number): Percentage {
    if (value < 0 || value > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }
    return new Percentage(value);
  }

  public toDecimal(): number {
    return this.value / 100;
  }
}
