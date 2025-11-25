/**
 * Completion Detector for Claude CLI
 *
 * Detects when Claude has finished processing a command by analyzing
 * terminal output patterns.
 */

/**
 * Patterns that indicate Claude has finished responding
 */
const COMPLETION_PATTERNS = [
  // Claude Code specific patterns
  /^>\s*$/m,                           // Empty prompt line
  /claude>\s*$/m,                      // Claude prompt
  /\$\s*$/m,                           // Shell prompt
  /^Enter your.*prompt/m,              // Input prompt
  /Press Enter to continue/m,          // Continuation prompt
  /\[Y\/n\]\s*$/m,                     // Yes/No prompt
  /\[y\/N\]\s*$/m,                     // No/Yes prompt
  /Do you want to proceed/m,           // Confirmation
  /Waiting for input/m,                // Idle state
];

/**
 * Patterns that indicate Claude is still processing
 */
const PROCESSING_PATTERNS = [
  /Thinking/i,
  /Processing/i,
  /Analyzing/i,
  /Reading/i,
  /Writing/i,
  /Executing/i,
  /Running/i,
  /Compiling/i,
  /Building/i,
  /\.\.\.$/m,                          // Progress dots
  /spinner/i,
];

/**
 * ANSI escape sequence regex
 */
const ANSI_REGEX = /\x1b\[[0-9;]*[a-zA-Z]/g;

/**
 * Strip ANSI codes from text
 * @param {string} text - Text with ANSI codes
 * @returns {string} Clean text
 */
function stripAnsi(text) {
  return text.replace(ANSI_REGEX, '');
}

/**
 * CompletionDetector class
 * Tracks output buffer and detects when Claude has finished responding
 */
export class CompletionDetector {
  constructor(options = {}) {
    this.buffer = '';
    this.lastOutputTime = Date.now();
    this.silenceThresholdMs = options.silenceThresholdMs || 2000;
    this.minOutputLength = options.minOutputLength || 10;
    this.customPatterns = options.customPatterns || [];
    this.onComplete = options.onComplete || (() => {});
    this.onProgress = options.onProgress || (() => {});
    this.checkInterval = null;
    this.isComplete = false;
    this.responseStarted = false;
  }

  /**
   * Reset detector state for new command
   */
  reset() {
    this.buffer = '';
    this.lastOutputTime = Date.now();
    this.isComplete = false;
    this.responseStarted = false;
    this.stopChecking();
  }

  /**
   * Add output data to buffer and check for completion
   * @param {string} data - Output data from PTY
   */
  addOutput(data) {
    this.buffer += data;
    this.lastOutputTime = Date.now();

    if (!this.responseStarted && this.buffer.length > this.minOutputLength) {
      this.responseStarted = true;
    }

    // Notify progress
    this.onProgress(data);

    // Check for immediate completion patterns
    if (this.checkCompletionPatterns()) {
      this.markComplete();
    }
  }

  /**
   * Check if any completion pattern matches
   * @returns {boolean}
   */
  checkCompletionPatterns() {
    if (!this.responseStarted) return false;

    const cleanBuffer = stripAnsi(this.buffer);
    const lastChunk = cleanBuffer.slice(-500); // Check last 500 chars

    // Check if still processing
    for (const pattern of PROCESSING_PATTERNS) {
      if (pattern.test(lastChunk)) {
        return false;
      }
    }

    // Check for completion patterns
    const allPatterns = [...COMPLETION_PATTERNS, ...this.customPatterns];
    for (const pattern of allPatterns) {
      if (pattern.test(lastChunk)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check for completion based on silence (no output for threshold time)
   * @returns {boolean}
   */
  checkSilenceCompletion() {
    if (!this.responseStarted) return false;

    const silenceTime = Date.now() - this.lastOutputTime;
    return silenceTime >= this.silenceThresholdMs;
  }

  /**
   * Start periodic checking for completion
   * @param {number} intervalMs - Check interval in milliseconds
   */
  startChecking(intervalMs = 500) {
    this.stopChecking();
    this.checkInterval = setInterval(() => {
      if (this.isComplete) {
        this.stopChecking();
        return;
      }

      if (this.checkSilenceCompletion()) {
        this.markComplete();
      }
    }, intervalMs);
  }

  /**
   * Stop periodic checking
   */
  stopChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Mark response as complete
   */
  markComplete() {
    if (this.isComplete) return;

    this.isComplete = true;
    this.stopChecking();
    this.onComplete(this.buffer);
  }

  /**
   * Force completion (for timeout scenarios)
   */
  forceComplete() {
    this.markComplete();
  }

  /**
   * Get current buffer content
   * @returns {string}
   */
  getBuffer() {
    return this.buffer;
  }

  /**
   * Get clean buffer (without ANSI codes)
   * @returns {string}
   */
  getCleanBuffer() {
    return stripAnsi(this.buffer);
  }

  /**
   * Check if response has started
   * @returns {boolean}
   */
  hasStarted() {
    return this.responseStarted;
  }

  /**
   * Check if response is complete
   * @returns {boolean}
   */
  isResponseComplete() {
    return this.isComplete;
  }
}

/**
 * Create a promise-based completion detector
 * @param {object} options - Detector options
 * @returns {object} - {detector, promise}
 */
export function createCompletionPromise(options = {}) {
  let resolvePromise;
  const promise = new Promise((resolve) => {
    resolvePromise = resolve;
  });

  const detector = new CompletionDetector({
    ...options,
    onComplete: (buffer) => {
      resolvePromise(buffer);
      if (options.onComplete) {
        options.onComplete(buffer);
      }
    }
  });

  return { detector, promise };
}

export default CompletionDetector;
