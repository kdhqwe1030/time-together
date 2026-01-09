const Tag = ({ text }: { text: string }) => {
  return (
    <div>
      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
        {text}
      </span>
    </div>
  );
};

export default Tag;
