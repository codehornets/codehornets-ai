/**
 * Terminal utilities module
 * Provides ANSI formatting, text wrapping, boxing, and color support
 */
import * as process from 'process';
import * as os from 'os';
import * as tty from 'tty';
// ============================================================================
// ANSI Escape Codes
// ============================================================================
/** ANSI escape sequence prefix */
const ESC = '\x1b';
const CSI = `${ESC}[`;
/** ANSI style codes [open, close] */
export const ANSI_CODES = {
    // Modifiers
    reset: [0, 0],
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    overline: [53, 55],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29],
    // Foreground colors
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    // Bright foreground colors
    blackBright: [90, 39],
    gray: [90, 39],
    grey: [90, 39],
    redBright: [91, 39],
    greenBright: [92, 39],
    yellowBright: [93, 39],
    blueBright: [94, 39],
    magentaBright: [95, 39],
    cyanBright: [96, 39],
    whiteBright: [97, 39],
    // Background colors
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    // Bright background colors
    bgBlackBright: [100, 49],
    bgGray: [100, 49],
    bgGrey: [100, 49],
    bgRedBright: [101, 49],
    bgGreenBright: [102, 49],
    bgYellowBright: [103, 49],
    bgBlueBright: [104, 49],
    bgMagentaBright: [105, 49],
    bgCyanBright: [106, 49],
    bgWhiteBright: [107, 49],
};
/** Color support levels */
export var ColorLevel;
(function (ColorLevel) {
    /** No color support */
    ColorLevel[ColorLevel["None"] = 0] = "None";
    /** Basic 16 colors */
    ColorLevel[ColorLevel["Basic"] = 1] = "Basic";
    /** 256 colors */
    ColorLevel[ColorLevel["Ansi256"] = 2] = "Ansi256";
    /** True color (16 million colors) */
    ColorLevel[ColorLevel["TrueColor"] = 3] = "TrueColor";
})(ColorLevel || (ColorLevel = {}));
// ============================================================================
// Color Support Detection
// ============================================================================
/**
 * Checks if a CLI flag is present in arguments
 * @param flag - Flag to check (without dashes)
 * @param argv - Arguments array
 * @returns True if flag is present
 */
function hasFlag(flag, argv = process.argv) {
    const prefix = flag.startsWith('-') ? '' : flag.length === 1 ? '-' : '--';
    const index = argv.indexOf(prefix + flag);
    const terminator = argv.indexOf('--');
    return index !== -1 && (terminator === -1 || index < terminator);
}
/**
 * Gets the forced color level from FORCE_COLOR env var
 * @returns Color level or undefined
 */
function getForcedColorLevel() {
    const forceColor = process.env.FORCE_COLOR;
    if (forceColor === undefined) {
        return undefined;
    }
    if (forceColor === 'true')
        return ColorLevel.Basic;
    if (forceColor === 'false')
        return ColorLevel.None;
    if (forceColor.length === 0)
        return ColorLevel.Basic;
    return Math.min(parseInt(forceColor, 10), 3);
}
/**
 * Detects the color support level for a stream
 * @param stream - TTY stream to check
 * @param options - Detection options
 * @returns Color level
 */
