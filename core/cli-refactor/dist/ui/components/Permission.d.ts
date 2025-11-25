/**
 * @fileoverview Permission dialog components for the CLI UI
 * @module ui/components/Permission
 *
 * This module provides React components for rendering permission
 * dialogs and confirmations in the terminal, including tool use
 * permissions and sandbox permissions.
 */
import React from 'react';
import type { PermissionDialogProps, SandboxPermissionProps } from '../types.js';
/**
 * Props for keyboard hint display
 */
interface KeyHintProps {
    keyName: string;
    action: string;
    separator?: string;
}
/**
 * Renders a keyboard shortcut hint
 */
export declare const KeyHint: React.FC<KeyHintProps>;
/**
 * Props for key hints row
 */
interface KeyHintsRowProps {
    hints: Array<{
        key: string;
        action: string;
    }>;
}
/**
 * Renders a row of keyboard hints
 */
export declare const KeyHintsRow: React.FC<KeyHintsRowProps>;
/**
 * Renders a divider line
 */
export declare const Divider: React.FC<{
    width?: number;
    char?: string;
}>;
/**
 * Props for risk badge
 */
interface RiskBadgeProps {
    level: 'low' | 'medium' | 'high';
}
/**
 * Renders a colored risk level badge
 */
export declare const RiskBadge: React.FC<RiskBadgeProps>;
/**
 * Props for tool info display
 */
interface ToolInfoDisplayProps {
    toolName: string;
    input: Record<string, unknown>;
    verbose?: boolean;
}
/**
 * Renders tool information with input parameters
 */
export declare const ToolInfoDisplay: React.FC<ToolInfoDisplayProps>;
/**
 * Tool permission dialog component.
 * Shows a dialog for approving or denying tool use requests.
 *
 * @param props - Permission dialog props
 * @returns Rendered permission dialog
 *
 * @example
 * ```tsx
 * <ToolPermissionDialog
 *   toolUseConfirm={confirmRequest}
 *   toolUseContext={context}
 *   onDone={() => handleDone()}
 *   onReject={(reason) => handleReject(reason)}
 *   verbose={false}
 * />
 * ```
 */
export declare const ToolPermissionDialog: React.FC<PermissionDialogProps>;
/**
 * Sandbox permission dialog component.
 * Shows a dialog for approving network/sandbox access.
 *
 * @param props - Sandbox permission props
 * @returns Rendered sandbox permission dialog
 *
 * @example
 * ```tsx
 * <SandboxPermissionDialog
 *   hostPattern={{ host: 'api.example.com', port: 443 }}
 *   onUserResponse={(response) => handleResponse(response)}
 * />
 * ```
 */
export declare const SandboxPermissionDialog: React.FC<SandboxPermissionProps>;
/**
 * Props for elicitation dialog
 */
interface ElicitationDialogProps {
    serverName: string;
    request: unknown;
    onResponse: (action: string, content?: unknown) => void;
    signal: AbortSignal;
}
/**
 * Elicitation dialog component.
 * Shows a dialog for MCP server information requests.
 */
export declare const ElicitationDialog: React.FC<ElicitationDialogProps>;
/**
 * Props for cost threshold dialog
 */
interface CostThresholdDialogProps {
    onDone: () => void;
}
/**
 * Cost threshold acknowledgment dialog.
 * Shown when API costs exceed a threshold.
 */
export declare const CostThresholdDialog: React.FC<CostThresholdDialogProps>;
export default ToolPermissionDialog;
export { ToolPermissionDialog as PermissionDialog };
//# sourceMappingURL=Permission.d.ts.map