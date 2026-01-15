import * as React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';

// src/use-agent-stream.ts
var INITIAL_STATE = () => ({
  status: "idle",
  progress: 0,
  currentStep: "",
  userMessage: "",
  events: [],
  result: null,
  error: null,
  runId: null
});
function useAgentStream(endpoint, options = {}) {
  const { maxEvents = 50, autoRetry = false, maxRetries = 3 } = options;
  const [state, setState] = useState(INITIAL_STATE);
  const abortControllerRef = useRef(null);
  const retryCountRef = useRef(0);
  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    retryCountRef.current = 0;
    setState(INITIAL_STATE);
  }, []);
  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setState((prev) => ({
      ...prev,
      status: "idle",
      userMessage: "Cancelled"
    }));
  }, []);
  const execute = useCallback(
    async (input) => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      setState((prev) => ({
        ...prev,
        status: "connecting",
        progress: 0,
        currentStep: "init",
        userMessage: "Connecting...",
        events: [],
        result: null,
        error: null
      }));
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
          signal: abortControllerRef.current.signal
        });
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }
        const runId = response.headers.get("x-workflow-run-id");
        if (runId) {
          setState((prev) => ({ ...prev, runId }));
        }
        setState((prev) => ({ ...prev, status: "streaming" }));
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) {
          throw new Error("No response body");
        }
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.trim()) continue;
            if (line.startsWith("data: ")) {
              try {
                const jsonStr = line.slice(6);
                if (jsonStr === "[DONE]") {
                  continue;
                }
                const event = JSON.parse(jsonStr);
                if (event.type === "data-progress" || event.type === "ai_progress") {
                  const progressData = event.data;
                  setState((prev) => ({
                    ...prev,
                    progress: progressData.estimatedProgress,
                    currentStep: progressData.step,
                    userMessage: progressData.userMessage,
                    events: [...prev.events.slice(-(maxEvents - 1)), progressData]
                  }));
                } else if (event.type === "finish" || event.type === "agent_complete") {
                  setState((prev) => ({
                    ...prev,
                    status: "complete",
                    progress: 100,
                    userMessage: "Complete!",
                    result: event.output || event.data?.output
                  }));
                } else if (event.type === "error") {
                  throw new Error(event.data?.message || event.error || "Unknown error");
                }
              } catch (parseError) {
                console.debug("[useAgentStream] Parse error:", parseError);
              }
            }
          }
        }
        setState((prev) => {
          if (prev.status === "streaming" && !prev.result) {
            return {
              ...prev,
              status: "complete",
              progress: 100
            };
          }
          return prev;
        });
        retryCountRef.current = 0;
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        if (autoRetry && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.warn(
            `[useAgentStream] Retry ${retryCountRef.current}/${maxRetries}:`,
            errorMessage
          );
          await new Promise((r) => setTimeout(r, 1e3 * Math.pow(2, retryCountRef.current - 1)));
          return execute(input);
        }
        setState((prev) => ({
          ...prev,
          status: "error",
          error: errorMessage,
          userMessage: "Error occurred"
        }));
      }
    },
    [endpoint, maxEvents, autoRetry, maxRetries]
  );
  const latestEvent = state.events.length > 0 ? state.events[state.events.length - 1] ?? null : null;
  return {
    ...state,
    execute,
    abort,
    reset,
    isLoading: state.status === "connecting" || state.status === "streaming",
    latestEvent
  };
}
var use_agent_stream_default = useAgentStream;
var STORAGE_KEY = "oneagent-admin-mode";
function useAdminMode(defaultValue = false) {
  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window === "undefined") {
      return defaultValue;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored !== null ? stored === "true" : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, String(isAdmin));
    } catch {
    }
  }, [isAdmin]);
  const toggle = useCallback(() => {
    setIsAdmin((prev) => !prev);
  }, []);
  const enable = useCallback(() => {
    setIsAdmin(true);
  }, []);
  const disable = useCallback(() => {
    setIsAdmin(false);
  }, []);
  return {
    isAdmin,
    toggle,
    enable,
    disable
  };
}
var use_admin_mode_default = useAdminMode;
var Icons = {
  search: /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx(
    "path",
    {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    }
  ) }),
  analyze: /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx(
    "path",
    {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    }
  ) }),
  compare: /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx(
    "path",
    {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
    }
  ) }),
  filter: /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx(
    "path",
    {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    }
  ) }),
  loading: /* @__PURE__ */ jsxs("svg", { className: "h-4 w-4 animate-spin", fill: "none", viewBox: "0 0 24 24", children: [
    /* @__PURE__ */ jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
    /* @__PURE__ */ jsx(
      "path",
      {
        className: "opacity-75",
        fill: "currentColor",
        d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      }
    )
  ] }),
  success: /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }) }),
  error: /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }),
  default: /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M13 10V3L4 14h7v7l9-11h-7z" }) })
};
function getIconColor(iconHint) {
  switch (iconHint) {
    case "success":
      return "text-emerald-500";
    case "error":
      return "text-red-500";
    case "loading":
      return "text-blue-500";
    case "search":
      return "text-violet-500";
    case "analyze":
      return "text-amber-500";
    case "compare":
      return "text-cyan-500";
    case "filter":
      return "text-indigo-500";
    default:
      return "text-slate-400";
  }
}
function getIconBgColor(iconHint) {
  switch (iconHint) {
    case "success":
      return "bg-emerald-500/10";
    case "error":
      return "bg-red-500/10";
    case "loading":
      return "bg-blue-500/10";
    case "search":
      return "bg-violet-500/10";
    case "analyze":
      return "bg-amber-500/10";
    case "compare":
      return "bg-cyan-500/10";
    case "filter":
      return "bg-indigo-500/10";
    default:
      return "bg-slate-500/10";
  }
}
function AgentEventList({
  events,
  isAdmin = false,
  onToggleAdmin,
  maxVisible,
  showAdminToggle = true,
  className = "",
  compact = false,
  showTimestamps = false,
  renderIcon
}) {
  const visibleEvents = React.useMemo(() => {
    if (!maxVisible || maxVisible >= events.length) {
      return events;
    }
    return events.slice(-maxVisible);
  }, [events, maxVisible]);
  const hiddenCount = events.length - visibleEvents.length;
  const defaultRenderIcon = React.useCallback((iconHint) => {
    const icon = Icons[iconHint || "default"] || Icons.default;
    return icon;
  }, []);
  const iconRenderer = renderIcon || defaultRenderIcon;
  if (events.length === 0) {
    return null;
  }
  return /* @__PURE__ */ jsxs("div", { className: `space-y-2 ${className}`, children: [
    showAdminToggle && onToggleAdmin && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs", children: [
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-medium", children: "Activity" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onToggleAdmin,
          className: `rounded px-2 py-0.5 text-xs font-medium transition-colors ${isAdmin ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20"} `,
          children: isAdmin ? "Admin" : "User"
        }
      )
    ] }),
    hiddenCount > 0 && /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground text-center text-xs", children: [
      hiddenCount,
      " earlier ",
      hiddenCount === 1 ? "event" : "events",
      " hidden"
    ] }),
    /* @__PURE__ */ jsx("div", { className: compact ? "space-y-1" : "space-y-2", children: visibleEvents.map((event, index) => /* @__PURE__ */ jsx(
      EventItem,
      {
        event,
        isAdmin,
        compact,
        showTimestamp: showTimestamps,
        renderIcon: iconRenderer,
        isLatest: index === visibleEvents.length - 1
      },
      `${event.step}-${index}`
    )) })
  ] });
}
function EventItem({
  event,
  isAdmin,
  compact,
  showTimestamp,
  renderIcon,
  isLatest
}) {
  const iconColor = getIconColor(event.iconHint);
  const iconBgColor = getIconBgColor(event.iconHint);
  if (compact) {
    return /* @__PURE__ */ jsxs(
      "div",
      {
        className: `flex items-center gap-2 text-sm ${isLatest ? "text-foreground" : "text-muted-foreground"} `,
        children: [
          /* @__PURE__ */ jsx("span", { className: `${iconColor}`, children: renderIcon(event.iconHint) }),
          /* @__PURE__ */ jsx("span", { className: "truncate", children: event.userMessage }),
          event.estimatedProgress > 0 && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground ml-auto text-xs", children: [
            Math.round(event.estimatedProgress),
            "%"
          ] })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `flex gap-3 rounded-lg p-2 transition-colors ${isLatest ? "bg-primary/5 border-primary/20 border" : "bg-muted/30"} `,
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: `flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconBgColor} ${iconColor} `,
            children: renderIcon(event.iconHint)
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
            /* @__PURE__ */ jsx(
              "p",
              {
                className: `text-sm leading-snug ${isLatest ? "text-foreground font-medium" : "text-muted-foreground"} `,
                children: event.userMessage
              }
            ),
            event.estimatedProgress > 0 && /* @__PURE__ */ jsxs(
              "span",
              {
                className: `shrink-0 text-xs font-medium ${isLatest ? "text-primary" : "text-muted-foreground"} `,
                children: [
                  Math.round(event.estimatedProgress),
                  "%"
                ]
              }
            )
          ] }),
          isAdmin && event.adminDetails && /* @__PURE__ */ jsx("pre", { className: "text-muted-foreground mt-1.5 overflow-x-auto rounded bg-slate-900/50 p-2 font-mono text-xs leading-relaxed dark:bg-slate-950/50", children: event.adminDetails }),
          isAdmin && event.toolName && /* @__PURE__ */ jsx("span", { className: "mt-1.5 inline-flex items-center rounded bg-violet-500/10 px-1.5 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-400", children: event.toolName }),
          showTimestamp && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1 text-xs", children: (/* @__PURE__ */ new Date()).toLocaleTimeString() })
        ] })
      ]
    }
  );
}
var agent_event_list_default = AgentEventList;

export { AgentEventList, agent_event_list_default as AgentEventListDefault, useAdminMode, use_admin_mode_default as useAdminModeDefault, useAgentStream, use_agent_stream_default as useAgentStreamDefault };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map