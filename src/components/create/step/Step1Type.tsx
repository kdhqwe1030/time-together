import { useCreateStore } from "@/src/stores/createStore";
import CreateItem from "../ui/CreateItem";
import QuestionHeader from "../ui/QuestionHeader";

const Step1Type = () => {
  const { next, setMeetingType } = useCreateStore();
  return (
    <div className="animate-fade-in">
      <QuestionHeader question="Q. 어떤 일정인가요?" />

      <div>
        <CreateItem
          number={1}
          text="한 번만 만나요 "
          onClick={() => {
            next();
            setMeetingType("ONE");
          }}
        />
        <CreateItem
          number={2}
          text="정기적으로 만나요"
          onClick={() => {
            next();
            setMeetingType("RECURRING");
          }}
        />
      </div>
    </div>
  );
};

export default Step1Type;
