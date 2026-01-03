import { useCreateStore } from "@/src/stores/createStore";
import QuestionHeader from "../ui/QuestionHeader";
import CreateButton from "../ui/CreateButton";
import { useState } from "react";

const Step2Title = () => {
  const { next, setTitle } = useCreateStore();
  const [input, setInput] = useState("");
  return (
    <div className="animate-fade-in">
      <QuestionHeader question="Q. 모임 이름을 알려주세요" />
      <div>
        <input
          className="w-full p-4 text-left bg-surface border border-border rounded-lg hover:border-primary hover:bg-bg active:border-primary  active:bg-bg transition-all mb-12"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
          }}
          placeholder="예: 연말 모임"
        />
        <CreateButton
          disabled={input === ""}
          onClick={() => {
            next();
            setTitle(input);
          }}
        >
          다음
        </CreateButton>
      </div>
    </div>
  );
};

export default Step2Title;