export function detectColorLevel(stream, options = {}) {
    const { streamIsTTY, sniffFlags = true } = options;
    const env = process.env;
    // Check forced color level
    const forcedLevel = getForcedColorLevel();
    let flagForceLevel = sniffFlags ? forcedLevel : undefined;
    if (flagForceLevel === ColorLevel.None) {
        return ColorLevel.None;
    }
    // Check CLI flags
    if (sniffFlags) {
        if (hasFlag('color=16m') || hasFlag('color=full') || hasFlag('color=truecolor')) {
            return ColorLevel.TrueColor;
        }
        if (hasFlag('color=256')) {
            return ColorLevel.Ansi256;
        }
        if (hasFlag('no-color') || hasFlag('no-colors') || hasFlag('color=false') || hasFlag('color=never')) {
            flagForceLevel = ColorLevel.None;
        }
        else if (hasFlag('color') || hasFlag('colors') || hasFlag('color=true') || hasFlag('color=always')) {
            flagForceLevel = ColorLevel.Basic;
        }
    }
    if (flagForceLevel === ColorLevel.None) {
        return ColorLevel.None;
    }
    // Check CI environments
    if ('TF_BUILD' in env && 'AGENT_NAME' in env) {
        return ColorLevel.Basic;
    }
    // No TTY support
    if (stream && !streamIsTTY && flagForceLevel === undefined) {
        return ColorLevel.None;
    }
    let min = flagForceLevel ?? ColorLevel.None;
    if (env.TERM === 'dumb') {
        return min;
    }
    // Windows detection
    if (process.platform === 'win32') {
        const release = os.release().split('.');
        if (Number(release[0]) >= 10 && Number(release[2]) >= 10586) {
            return Number(release[2]) >= 14931 ? ColorLevel.TrueColor : ColorLevel.Ansi256;
        }
        return ColorLevel.Basic;
    }
    // CI environments
    if ('CI' in env) {
        if (['GITHUB_ACTIONS', 'GITEA_ACTIONS', 'CIRCLECI'].some((ci) => ci in env)) {
            return ColorLevel.TrueColor;
        }
        if (['TRAVIS', 'APPVEYOR', 'GITLAB_CI', 'BUILDKITE', 'DRONE'].some((ci) => ci in env) ||
            env.CI_NAME === 'codeship') {
            return ColorLevel.Basic;
        }
        return min;
    }
    // TeamCity
    if ('TEAMCITY_VERSION' in env) {
        return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION ?? '')
            ? ColorLevel.Basic
            : ColorLevel.None;
    }
    // True color environments
    if (env.COLORTERM === 'truecolor')
        return ColorLevel.TrueColor;
    if (env.TERM === 'xterm-kitty')
        return ColorLevel.TrueColor;
    // Terminal program detection
    if (env.TERM_PROGRAM) {
        const version = parseInt((env.TERM_PROGRAM_VERSION ?? '').split('.')[0] ?? '0', 10);
        switch (env.TERM_PROGRAM) {
            case 'iTerm.app':
                return version >= 3 ? ColorLevel.TrueColor : ColorLevel.Ansi256;
            case 'Apple_Terminal':
                return ColorLevel.Ansi256;
        }
    }
    // TERM variable checks
    if (/-256(color)?$/i.test(env.TERM ?? '')) {
        return ColorLevel.Ansi256;
    }
    if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM ?? '')) {
        return ColorLevel.Basic;
    }
    if ('COLORTERM' in env) {
        return ColorLevel.Basic;
    }
    return min;
}
/**
 * Gets color support for a stream
 * @param stream - Stream to check
 * @param options - Detection options
 * @returns Color support object or false
 */
export function getColorSupport(stream, options = {}) {
    const level = detectColorLevel(stream, {
        streamIsTTY: stream?.isTTY,
        ...options,
    });
    if (level === ColorLevel.None) {
        return false;
    }
    return {
        level,
        hasBasic: true,
        has256: level >= ColorLevel.Ansi256,
        has16m: level >= ColorLevel.TrueColor,
    };
}
// Cached color support for stdout/stderr
let stdoutSupport;
let stderrSupport;
/**
 * Gets color support for stdout
 * @returns Color support object or false
 */
export function getStdoutColorSupport() {
    if (stdoutSupport === undefined) {
        stdoutSupport = getColorSupport(process.stdout, {
            streamIsTTY: tty.isatty(1),
        });
    }
    return stdoutSupport;
}
/**
 * Gets color support for stderr
 * @returns Color support object or false
 */
export function getStderrColorSupport() {
    if (stderrSupport === undefined) {
        stderrSupport = getColorSupport(process.stderr, {
            streamIsTTY: tty.isatty(2),
        });
    }
    return stderrSupport;
}
/**
 * Resets cached color support (for testing)
 */
export function resetColorSupportCache() {
    stdoutSupport = undefined;
    stderrSupport = undefined;
}
// ============================================================================
// ANSI Formatting Functions
// ============================================================================
/**
 * Creates an ANSI escape sequence for a style code
 * @param code - Style code number
 * @returns ANSI escape sequence
 */
function ansi(code) {
    return `${CSI}${code}m`;
}
/**
 * Wraps text in ANSI style codes
 * @param text - Text to wrap
 * @param openCode - Opening style code
 * @param closeCode - Closing style code
 * @returns Styled text
 */
function wrap(text, openCode, closeCode) {
    return `${ansi(openCode)}${text}${ansi(closeCode)}`;
}
/**
 * Creates a style function for a given ANSI style
 * @param styleName - Name of the style
 * @returns Function that applies the style to text
 */
