import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { Diagnostics } from './Diagnostics.js';
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Gets relative path from the current working directory
 *
 * @param fullPath - Full file path
 * @param cwd - Current working directory
 * @returns Relative path
 */
function getRelativePath(fullPath, cwd = process.cwd()) {
    if (fullPath.startsWith(cwd)) {
        const relative = fullPath.slice(cwd.length);
        return relative.startsWith('/') || relative.startsWith('\\')
            ? relative.slice(1)
            : relative;
    }
    return fullPath;
}
/**
 * Formats file size for display
 *
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
function formatFileSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
/**
 * Base container for attachment display with consistent styling
 */
export const AttachmentRow = ({ children, dimColor = true, color, }) => {
    let textColor;
    switch (color) {
        case 'error':
            textColor = 'red';
            break;
        case 'warning':
            textColor = 'yellow';
            break;
        case 'success':
            textColor = 'green';
            break;
        case 'info':
            textColor = 'cyan';
            break;
        default:
            textColor = undefined;
    }
    return (_jsx(Box, { flexDirection: "row", width: "100%", children: _jsx(Text, { dimColor: dimColor && !textColor, color: textColor, wrap: "wrap", children: children }) }));
};
/**
 * Renders a file attachment display
 */
export const FileAttachmentDisplay = ({ attachment, verbose = false, }) => {
    const relativePath = getRelativePath(attachment.filename);
    const contentType = attachment.content.type;
    // Handle notebook files
    if (contentType === 'notebook' && 'cells' in attachment.content.file) {
        const cellCount = attachment.content.file.cells.length;
        return (_jsxs(AttachmentRow, { dimColor: false, children: [_jsx(Text, { dimColor: true, children: "Read " }), _jsx(Text, { bold: true, children: relativePath }), _jsx(Text, { children: " " }), _jsxs(Text, { dimColor: true, children: ["(", cellCount, " cells)"] })] }));
    }
    // Handle text files
    if (contentType === 'text' && 'numLines' in attachment.content.file) {
        const numLines = attachment.content.file.numLines;
        const truncatedIndicator = attachment.truncated ? '+' : '';
        return (_jsxs(AttachmentRow, { dimColor: false, children: [_jsx(Text, { dimColor: true, children: "Read " }), _jsx(Text, { bold: true, children: relativePath }), _jsx(Text, { children: " " }), _jsxs(Text, { dimColor: true, children: ["(", numLines, truncatedIndicator, " lines)"] })] }));
    }
    // Handle image/pdf files (show size)
    if ('originalSize' in attachment.content.file) {
        const size = formatFileSize(attachment.content.file.originalSize);
        return (_jsxs(AttachmentRow, { dimColor: false, children: [_jsx(Text, { dimColor: true, children: "Read " }), _jsx(Text, { bold: true, children: relativePath }), _jsx(Text, { children: " " }), _jsxs(Text, { dimColor: true, children: ["(", size, ")"] })] }));
    }
    // Default file display
    return (_jsxs(AttachmentRow, { dimColor: false, children: [_jsx(Text, { dimColor: true, children: "Read " }), _jsx(Text, { bold: true, children: relativePath })] }));
};
/**
 * Renders a directory listing attachment
 */
export const DirectoryAttachmentDisplay = ({ attachment, }) => {
    const relativePath = getRelativePath(attachment.path);
    const separator = process.platform === 'win32' ? '\\' : '/';
    return (_jsxs(AttachmentRow, { children: [_jsx(Text, { children: "Listed directory " }), _jsxs(Text, { bold: true, children: [relativePath, separator] })] }));
};
/**
 * Renders an IDE selected lines attachment
 */
export const IDESelectionDisplay = ({ attachment, }) => {
    const relativePath = getRelativePath(attachment.filename);
    const lineCount = attachment.lineEnd - attachment.lineStart + 1;
    return (_jsxs(AttachmentRow, { dimColor: false, children: [_jsxs(Text, { dimColor: true, children: ['<>', " Selected "] }), _jsx(Text, { bold: true, children: lineCount }), _jsx(Text, { children: " " }), _jsx(Text, { dimColor: true, children: "lines from " }), _jsx(Text, { bold: true, children: relativePath }), _jsx(Text, { children: " " }), _jsxs(Text, { dimColor: true, children: ["in ", attachment.ideName] })] }));
};
/**
 * Renders an MCP resource attachment
 */
export const MCPResourceDisplay = ({ attachment, }) => {
    return (_jsxs(AttachmentRow, { dimColor: false, children: [_jsx(Text, { dimColor: true, children: "Read MCP resource " }), _jsx(Text, { bold: true, children: attachment.name }), _jsx(Text, { children: " " }), _jsxs(Text, { dimColor: true, children: ["from ", attachment.server] })] }));
};
/**
 * Renders a todo list attachment
 */
