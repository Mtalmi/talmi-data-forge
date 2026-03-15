import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

// Wrap toast.error to persist errors (no auto-dismiss)
const originalError = toast.error.bind(toast);
toast.error = (message: Parameters<typeof originalError>[0], opts?: Parameters<typeof originalError>[1]) =>
  originalError(message, { duration: Infinity, ...opts });

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      closeButton
      richColors
      duration={4000}
      style={{ zIndex: 9999 }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:shadow-lg group-[.toaster]:border-border",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton: "group-[.toast]:text-foreground/50 group-[.toast]:hover:text-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