function createStyleFunction(styleName) {
    const [open, close] = ANSI_CODES[styleName];
    return (text) => wrap(text, open, close);
}
// Generate style functions
export const bold = createStyleFunction('bold');
export const dim = createStyleFunction('dim');
export const italic = createStyleFunction('italic');
export const underline = createStyleFunction('underline');
export const inverse = createStyleFunction('inverse');
export const hidden = createStyleFunction('hidden');
export const strikethrough = createStyleFunction('strikethrough');
export const black = createStyleFunction('black');
export const red = createStyleFunction('red');
export const green = createStyleFunction('green');
export const yellow = createStyleFunction('yellow');
export const blue = createStyleFunction('blue');
export const magenta = createStyleFunction('magenta');
export const cyan = createStyleFunction('cyan');
export const white = createStyleFunction('white');
export const gray = createStyleFunction('gray');
export const grey = createStyleFunction('grey');
export const blackBright = createStyleFunction('blackBright');
export const redBright = createStyleFunction('redBright');
export const greenBright = createStyleFunction('greenBright');
export const yellowBright = createStyleFunction('yellowBright');
export const blueBright = createStyleFunction('blueBright');
export const magentaBright = createStyleFunction('magentaBright');
export const cyanBright = createStyleFunction('cyanBright');
export const whiteBright = createStyleFunction('whiteBright');
export const bgBlack = createStyleFunction('bgBlack');
export const bgRed = createStyleFunction('bgRed');
export const bgGreen = createStyleFunction('bgGreen');
export const bgYellow = createStyleFunction('bgYellow');
export const bgBlue = createStyleFunction('bgBlue');
export const bgMagenta = createStyleFunction('bgMagenta');
export const bgCyan = createStyleFunction('bgCyan');
export const bgWhite = createStyleFunction('bgWhite');
/**
 * Applies a reset to text
 * @param text - Text to reset
 * @returns Reset text
 */
export function reset(text) {
    return wrap(text, 0, 0);
}
// ============================================================================
// RGB and Hex Color Functions
// ============================================================================
/**
 * Converts RGB values to ANSI 256 color code
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @returns ANSI 256 color code
 */
export function rgbToAnsi256(r, g, b) {
    // Grayscale
    if (r === g && g === b) {
        if (r < 8)
            return 16;
        if (r > 248)
            return 231;
        return Math.round((r - 8) / 247 * 24) + 232;
    }
    // Color cube
    return (16 +
        36 * Math.round((r / 255) * 5) +
        6 * Math.round((g / 255) * 5) +
        Math.round((b / 255) * 5));
}
/**
 * Converts a hex color to RGB
 * @param hex - Hex color string (with or without #)
 * @returns RGB array [r, g, b]
 */
export function hexToRgb(hex) {
    const match = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString());
    if (!match) {
        return [0, 0, 0];
    }
    let color = match[0];
    if (color.length === 3) {
        color = [...color].map((c) => c + c).join('');
    }
    const num = parseInt(color, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}
/**
 * Creates a foreground color using RGB values
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @returns Function that applies the color to text
 */
export function rgb(r, g, b) {
    return (text) => `${CSI}38;2;${r};${g};${b}m${text}${CSI}39m`;
}
/**
 * Creates a background color using RGB values
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @returns Function that applies the background color to text
 */
export function bgRgb(r, g, b) {
    return (text) => `${CSI}48;2;${r};${g};${b}m${text}${CSI}49m`;
}
/**
 * Creates a foreground color using a hex value
 * @param hex - Hex color string
 * @returns Function that applies the color to text
 */
export function hex(hexColor) {
    const [r, g, b] = hexToRgb(hexColor);
    return rgb(r, g, b);
}
/**
 * Creates a background color using a hex value
 * @param hex - Hex color string
 * @returns Function that applies the background color to text
 */
export function bgHex(hexColor) {
    const [r, g, b] = hexToRgb(hexColor);
    return bgRgb(r, g, b);
}
/**
 * Creates a foreground color using ANSI 256 color code
 * @param code - ANSI 256 color code (0-255)
 * @returns Function that applies the color to text
 */
