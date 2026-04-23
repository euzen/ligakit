import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="size-3.5 shrink-0 opacity-50" />}
            {isLast || !item.href ? (
              <span className={isLast ? "font-medium text-foreground" : ""}>
                {index === 0 && <Home className="size-3.5 inline mr-1 -mt-0.5" />}
                {item.label}
              </span>
            ) : (
              <a
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {index === 0 && <Home className="size-3.5 inline mr-1 -mt-0.5" />}
                {item.label}
              </a>
            )}
          </span>
        );
      })}
    </nav>
  );
}