export const TodoAttachmentDisplay = ({ attachment, }) => {
    // Only show for post-compact context
    if (attachment.context !== 'post-compact') {
        return null;
    }
    const itemWord = attachment.itemCount === 1 ? 'item' : 'items';
    return (_jsx(AttachmentRow, { children: _jsxs(Text, { children: ["Todo list read (", attachment.itemCount, " ", itemWord, ")"] }) }));
};
/**
 * Renders command permissions attachment
 */
export const CommandPermissionsDisplay = ({ attachment, verbose = false, }) => {
    return (_jsxs(Box, { flexDirection: "column", paddingLeft: 0, children: [attachment.model && (_jsxs(AttachmentRow, { dimColor: false, children: [_jsx(Text, { dimColor: true, children: "Model: " }), _jsx(Text, { dimColor: true, bold: true, children: attachment.model })] })), attachment.allowedTools.length > 0 && (_jsxs(_Fragment, { children: [_jsxs(AttachmentRow, { dimColor: false, children: [_jsx(Text, { dimColor: true, children: "Allowed " }), _jsx(Text, { dimColor: true, bold: true, children: attachment.allowedTools.length }), _jsx(Text, { dimColor: true, children: " tools for this command" })] }), verbose && (_jsx(AttachmentRow, { dimColor: false, children: _jsx(Text, { dimColor: true, children: attachment.allowedTools.join(', ') }) }))] }))] }));
};
/**
 * Renders a hook response attachment
 */
export const HookResponseDisplay = ({ attachment, verbose = false, }) => {
    const { response } = attachment;
    return (_jsxs(AttachmentRow, { dimColor: false, children: [_jsx(Text, { dimColor: true, children: "Async hook " }), _jsx(Text, { dimColor: true, bold: true, children: attachment.hookEvent }), _jsx(Text, { children: " " }), _jsx(Text, { dimColor: true, children: "completed" }), verbose && response.systemMessage && (_jsxs(_Fragment, { children: [_jsxs(Text, { dimColor: true, children: [":", '\n'] }), _jsx(Text, { dimColor: true, children: response.systemMessage })] })), verbose &&
                response.hookSpecificOutput?.additionalContext && (_jsxs(_Fragment, { children: [_jsxs(Text, { dimColor: true, children: [":", '\n'] }), _jsx(Text, { dimColor: true, children: response.hookSpecificOutput.additionalContext })] }))] }));
};
/**
 * Renders hook error attachments
 */
export const HookErrorDisplay = ({ attachment, verbose = false, }) => {
    switch (attachment.type) {
        case 'hook_blocking_error':
            if (verbose) {
                return (_jsxs(AttachmentRow, { color: "error", children: [attachment.hookName, " hook returned blocking error:", ' ', attachment.blockingError?.blockingError] }));
            }
            return (_jsxs(AttachmentRow, { color: "error", children: [attachment.hookName, " hook returned blocking error"] }));
        case 'hook_non_blocking_error':
            if (verbose) {
                return (_jsxs(AttachmentRow, { color: "error", children: [attachment.hookName, " hook error: ", attachment.stderr] }));
            }
            return (_jsxs(AttachmentRow, { color: "error", children: [attachment.hookName, " hook error"] }));
        case 'hook_error_during_execution':
            if (verbose) {
                return (_jsxs(AttachmentRow, { children: [attachment.hookName, " hook warning: ", attachment.content] }));
            }
            return _jsxs(AttachmentRow, { children: [attachment.hookName, " hook warning"] });
        default:
            return null;
    }
};
/**
 * Renders hook success attachments (verbose only)
 */
export const HookSuccessDisplay = ({ attachment, verbose = false, }) => {
    if (!verbose)
        return null;
    return (_jsxs(AttachmentRow, { children: [attachment.hookName, " hook succeeded: ", attachment.content] }));
};
/**
 * Renders hook stopped continuation attachment
 */
export const HookStoppedDisplay = ({ attachment, }) => {
    return (_jsxs(AttachmentRow, { color: "warning", children: [attachment.hookName, " hook stopped continuation: ", attachment.message] }));
};
/**
 * Renders hook system message attachment
 */
export const HookSystemMessageDisplay = ({ attachment }) => {
    return (_jsxs(AttachmentRow, { children: [attachment.hookName, " says: ", attachment.content] }));
};
/**
 * Renders async agent status attachment
 */
export const AsyncAgentStatusDisplay = ({ attachment, }) => {
    const statusText = attachment.status === 'completed' ? 'completed in background' : attachment.status;
    const errorText = attachment.error ? `: ${attachment.error}` : '';
    let color;
    if (attachment.status === 'completed')
        color = 'success';
    if (attachment.status === 'failed')
        color = 'error';
    return (_jsx(Box, { flexDirection: "row", width: "100%", marginTop: 1, paddingLeft: 2, children: _jsxs(Text, { color: color === 'success' ? 'green' : color === 'error' ? 'red' : undefined, children: ["Agent ", statusText, errorText] }) }));
};
/**
 * Renders compact file reference
 */