export function ansi256(code) {
    return (text) => `${CSI}38;5;${code}m${text}${CSI}39m`;
}
/**
 * Creates a background color using ANSI 256 color code
 * @param code - ANSI 256 color code (0-255)
 * @returns Function that applies the background color to text
 */
export function bgAnsi256(code) {
    return (text) => `${CSI}48;5;${code}m${text}${CSI}49m`;
}
// ============================================================================
// Text Utilities
// ============================================================================
/** Regex to match ANSI escape sequences */
const ANSI_REGEX = /\x1b\[[0-9;]*m/g;
/**
 * Strips ANSI escape codes from a string
 * @param text - Text to strip
 * @returns Plain text without ANSI codes
 */
export function stripAnsi(text) {
    return text.replace(ANSI_REGEX, '');
}
/**
 * Gets the visible length of a string (excluding ANSI codes)
 * @param text - Text to measure
 * @returns Visible character count
 */
export function visibleLength(text) {
    return stripAnsi(text).length;
}
/**
 * Pads a string to a minimum visible length
 * @param text - Text to pad
 * @param length - Target length
 * @param char - Padding character
 * @returns Padded text
 */
export function padEnd(text, length, char = ' ') {
    const visible = visibleLength(text);
    if (visible >= length)
        return text;
    return text + char.repeat(length - visible);
}
/**
 * Pads a string to a minimum visible length (left side)
 * @param text - Text to pad
 * @param length - Target length
 * @param char - Padding character
 * @returns Padded text
 */
export function padStart(text, length, char = ' ') {
    const visible = visibleLength(text);
    if (visible >= length)
        return text;
    return char.repeat(length - visible) + text;
}
/**
 * Centers text within a given width
 * @param text - Text to center
 * @param width - Total width
 * @param char - Padding character
 * @returns Centered text
 */
export function center(text, width, char = ' ') {
    const visible = visibleLength(text);
    if (visible >= width)
        return text;
    const padding = width - visible;
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    return char.repeat(leftPad) + text + char.repeat(rightPad);
}
/**
 * Wraps text to a maximum width
 * @param text - Text to wrap
 * @param width - Maximum line width
 * @returns Wrapped text with newlines
 */
export function wordWrap(text, width) {
    if (width <= 0)
        return text;
    const lines = [];
    const paragraphs = text.split('\n');
    for (const paragraph of paragraphs) {
        if (visibleLength(paragraph) <= width) {
            lines.push(paragraph);
            continue;
        }
        const words = paragraph.split(' ');
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (visibleLength(testLine) <= width) {
                currentLine = testLine;
            }
            else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
    }
    return lines.join('\n');
}
/**
 * Truncates text to a maximum visible length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param ellipsis - Ellipsis string to append
 * @returns Truncated text
 */
export function truncate(text, maxLength, ellipsis = '...') {
    const visible = visibleLength(text);
    if (visible <= maxLength)
        return text;
    const ellipsisLength = ellipsis.length;
    const targetLength = maxLength - ellipsisLength;
    if (targetLength <= 0)
        return ellipsis.slice(0, maxLength);
    // Handle ANSI codes by iterating character by character
    const plain = stripAnsi(text);
    return plain.slice(0, targetLength) + ellipsis;
}
// ============================================================================
// Box Drawing
// ============================================================================
/** Box drawing characters */
export const BOX_CHARS = {
    single: {
        topLeft: '\u250c',
        topRight: '\u2510',
        bottomLeft: '\u2514',
        bottomRight: '\u2518',
        horizontal: '\u2500',
        vertical: '\u2502',
    },
    double: {
        topLeft: '\u2554',
        topRight: '\u2557',
        bottomLeft: '\u255a',
        bottomRight: '\u255d',
        horizontal: '\u2550',
        vertical: '\u2551',
    },
    rounded: {
        topLeft: '\u256d',
        topRight: '\u256e',
        bottomLeft: '\u2570',
        bottomRight: '\u256f',
        horizontal: '\u2500',
        vertical: '\u2502',
    },
};
/**
 * Creates a box around text
 * @param content - Content to box
 * @param options - Box options
 * @returns Boxed text
 */
export function box(content, options = {}) {
    const { style = 'single', padding = 1, width: minWidth, title } = options;
    const chars = BOX_CHARS[style];
    const lines = content.split('\n');
    const contentWidth = Math.max(...lines.map((l) => visibleLength(l)), minWidth ?? 0, title ? visibleLength(title) + 2 : 0);
    const innerWidth = contentWidth + padding * 2;
    const horizontalLine = chars.horizontal.repeat(innerWidth);
    const result = [];
    // Top border (with optional title)
    if (title) {
        const titleStr = ` ${title} `;
        const remainingWidth = innerWidth - visibleLength(titleStr);
        const leftWidth = Math.floor(remainingWidth / 2);
        const rightWidth = remainingWidth - leftWidth;
        result.push(chars.topLeft +
            chars.horizontal.repeat(leftWidth) +
            titleStr +
            chars.horizontal.repeat(rightWidth) +
            chars.topRight);
    }
    else {
        result.push(chars.topLeft + horizontalLine + chars.topRight);
    }
    // Padding lines
    const paddingLine = chars.vertical + ' '.repeat(innerWidth) + chars.vertical;
    for (let i = 0; i < padding; i++) {
        result.push(paddingLine);
    }
    // Content lines
    for (const line of lines) {
        const paddedLine = padEnd(line, contentWidth);
        result.push(chars.vertical +
            ' '.repeat(padding) +
            paddedLine +
            ' '.repeat(padding) +
            chars.vertical);
    }
    // Padding lines
    for (let i = 0; i < padding; i++) {
        result.push(paddingLine);
    }
    // Bottom border
    result.push(chars.bottomLeft + horizontalLine + chars.bottomRight);
    return result.join('\n');
}
// ============================================================================
// Terminal Size
// ============================================================================
/**
 * Gets the terminal width
 * @returns Terminal width in columns
 */
export function getTerminalWidth() {
    return process.stdout.columns ?? 80;
}
/**
 * Gets the terminal height
 * @returns Terminal height in rows
 */
export function getTerminalHeight() {
    return process.stdout.rows ?? 24;
}
/**
 * Gets the terminal size
 * @returns Object with columns and rows
 */
export function getTerminalSize() {
    return {
        columns: getTerminalWidth(),
        rows: getTerminalHeight(),
    };
}
// ============================================================================
// Cursor Control
// ============================================================================
/**
 * Moves cursor up N lines
 * @param n - Number of lines
 * @returns ANSI sequence
 */
export function cursorUp(n = 1) {
    return `${CSI}${n}A`;
}
/**
 * Moves cursor down N lines
 * @param n - Number of lines
 * @returns ANSI sequence
 */
export function cursorDown(n = 1) {
    return `${CSI}${n}B`;
}
/**
 * Moves cursor forward N columns
 * @param n - Number of columns
 * @returns ANSI sequence
 */
export function cursorForward(n = 1) {
    return `${CSI}${n}C`;
}
/**
 * Moves cursor backward N columns
 * @param n - Number of columns
 * @returns ANSI sequence
 */
export function cursorBackward(n = 1) {
    return `${CSI}${n}D`;
}
/**
 * Hides the cursor
 * @returns ANSI sequence
 */
export function cursorHide() {
    return `${CSI}?25l`;
}
/**
 * Shows the cursor
 * @returns ANSI sequence
 */
export function cursorShow() {
    return `${CSI}?25h`;
}
/**
 * Saves cursor position
 * @returns ANSI sequence
 */
export function cursorSave() {
    return `${ESC}7`;
}
/**
 * Restores cursor position
 * @returns ANSI sequence
 */
export function cursorRestore() {
    return `${ESC}8`;
}
// ============================================================================
// Screen Control
// ============================================================================
/**
 * Clears the screen
 * @returns ANSI sequence
 */
export function clearScreen() {
    return `${CSI}2J`;
}
/**
 * Clears from cursor to end of screen
 * @returns ANSI sequence
 */
export function clearScreenDown() {
    return `${CSI}J`;
}
/**
 * Clears from cursor to beginning of screen
 * @returns ANSI sequence
 */
export function clearScreenUp() {
    return `${CSI}1J`;
}
/**
 * Clears the current line
 * @returns ANSI sequence
 */
export function clearLine() {
    return `${CSI}2K`;
}
/**
 * Clears from cursor to end of line
 * @returns ANSI sequence
 */
export function clearLineEnd() {
    return `${CSI}K`;
}
/**
 * Clears from cursor to beginning of line
 * @returns ANSI sequence
 */
export function clearLineStart() {
    return `${CSI}1K`;
}
//# sourceMappingURL=terminal.js.map