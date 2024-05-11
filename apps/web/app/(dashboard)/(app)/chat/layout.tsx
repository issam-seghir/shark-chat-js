"use client";
import { useParams, usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";
import { button } from "ui/components/button";
import { SettingsIcon, XIcon } from "lucide-react";
import { Avatar } from "ui/components/avatar";
import { useGroup } from "@/app/(dashboard)/(app)/chat/[group]/use-group";
import { groupIcon } from "shared/media/format";
import { cn } from "ui/utils/cn";

export default function Layout({ children }: { children: React.ReactNode }) {
  const params = useParams() as { group: string };
  const pathname = usePathname();
  const isSettings = pathname?.endsWith("/settings");

  return (
    <div
      className={cn(
        "relative flex flex-col-reverse",
        isSettings ? "flex-col h-full min-h-screen" : "overflow-auto h-dvh",
      )}
    >
      <div className="flex flex-col flex-1">
        <Navbar
          breadcrumb={[
            {
              id: "group",
              text: <BreadcrumbItem />,
            },
          ]}
        >
          {isSettings ? (
            <Link
              href={`/chat/${params.group}`}
              aria-label="Back to Chat"
              scroll={false}
              className={button({ size: "icon", color: "ghost" })}
            >
              <XIcon className="size-5" />
            </Link>
          ) : (
            <Link
              aria-label="Settings"
              href={`/chat/${params.group}/settings`}
              className={button({
                size: "icon",
                color: "ghost",
              })}
            >
              <SettingsIcon className="size-5" />
            </Link>
          )}
        </Navbar>
        {children}
      </div>
    </div>
  );
}

function BreadcrumbItem() {
  const { group } = useParams() as { group: string };
  const info = useGroup(group);

  if (!info) {
    return <div className="w-28 h-5 rounded-lg bg-muted" />;
  }

  return (
    <div className="flex flex-row gap-2 items-center">
      <Avatar
        size="small"
        src={groupIcon.url([info.id], info.icon_hash)}
        alt="icon"
        fallback={info.name}
      />
      <span>{info.name}</span>
    </div>
  );
}
