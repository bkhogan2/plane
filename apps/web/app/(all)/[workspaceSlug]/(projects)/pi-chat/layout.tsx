"use client";

import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { PiChatHeader } from "./header";

export default function PiChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<PiChatHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}


