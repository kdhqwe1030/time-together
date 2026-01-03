interface CreateButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
}

export default function CreateButton({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  className = "",
}: CreateButtonProps) {
  const baseStyles =
    "w-full py-4 px-6 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-lg hover:-translate-y-0.5",
    secondary:
      "bg-surface text-text border-2 border-border hover:border-primary hover:bg-bg",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
