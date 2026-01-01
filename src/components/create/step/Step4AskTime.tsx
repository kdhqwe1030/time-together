import { useCreateStore } from "@/src/stores/createStore";
import CreateItem from "../ui/CreateItem";
import QuestionHeader from "../ui/QuestionHeader";

const Step4AskTime = () => {
  const { next, setMeetingType } = useCreateStore();

  return (
    <div className="animate-fade-in">
      <QuestionHeader question="Q. 시간까지 정할까요?" />
      <div>
        <CreateItem
          number={1}
          text="날짜만 받을래요"
          onClick={() => {
            next();
            setMeetingType("ONE");
          }}
        />
        <CreateItem
          number={2}
          text="시간도 함께 정할래요"
          onClick={() => {
            next();
            setMeetingType("RECURRING");
          }}
        />
      </div>
    </div>
  );
};

export default Step4AskTime;
