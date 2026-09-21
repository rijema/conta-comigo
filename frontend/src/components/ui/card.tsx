import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return onClick ? (
    <button
      className={cn(
        "bg-white rounded-2xl shadow-sm border border-gray-100 p-4",
        "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  ) : (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-sm border border-gray-100 p-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn("mb-3", className)}>{children}</div>
  );
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h3 className={cn("font-semibold text-gray-800 text-base", className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn("", className)}>{children}</div>;
}