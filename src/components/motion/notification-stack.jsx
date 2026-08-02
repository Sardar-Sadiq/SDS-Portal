import { ArrowUpRight, BellOff, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useRef,
  useState,
} from "react";
import { ActionSwapText } from "@/components/motion/action-swap";
import { EASE_OUT, SPRING_LAYOUT } from "@/lib/ease";
import { useHoverCapable } from "@/lib/hooks/use-hover-capable";
import { cn } from "@/lib/utils";

const STACK_PEEK = 8;
const STACK_INSET = 12;

function useControllableExpanded({
  expanded,
  defaultExpanded,
  onExpandedChange,
}) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = expanded !== undefined;
  const value = expanded ?? internalExpanded;

  const setValue = useCallback(
    (next) => {
      if (!isControlled) setInternalExpanded(next);
      onExpandedChange?.(next);
    },
    [isControlled, onExpandedChange],
  );

  return [value, setValue];
}

function NotificationCardContent({
  item,
  onDismiss,
  onItemClick,
  classNames,
}) {
  return (
    <span
      onClick={(e) => {
        if (onItemClick) {
          e.stopPropagation();
          onItemClick(item);
        }
      }}
      className={cn(
        "flex min-w-0 flex-col gap-1.5 py-4 cursor-pointer group/card",
        classNames?.content,
      )}
    >
      <span className="flex min-w-0 items-start justify-between gap-3">
        <span
          className={cn(
            "min-w-0 text-sm font-medium leading-snug text-foreground group-hover/card:text-primary transition-colors",
            classNames?.title,
          )}
        >
          {item.title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {item.trailing ? (
            <span
              className={cn("text-[10px] font-mono text-muted-foreground", classNames?.trailing)}
            >
              {item.trailing}
            </span>
          ) : null}
          {onDismiss ? (
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDismiss(item.id);
              }}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </span>
      {item.description ? (
        <span
          className={cn(
            "text-xs leading-relaxed text-muted-foreground",
            classNames?.description,
          )}
        >
          {item.description}
        </span>
      ) : null}
    </span>
  );
}

export function NotificationStack({
  items,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  onViewAll,
  onDismiss,
  onItemClick,
  maxVisible = 3,
  collapsedLabel = "Notifications",
  expandedLabel = "View all",

  className,
  classNames,
}) {
  const reduce = useReducedMotion();
  const canHover = useHoverCapable();
  const hasFocus = useRef(false);
  const [isExpanded, setIsExpanded] = useControllableExpanded({
    expanded,
    defaultExpanded,
    onExpandedChange,
  });

  const visibleItems = items.slice(0, Math.max(1, maxVisible));
  const primaryItem = visibleItems[0];
  const transition = reduce ? { duration: 0 } : SPRING_LAYOUT;
  const cardTransition = reduce
    ? { duration: 0 }
    : { duration: 0.32, ease: EASE_OUT };
  const backgroundTransition = reduce
    ? { duration: 0 }
    : { duration: 0.26, ease: EASE_OUT };

  if (!primaryItem) {
    return (
      <div
        className={cn(
          "flex w-full max-w-[22rem] items-center justify-center gap-2 rounded-3xl bg-muted/70 px-5 py-5 text-sm font-medium text-muted-foreground",
          className,
        )}
      >
        <BellOff className="h-4 w-4" aria-hidden="true" />

      </div>
    );
  }

  const handleBlur = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    hasFocus.current = false;
    setIsExpanded(false);
  };

  const handleKeyDown = (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    setIsExpanded(false);
    event.currentTarget.blur();
  };

  const handleClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      return;
    }

    if (onViewAll) {
      onViewAll();
      return;
    }

    setIsExpanded(false);
  };

  return (
    <motion.button
      type="button"
      initial={false}
      aria-expanded={isExpanded}
      aria-label={
        isExpanded
          ? `${items.length} notifications. ${expandedLabel}.`
          : `${items.length} notifications. Expand notifications.`
      }
      onPointerEnter={() => {
        if (canHover) setIsExpanded(true);
      }}
      onPointerLeave={() => {
        if (canHover && !hasFocus.current) setIsExpanded(false);
      }}
      onFocus={() => {
        hasFocus.current = true;
        setIsExpanded(true);
      }}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      className={cn(
        "relative z-10 block w-full max-w-[22rem] cursor-pointer rounded-3xl text-left text-foreground outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {/* Invisible first card for footprint */}
      <span aria-hidden="true" className="invisible block p-3">
        <span className="block">
          <span
            className={cn(
              "block rounded-2xl border border-transparent px-4",
              classNames?.card,
            )}
          >
            <NotificationCardContent
              item={primaryItem}
              classNames={classNames}
            />
          </span>
        </span>
        <span className="mt-2 block h-9" />
      </span>

      <span className="absolute inset-x-0 bottom-0 block p-3">
        <motion.span
          aria-hidden="true"
          layout
          initial={false}
          transition={backgroundTransition}
          className="absolute inset-0 rounded-3xl bg-card border border-border shadow-xl backdrop-blur-xl"
        />
        <span
          className={cn(
            "relative z-10 grid gap-1",
            !isExpanded && "pb-2",
            classNames?.stack,
          )}
        >
          {visibleItems.map((item, index) => {
            const isPrimary = index === 0;

            return (
              <motion.span
                key={item.id}
                layout="position"
                initial={false}
                animate={{
                  y: isExpanded ? 0 : index * STACK_PEEK,
                  clipPath: isExpanded
                    ? "inset(0px 0px round 16px)"
                    : `inset(0px ${index * STACK_INSET}px round 16px)`,
                }}
                transition={cardTransition}
                className={cn(
                  "block rounded-2xl border border-border/80 bg-background/95 px-4 shadow-sm",
                  classNames?.card,
                )}
                style={{
                  zIndex: visibleItems.length - index,
                  gridColumn: 1,
                  gridRow: isExpanded ? index + 1 : 1,
                }}
              >
                <span
                  className={cn(
                    "block",
                    !isPrimary && !isExpanded && "invisible",
                  )}
                >
                  <NotificationCardContent
                    item={item}
                    onDismiss={onDismiss}
                    onItemClick={onItemClick}
                    classNames={classNames}
                  />
                </span>
              </motion.span>
            );
          })}
        </span>

        <motion.span
          layout="position"
          transition={transition}
          className={cn(
            "relative z-10 mt-2 flex min-h-9 items-center gap-2 px-1",
            classNames?.footer,
          )}
        >
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-md",
              classNames?.count,
            )}
          >
            {items.length}
          </span>
          <span className="flex items-center text-sm font-semibold text-foreground">
            <ActionSwapText
              value={isExpanded ? "expanded" : "collapsed"}
              animation="roll"
            >
              {isExpanded ? (
                <span className="inline-flex items-center gap-1">
                  {expandedLabel}
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </span>
              ) : (
                collapsedLabel
              )}
            </ActionSwapText>
          </span>
        </motion.span>
      </span>
    </motion.button>
  );
}
