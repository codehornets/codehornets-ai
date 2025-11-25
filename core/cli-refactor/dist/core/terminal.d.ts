/**
 * Terminal utilities module
 * Provides ANSI formatting, text wrapping, boxing, and color support
 */
/** ANSI style codes [open, close] */
export declare const ANSI_CODES: {
    readonly reset: readonly [0, 0];
    readonly bold: readonly [1, 22];
    readonly dim: readonly [2, 22];
    readonly italic: readonly [3, 23];
    readonly underline: readonly [4, 24];
    readonly overline: readonly [53, 55];
    readonly inverse: readonly [7, 27];
    readonly hidden: readonly [8, 28];
    readonly strikethrough: readonly [9, 29];
    readonly black: readonly [30, 39];
    readonly red: readonly [31, 39];
    readonly green: readonly [32, 39];
    readonly yellow: readonly [33, 39];
    readonly blue: readonly [34, 39];
    readonly magenta: readonly [35, 39];
    readonly cyan: readonly [36, 39];
    readonly white: readonly [37, 39];
    readonly blackBright: readonly [90, 39];
    readonly gray: readonly [90, 39];
    readonly grey: readonly [90, 39];
    readonly redBright: readonly [91, 39];
    readonly greenBright: readonly [92, 39];
    readonly yellowBright: readonly [93, 39];
    readonly blueBright: readonly [94, 39];
    readonly magentaBright: readonly [95, 39];
    readonly cyanBright: readonly [96, 39];
    readonly whiteBright: readonly [97, 39];
    readonly bgBlack: readonly [40, 49];
    readonly bgRed: readonly [41, 49];
    readonly bgGreen: readonly [42, 49];
    readonly bgYellow: readonly [43, 49];
    readonly bgBlue: readonly [44, 49];
    readonly bgMagenta: readonly [45, 49];
    readonly bgCyan: readonly [46, 49];
    readonly bgWhite: readonly [47, 49];
    readonly bgBlackBright: readonly [100, 49];
    readonly bgGray: readonly [100, 49];
    readonly bgGrey: readonly [100, 49];
    readonly bgRedBright: readonly [101, 49];
    readonly bgGreenBright: readonly [102, 49];
    readonly bgYellowBright: readonly [103, 49];
    readonly bgBlueBright: readonly [104, 49];
    readonly bgMagentaBright: readonly [105, 49];
    readonly bgCyanBright: readonly [106, 49];
    readonly bgWhiteBright: readonly [107, 49];
};
export type AnsiStyleName = keyof typeof ANSI_CODES;
/** Color support levels */
export declare enum ColorLevel {
    /** No color support */
    None = 0,
    /** Basic 16 colors */
    Basic = 1,
    /** 256 colors */
    Ansi256 = 2,
    /** True color (16 million colors) */
    TrueColor = 3
}
/** Color support information */
export interface ColorSupport {
    /** Color level (0-3) */
    level: ColorLevel;
    /** Whether basic colors are supported */
    hasBasic: boolean;
    /** Whether 256 colors are supported */
    has256: boolean;
    /** Whether true color is supported */
    has16m: boolean;
}
/**
 * Detects the color support level for a stream
 * @param stream - TTY stream to check
 * @param options - Detection options
 * @returns Color level
 */
export declare function detectColorLevel(stream?: NodeJS.WriteStream, options?: {
    streamIsTTY?: boolean;
    sniffFlags?: boolean;
}): ColorLevel;
/**
 * Gets color support for a stream
 * @param stream - Stream to check
 * @param options - Detection options
 * @returns Color support object or false
 */
export declare function getColorSupport(stream?: NodeJS.WriteStream, options?: {
    streamIsTTY?: boolean;
    sniffFlags?: boolean;
}): ColorSupport | false;
/**
 * Gets color support for stdout
 * @returns Color support object or false
 */
export declare function getStdoutColorSupport(): ColorSupport | false;
/**
 * Gets color support for stderr
 * @returns Color support object or false
 */
