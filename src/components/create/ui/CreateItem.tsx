interface CreateItemProps {
  number: number;
  text: string;
  onClick?: () => void;
}

export default function CreateItem({ number, text, onClick }: CreateItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 text-left bg-surface border border-border rounded-lg hover:border-primary hover:bg-bg active:border-primary  active:bg-bg transition-all mb-4"
    >
      <span className="text-muted mr-3">{number}.</span>
      <span className="text-text font-medium">{text}</span>
    </button>
  );
}
