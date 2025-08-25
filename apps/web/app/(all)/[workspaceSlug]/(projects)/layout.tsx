"use client";

import { CommandPalette } from "@/components/command-palette";
import { useEffect } from "react";
import { useUser } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
// plane web components
import { WorkspaceAuthWrapper } from "@/plane-web/layouts/workspace-wrapper";
import { ProjectAppSidebar } from "./_sidebar";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const enableOmniDock =
    process.env.NEXT_PUBLIC_ENABLE_OMNI_DOCK === "1" ||
    process.env.NEXT_PUBLIC_ENABLE_OMNI_DOCK === "true";
  const enableOmniAssistant =
    process.env.NEXT_PUBLIC_ENABLE_OMNI_ASSISTANT === "1" ||
    process.env.NEXT_PUBLIC_ENABLE_OMNI_ASSISTANT === "true";

  const assistantOrigin = process.env.NEXT_PUBLIC_OMNI_PROXY_ORIGIN || "http://localhost:8080";
  const librechatApiBase = process.env.NEXT_PUBLIC_LIBRECHAT_API_BASE;
  const librechatWsBase = process.env.NEXT_PUBLIC_LIBRECHAT_WS_BASE;
  const librechatClientUrl =
    process.env.NEXT_PUBLIC_LIBRECHAT_CLIENT_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:3081" : undefined);

  const { data: user } = useUser();
  const { currentWorkspace } = useWorkspace();

  // Mount Assistant plugin in right dock if enabled
  useEffect(() => {
    // Mount whenever the dock is visible; assistant flag may be toggled at build time
    if (!enableOmniDock) return;
    const getRoot = () => document.getElementById("omni-assistant-root") as HTMLElement | null;

    const scriptId = "assistant-plugin-script";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    const scriptUrl = `${assistantOrigin.replace(/\/$/, "")}/plugins/assistant/index.js`;

    const render = () => {
      const root = getRoot();
      if (!root) return;
      // @ts-expect-error - runtime global provided by plugin
      const api = (window as any).AssistantPlugin;
      if (api?.renderAssistant) {
        api.renderAssistant(root, {
          workspaceId: currentWorkspace?.id,
          projectId: undefined,
          userId: user?.id,
          apiBase: librechatApiBase,
          wsBase: librechatWsBase,
          clientUrl: librechatClientUrl,
        });
      } else {
        // Fallback: mount iframe directly so the dock never looks empty in dev
        if (librechatClientUrl) {
          root.innerHTML = "";
          const iframe = document.createElement("iframe");
          iframe.src = String(librechatClientUrl);
          iframe.style.width = "100%";
          iframe.style.height = "100%";
          iframe.style.border = "0";
          root.appendChild(iframe);
        } else {
          if (root.innerHTML === "") root.innerHTML = '<div class="p-3 text-xs text-custom-text-300">Assistant unavailable</div>';
        }
      }
    };

    if (existing) {
      // If the script tag exists but the global is missing (HMR/navigation), reload the script
      // @ts-expect-error - runtime global provided by plugin
      const api = (window as any).AssistantPlugin;
      if (!api) {
        existing.parentElement?.removeChild(existing);
      } else {
        render();
        return;
      }
    }

    const s = document.createElement("script");
    s.src = scriptUrl;
    s.async = true;
    s.id = scriptId;
    s.onload = render;
    s.onerror = () => {
      const root = getRoot();
      if (root && root.innerHTML === "") root.innerHTML = '<div class="p-3 text-xs text-custom-text-300">Assistant failed to load</div>';
    };
    const rootNow = getRoot();
    if (rootNow && rootNow.innerHTML === "") rootNow.innerHTML = '<div class="p-3 text-xs text-custom-text-300">Loading assistant…</div>';
    document.body.appendChild(s);

    // Retry render until root and plugin are ready (handles streaming/async layouts)
    const start = Date.now();
    const interval = window.setInterval(() => {
      try {
        render();
        // stop once something is mounted
        const r = getRoot();
        if (r && (r.querySelector("iframe") || r.innerHTML.includes("Assistant unavailable"))) {
          window.clearInterval(interval);
        }
        if (Date.now() - start > 10000) {
          window.clearInterval(interval);
        }
      } catch {}
    }, 500);

    return () => {
      // optional unmount if plugin exposes it
      // @ts-expect-error - runtime global provided by plugin
      const api = (window as any).AssistantPlugin;
      const root = getRoot();
      if (api?.unmountAssistant && root) api.unmountAssistant(root);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableOmniDock, enableOmniAssistant, currentWorkspace?.id, user?.id, assistantOrigin, librechatClientUrl]);

  return (
    <AuthenticationWrapper>
      <CommandPalette />
      <WorkspaceAuthWrapper>
        <div className="relative flex flex-col h-full w-full overflow-hidden rounded-lg border border-custom-border-200">
          <div id="full-screen-portal" className="inset-0 absolute w-full" />
          <div className="relative flex size-full overflow-hidden">
            <ProjectAppSidebar />
            <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
              {children}
            </main>
            {enableOmniDock && (
              <aside
                id="omni-assistant-dock"
                className="relative h-full w-[400px] shrink-0 border-l border-custom-border-200 bg-custom-background-100"
              >
                <div id="omni-assistant-root" className="h-full w-full" />
              </aside>
            )}
          </div>
        </div>
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}