export const CompactFileReferenceDisplay = ({ attachment }) => {
    const relativePath = getRelativePath(attachment.filename);
    return (_jsxs(AttachmentRow, { children: [_jsx(Text, { children: "Referenced file " }), _jsx(Text, { bold: true, children: relativePath })] }));
};
/**
 * Renders nested memory attachment
 */
export const NestedMemoryDisplay = ({ attachment }) => {
    const relativePath = getRelativePath(attachment.path);
    return (_jsx(AttachmentRow, { children: _jsx(Text, { bold: true, children: relativePath }) }));
};
/**
 * Renders queued command attachment
 */
export const QueuedCommandDisplay = ({ attachment, addMargin, verbose }) => {
    const promptText = typeof attachment.prompt === 'string'
        ? attachment.prompt
        : JSON.stringify(attachment.prompt);
    return (_jsx(Box, { flexDirection: "column", marginTop: addMargin ? 1 : 0, children: _jsx(Text, { wrap: "wrap", children: promptText }) }));
};
// ============================================================================
// Main Attachment Renderer
// ============================================================================
/**
 * Main attachment renderer that dispatches to specific attachment
 * components based on attachment type.
 *
 * @param props - Attachment renderer props
 * @returns Rendered attachment component
 *
 * @example
 * ```tsx
 * <Attachment
 *   attachment={fileAttachment}
 *   addMargin={true}
 *   verbose={false}
 * />
 * ```
 */
export const Attachment = ({ attachment, addMargin = false, verbose = false, }) => {
    // Wrap in margin container if needed
    const Container = ({ children }) => addMargin ? (_jsx(Box, { marginTop: 1, flexDirection: "column", children: children })) : (_jsx(_Fragment, { children: children }));
    switch (attachment.type) {
        case 'file':
        case 'already_read_file':
            return (_jsx(Container, { children: _jsx(FileAttachmentDisplay, { attachment: attachment, addMargin: false, verbose: verbose }) }));
        case 'directory':
            return (_jsx(Container, { children: _jsx(DirectoryAttachmentDisplay, { attachment: attachment, addMargin: false, verbose: verbose }) }));
        case 'selected_lines_in_ide':
            return (_jsx(Container, { children: _jsx(IDESelectionDisplay, { attachment: attachment, addMargin: false, verbose: verbose }) }));
        case 'diagnostics':
            return (_jsx(Container, { children: _jsx(Diagnostics, { attachment: attachment, verbose: verbose }) }));
        case 'mcp_resource':
            return (_jsx(Container, { children: _jsx(MCPResourceDisplay, { attachment: attachment, addMargin: false, verbose: verbose }) }));
        case 'todo':
            return (_jsx(Container, { children: _jsx(TodoAttachmentDisplay, { attachment: attachment, addMargin: false, verbose: verbose }) }));
        case 'command_permissions':
            return (_jsx(Container, { children: _jsx(CommandPermissionsDisplay, { attachment: attachment, addMargin: false, verbose: verbose }) }));
        case 'async_hook_response':
            return (_jsx(Container, { children: _jsx(HookResponseDisplay, { attachment: attachment, addMargin: false, verbose: verbose }) }));
        case 'async_agent_status':
            return (_jsx(Container, { children: _jsx(AsyncAgentStatusDisplay, { attachment: attachment, addMargin: false, verbose: verbose }) }));
        default:
            // Handle other hook-related attachments
            const anyAttachment = attachment;
            if (anyAttachment.type === 'hook_blocking_error' ||
                anyAttachment.type === 'hook_non_blocking_error' ||
                anyAttachment.type === 'hook_error_during_execution') {
                return (_jsx(Container, { children: _jsx(HookErrorDisplay, { attachment: anyAttachment, addMargin: false, verbose: verbose }) }));
            }
            if (anyAttachment.type === 'hook_success') {
                return (_jsx(Container, { children: _jsx(HookSuccessDisplay, { attachment: anyAttachment, addMargin: false, verbose: verbose }) }));
            }
            if (anyAttachment.type === 'hook_stopped_continuation') {
                return (_jsx(Container, { children: _jsx(HookStoppedDisplay, { attachment: anyAttachment }) }));
            }
            if (anyAttachment.type === 'hook_system_message') {
                return (_jsx(Container, { children: _jsx(HookSystemMessageDisplay, { attachment: anyAttachment }) }));
            }
            if (anyAttachment.type === 'compact_file_reference') {
                return (_jsx(Container, { children: _jsx(CompactFileReferenceDisplay, { attachment: anyAttachment }) }));
            }
            if (anyAttachment.type === 'nested_memory') {
                return (_jsx(Container, { children: _jsx(NestedMemoryDisplay, { attachment: anyAttachment }) }));
            }
            if (anyAttachment.type === 'queued_command') {
                return (_jsx(Container, { children: _jsx(QueuedCommandDisplay, { attachment: anyAttachment, addMargin: false, verbose: verbose }) }));
            }
            // Unknown attachment type
            return null;
    }
};
// ============================================================================
// Exports
// ============================================================================
export default Attachment;
//# sourceMappingURL=Attachment.js.map