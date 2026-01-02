export default function QuestionHeader({ question }: { question: string }) {
  return (
    <div className="mt-4 mb-8">
      <h2 className="text-xl font-semibold text-text leading-tight">
        {question}
      </h2>
    </div>
  );
}