export declare function getStderrColorSupport(): ColorSupport | false;
/**
 * Resets cached color support (for testing)
 */
export declare function resetColorSupportCache(): void;
export declare const bold: (text: string) => string;
export declare const dim: (text: string) => string;
export declare const italic: (text: string) => string;
export declare const underline: (text: string) => string;
export declare const inverse: (text: string) => string;
export declare const hidden: (text: string) => string;
export declare const strikethrough: (text: string) => string;
export declare const black: (text: string) => string;
export declare const red: (text: string) => string;
export declare const green: (text: string) => string;
export declare const yellow: (text: string) => string;
export declare const blue: (text: string) => string;
export declare const magenta: (text: string) => string;
export declare const cyan: (text: string) => string;
export declare const white: (text: string) => string;
export declare const gray: (text: string) => string;
export declare const grey: (text: string) => string;
export declare const blackBright: (text: string) => string;
export declare const redBright: (text: string) => string;
export declare const greenBright: (text: string) => string;
export declare const yellowBright: (text: string) => string;
export declare const blueBright: (text: string) => string;
export declare const magentaBright: (text: string) => string;
export declare const cyanBright: (text: string) => string;
export declare const whiteBright: (text: string) => string;
export declare const bgBlack: (text: string) => string;
export declare const bgRed: (text: string) => string;
export declare const bgGreen: (text: string) => string;
export declare const bgYellow: (text: string) => string;
export declare const bgBlue: (text: string) => string;
export declare const bgMagenta: (text: string) => string;
export declare const bgCyan: (text: string) => string;
export declare const bgWhite: (text: string) => string;
/**
 * Applies a reset to text
 * @param text - Text to reset
 * @returns Reset text
 */
export declare function reset(text: string): string;
/**
 * Converts RGB values to ANSI 256 color code
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @returns ANSI 256 color code
 */
export declare function rgbToAnsi256(r: number, g: number, b: number): number;
/**
 * Converts a hex color to RGB
 * @param hex - Hex color string (with or without #)
 * @returns RGB array [r, g, b]
 */
export declare function hexToRgb(hex: string): [number, number, number];
/**
 * Creates a foreground color using RGB values
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @returns Function that applies the color to text
 */
export declare function rgb(r: number, g: number, b: number): (text: string) => string;
/**
 * Creates a background color using RGB values
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @returns Function that applies the background color to text
 */
export declare function bgRgb(r: number, g: number, b: number): (text: string) => string;
/**
 * Creates a foreground color using a hex value
 * @param hex - Hex color string
 * @returns Function that applies the color to text
 */
export declare function hex(hexColor: string): (text: string) => string;
/**
 * Creates a background color using a hex value
 * @param hex - Hex color string
 * @returns Function that applies the background color to text
 */
export declare function bgHex(hexColor: string): (text: string) => string;
/**
 * Creates a foreground color using ANSI 256 color code
 * @param code - ANSI 256 color code (0-255)
 * @returns Function that applies the color to text
 */
export declare function ansi256(code: number): (text: string) => string;
/**
 * Creates a background color using ANSI 256 color code
 * @param code - ANSI 256 color code (0-255)
 * @returns Function that applies the background color to text
 */
export declare function bgAnsi256(code: number): (text: string) => string;
/**
 * Strips ANSI escape codes from a string
 * @param text - Text to strip
 * @returns Plain text without ANSI codes
 */
export declare function stripAnsi(text: string): string;
/**
 * Gets the visible length of a string (excluding ANSI codes)
 * @param text - Text to measure
 * @returns Visible character count
 */
export declare function visibleLength(text: string): number;
/**
 * Pads a string to a minimum visible length
 * @param text - Text to pad
 * @param length - Target length
 * @param char - Padding character
 * @returns Padded text
 */
export declare function padEnd(text: string, length: number, char?: string): string;
/**
 * Pads a string to a minimum visible length (left side)
 * @param text - Text to pad
 * @param length - Target length
 * @param char - Padding character
 * @returns Padded text
 */
