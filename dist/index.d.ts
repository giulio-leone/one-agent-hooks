import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React from 'react';

/**
 * OneAgent Hooks - Type Definitions
 *
 * Types for client-side streaming and progress tracking.
 * Compatible with AI SDK v6 UIMessageChunk format.
 *
 * @package @onecoach/one-agent-hooks
 * @version 0.1.0
 */
/**
 * Progress field populated by AI during execution.
 * This is the client-side representation of ProgressFieldSchema.
 */
interface ProgressField {
    /** Internal step identifier (e.g., "tool:searchFlights") */
    step: string;
    /** User-friendly message in user's language */
    userMessage: string;
    /** Technical details for admin/debug view */
    adminDetails?: string;
    /** Estimated progress percentage (0-100) */
    estimatedProgress: number;
    /** Icon hint for UI rendering */
    iconHint?: 'search' | 'analyze' | 'compare' | 'filter' | 'loading' | 'success' | 'error';
    /** Tool name if this is a tool-related event */
    toolName?: string;
}
/**
 * Agent event types for streaming
 */
type AgentEventType = 'agent_start' | 'step_start' | 'step_complete' | 'tool_call' | 'tool_result' | 'ai_progress' | 'partial_output' | 'agent_complete' | 'error';
/**
 * Agent event received from SSE stream
 */
interface AgentEvent {
    type: AgentEventType;
    timestamp: Date;
    data: ProgressField;
}
/**
 * State managed by useAgentStream hook
 */
interface AgentStreamState<TOutput> {
    /** Current streaming status */
    status: 'idle' | 'connecting' | 'streaming' | 'complete' | 'error';
    /** Current progress percentage (0-100) */
    progress: number;
    /** Current step identifier */
    currentStep: string;
    /** User-friendly message for current action */
    userMessage: string;
    /** All events received during streaming */
    events: ProgressField[];
    /** Final result when complete */
    result: TOutput | null;
    /** Error message if failed */
    error: string | null;
    /** Workflow run ID for resume capability */
    runId: string | null;
}
/**
 * Options for useAgentStream hook
 */
interface UseAgentStreamOptions {
    /** Include admin details in events (for debugging) */
    adminMode?: boolean;
    /** Maximum number of events to keep in state (default: 50) */
    maxEvents?: number;
    /** Auto-retry on connection failure */
    autoRetry?: boolean;
    /** Max retry attempts (default: 3) */
    maxRetries?: number;
}
/**
 * Return type of useAgentStream hook
 */
interface UseAgentStreamReturn<TOutput, TInput> extends AgentStreamState<TOutput> {
    /** Execute the agent with input */
    execute: (input: TInput) => Promise<void>;
    /** Abort current execution */
    abort: () => void;
    /** Reset state to initial */
    reset: () => void;
    /** Whether currently loading (connecting or streaming) */
    isLoading: boolean;
    /** Latest event received */
    latestEvent: ProgressField | null;
}
/**
 * Admin mode state
 */
interface AdminModeState {
    /** Whether admin mode is enabled */
    isAdmin: boolean;
    /** Toggle admin mode */
    toggle: () => void;
    /** Enable admin mode */
    enable: () => void;
    /** Disable admin mode */
    disable: () => void;
}

/**
 * useAgentStream - React hook for streaming agent execution
 *
 * Consumes SSE stream from OneAgent SDK 4.1 durable agents.
 * Provides real-time progress updates and final results.
 *
 * @example
 * ```tsx
 * const { execute, progress, userMessage, result, isLoading } = useAgentStream<
 *   FlightSearchResult,
 *   FlightSearchInput
 * >('/api/flight/smart-search/stream');
 *
 * // Execute search
 * await execute({ flyFrom: ['FCO'], flyTo: ['CDG'], ... });
 *
 * // UI updates in real-time via progress, userMessage, events
 * ```
 *
 * @package @onecoach/one-agent-hooks
 */

/**
 * Hook for streaming agent execution with real-time progress.
 *
 * @param endpoint - API endpoint that returns SSE stream
 * @param options - Configuration options
 */
declare function useAgentStream<TOutput, TInput = unknown>(endpoint: string, options?: UseAgentStreamOptions): UseAgentStreamReturn<TOutput, TInput>;

/**
 * useAdminMode - React hook for admin/debug mode toggle
 *
 * Persists state to localStorage for consistency across sessions.
 * Used to show/hide technical details in agent progress UI.
 *
 * @example
 * ```tsx
 * const { isAdmin, toggle } = useAdminMode();
 *
 * return (
 *   <>
 *     <Switch checked={isAdmin} onCheckedChange={toggle} />
 *     {isAdmin && <pre>{event.adminDetails}</pre>}
 *   </>
 * );
 * ```
 *
 * @package @onecoach/one-agent-hooks
 */

/**
 * Hook for managing admin/debug mode state.
 *
 * @param defaultValue - Initial value if not in localStorage (default: false)
 */
declare function useAdminMode(defaultValue?: boolean): AdminModeState;

type IconHint = 'search' | 'analyze' | 'compare' | 'filter' | 'loading' | 'success' | 'error';
interface AgentEventListProps {
    /** Events to display */
    events: ProgressField[];
    /** Whether to show admin details */
    isAdmin?: boolean;
    /** Toggle admin mode callback */
    onToggleAdmin?: () => void;
    /** Maximum events to show (default: all) */
    maxVisible?: number;
    /** Show admin toggle button */
    showAdminToggle?: boolean;
    /** Additional class names */
    className?: string;
    /** Compact mode - single line per event */
    compact?: boolean;
    /** Show timestamps */
    showTimestamps?: boolean;
    /** Custom icon renderer */
    renderIcon?: (iconHint: IconHint | undefined) => React.ReactNode;
}
/**
 * AgentEventList Component
 *
 * Displays a timeline of streaming events from an AI agent.
 * Supports admin mode for showing technical details.
 */
declare function AgentEventList({ events, isAdmin, onToggleAdmin, maxVisible, showAdminToggle, className, compact, showTimestamps, renderIcon, }: AgentEventListProps): react_jsx_runtime.JSX.Element | null;

export { type AdminModeState, type AgentEvent, AgentEventList, AgentEventList as AgentEventListDefault, type AgentEventListProps, type AgentEventType, type AgentStreamState, type IconHint, type ProgressField, type UseAgentStreamOptions, type UseAgentStreamReturn, useAdminMode, useAdminMode as useAdminModeDefault, useAgentStream, useAgentStream as useAgentStreamDefault };
