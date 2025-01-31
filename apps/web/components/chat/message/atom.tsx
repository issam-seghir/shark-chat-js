import { forwardRef, ReactNode, useMemo } from "react";
import { Avatar } from "ui/components/avatar";
import * as ContextMenu from "ui/components/context-menu";
import { getTimeString } from "ui/utils/time";
import { MessageType } from "@/utils/types";
import { usePageStore } from "@/utils/stores/page";
import { DropdownMenu, DropdownMenuTrigger } from "ui/components/dropdown";
import { MoreHorizontalIcon } from "lucide-react";
import { button } from "ui/components/button";
import { tv } from "tailwind-variants";
import { render } from "@/components/chat/message/markdown";
import { useMessageStore } from "@/utils/stores/chat";
import { cn } from "ui/utils/cn";
import type { UserInfo } from "shared/schema/chat";

interface ContentProps extends React.HTMLAttributes<HTMLDivElement> {
  user: MessageType["author"];
  chainStart: boolean;
  timestamp: string | Date | number;
  chainEnd: boolean;
}

const contentVariants = tv({
  base: "relative group px-6 text-[15px] data-[state=open]:bg-card hover:bg-card",
  variants: {
    chain: {
      head: "flex flex-row items-start gap-2 pt-2",
      body: "flex flex-col gap-2 py-0.5",
    },
  },
});

const defaultUser: UserInfo = {
  id: "",
  image: null,
  name: "Deleted User",
};

export const Content = forwardRef<HTMLDivElement, ContentProps>(
  ({ user, timestamp, className, chainStart, chainEnd, ...props }, ref) => {
    const author = user ?? defaultUser;
    const status = useMessageStore((s) => s.status[author.id]) ?? {
      type: "offline",
    };
    const date = new Date(timestamp);

    const onOpenProfile = () => {
      usePageStore.getState().setModal({ user_id: author.id, open: true });
    };

    if (!chainStart) {
      return (
        <div
          ref={ref}
          className={contentVariants({
            chain: "body",
            className: [chainEnd && "pb-4", className],
          })}
          {...props}
        >
          <div className="flex flex-col pl-12">{props.children}</div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={contentVariants({
          chain: "head",
          className: [chainEnd && "pb-4", className],
        })}
        {...props}
      >
        <div className="relative cursor-pointer">
          <Avatar
            src={author.image}
            fallback={author.name}
            onClick={onOpenProfile}
          />
          <div
            aria-label={status.type}
            className={cn(
              "absolute right-0 bottom-1 size-3 rounded-full border-2",
              status.type === "online" ? "bg-green-400" : "bg-red-400",
            )}
          />
        </div>
        <div className="flex-1 flex flex-col w-0">
          <div className="flex flex-row items-center gap-2 mb-1">
            <p
              className="text-nowrap truncate font-medium cursor-pointer"
              onClick={onOpenProfile}
            >
              {author.name}
            </p>

            <p className="text-xs text-muted-foreground">
              {getTimeString(date)}
            </p>
          </div>
          {props.children}
        </div>
      </div>
    );
  },
);

Content.displayName = "MessageContent";

export function Menu() {
  return (
    <DropdownMenuTrigger
      aria-label="Open Menu"
      className={button({
        size: "icon",
        className:
          "absolute -top-2 right-4 opacity-0 group-hover:opacity-100 radix-state-open:opacity-100",
      })}
    >
      <MoreHorizontalIcon className="size-4" />
    </DropdownMenuTrigger>
  );
}

type RootProps = {
  children: ReactNode;
};

export function Root({ children }: RootProps) {
  return (
    <ContextMenu.Root>
      <DropdownMenu>{children}</DropdownMenu>
    </ContextMenu.Root>
  );
}

export function Text({ children }: { children: string }) {
  const output = useMemo(() => render(children), [children]);

  return (
    <div className="prose prose-message text-[15px] break-words overflow-hidden">
      {output}
    </div>
  );
}
