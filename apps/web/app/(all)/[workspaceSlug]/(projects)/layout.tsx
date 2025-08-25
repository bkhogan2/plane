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

  const { data: user } = useUser();
  const { currentWorkspace } = useWorkspace();

  // Mount Assistant plugin in right dock if enabled
  useEffect(() => {
    if (!enableOmniDock || !enableOmniAssistant) return;
    const root = document.getElementById("omni-assistant-root");
    if (!root) return;

    const scriptId = "assistant-plugin-script";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    const scriptUrl = `${assistantOrigin.replace(/\/$/, "")}/plugins/assistant/index.js`;

    const render = () => {
      // @ts-expect-error - runtime global provided by plugin
      const api = (window as any).AssistantPlugin;
      if (api?.renderAssistant) {
        api.renderAssistant(root, {
          workspaceId: currentWorkspace?.id,
          projectId: undefined,
          userId: user?.id,
        });
      } else {
        if (root.innerHTML === "") root.innerHTML = '<div class="p-3 text-xs text-custom-text-300">Assistant unavailable</div>';
      }
    };

    if (existing) {
      render();
      return;
    }

    const s = document.createElement("script");
    s.src = scriptUrl;
    s.async = true;
    s.id = scriptId;
    s.onload = render;
    s.onerror = () => {
      if (root.innerHTML === "") root.innerHTML = '<div class="p-3 text-xs text-custom-text-300">Assistant failed to load</div>';
    };
    document.body.appendChild(s);

    return () => {
      // optional unmount if plugin exposes it
      // @ts-expect-error - runtime global provided by plugin
      const api = (window as any).AssistantPlugin;
      if (api?.unmountAssistant) api.unmountAssistant(root);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableOmniDock, enableOmniAssistant, currentWorkspace?.id, user?.id]);

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
