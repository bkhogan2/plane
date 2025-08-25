"use client";

import { observer } from "mobx-react";
import { Breadcrumbs, Header } from "@plane/ui";
import { useTranslation } from "@plane/i18n";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { PiChatLogo } from "@plane/ui";

export const PiChatHeader = observer(() => {
  const { t } = useTranslation();

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-2">
          <Breadcrumbs>
            <Breadcrumbs.Item component={<BreadcrumbLink label={t("pi_chat")} icon={<PiChatLogo className="h-4 w-4 text-custom-text-300" />} />} />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>{/* Intentionally empty for now */}</Header.RightItem>
    </Header>
  );
});


