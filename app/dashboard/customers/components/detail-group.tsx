import { Children, Fragment } from "react";
import { Separator } from "@/components/ui/separator";

export function DetailGroup({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const items = Children.toArray(children);

  return (
    <div className="space-y-3">
      {title && <h3 className="font-semibold text-lg">{title}</h3>}

      <div className="bg-muted/30 rounded-xl border overflow-hidden">
        {items.map((child, index) => (
          <Fragment key={index}>
            {child}
            {index < items.length - 1 && (
              <div className="ml-14">
                <Separator className="w-auto" />
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