export declare function padStart(text: string, length: number, char?: string): string;
/**
 * Centers text within a given width
 * @param text - Text to center
 * @param width - Total width
 * @param char - Padding character
 * @returns Centered text
 */
export declare function center(text: string, width: number, char?: string): string;
/**
 * Wraps text to a maximum width
 * @param text - Text to wrap
 * @param width - Maximum line width
 * @returns Wrapped text with newlines
 */
export declare function wordWrap(text: string, width: number): string;
/**
 * Truncates text to a maximum visible length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param ellipsis - Ellipsis string to append
 * @returns Truncated text
 */
export declare function truncate(text: string, maxLength: number, ellipsis?: string): string;
/** Box drawing characters */
export declare const BOX_CHARS: {
    readonly single: {
        readonly topLeft: "┌";
        readonly topRight: "┐";
        readonly bottomLeft: "└";
        readonly bottomRight: "┘";
        readonly horizontal: "─";
        readonly vertical: "│";
    };
    readonly double: {
        readonly topLeft: "╔";
        readonly topRight: "╗";
        readonly bottomLeft: "╚";
        readonly bottomRight: "╝";
        readonly horizontal: "═";
        readonly vertical: "║";
    };
    readonly rounded: {
        readonly topLeft: "╭";
        readonly topRight: "╮";
        readonly bottomLeft: "╰";
        readonly bottomRight: "╯";
        readonly horizontal: "─";
        readonly vertical: "│";
    };
};
export type BoxStyle = keyof typeof BOX_CHARS;
/**
 * Creates a box around text
 * @param content - Content to box
 * @param options - Box options
 * @returns Boxed text
 */
export declare function box(content: string, options?: {
    style?: BoxStyle;
    padding?: number;
    width?: number;
    title?: string;
}): string;
/**
 * Gets the terminal width
 * @returns Terminal width in columns
 */
export declare function getTerminalWidth(): number;
/**
 * Gets the terminal height
 * @returns Terminal height in rows
 */
export declare function getTerminalHeight(): number;
/**
 * Gets the terminal size
 * @returns Object with columns and rows
 */
export declare function getTerminalSize(): {
    columns: number;
    rows: number;
};
/**
 * Moves cursor up N lines
 * @param n - Number of lines
 * @returns ANSI sequence
 */
export declare function cursorUp(n?: number): string;
/**
 * Moves cursor down N lines
 * @param n - Number of lines
 * @returns ANSI sequence
 */
export declare function cursorDown(n?: number): string;
/**
 * Moves cursor forward N columns
 * @param n - Number of columns
 * @returns ANSI sequence
 */
export declare function cursorForward(n?: number): string;
/**
 * Moves cursor backward N columns
 * @param n - Number of columns
 * @returns ANSI sequence
 */
export declare function cursorBackward(n?: number): string;
/**
 * Hides the cursor
 * @returns ANSI sequence
 */
export declare function cursorHide(): string;
/**
 * Shows the cursor
 * @returns ANSI sequence
 */
export declare function cursorShow(): string;
/**
 * Saves cursor position
 * @returns ANSI sequence
 */
export declare function cursorSave(): string;
/**
 * Restores cursor position
 * @returns ANSI sequence
 */
export declare function cursorRestore(): string;
/**
 * Clears the screen
 * @returns ANSI sequence
 */
export declare function clearScreen(): string;
/**
 * Clears from cursor to end of screen
 * @returns ANSI sequence
 */
export declare function clearScreenDown(): string;
/**
 * Clears from cursor to beginning of screen
 * @returns ANSI sequence
 */
export declare function clearScreenUp(): string;
/**
 * Clears the current line
 * @returns ANSI sequence
 */
export declare function clearLine(): string;
/**
 * Clears from cursor to end of line
 * @returns ANSI sequence
 */
export declare function clearLineEnd(): string;
/**
 * Clears from cursor to beginning of line
 * @returns ANSI sequence
 */
export declare function clearLineStart(): string;
//# sourceMappingURL=terminal.d.ts.map