import { useCreateStore } from "@/src/stores/createStore";
import { IoArrowBack } from "react-icons/io5";

const BackButton = () => {
  const { back } = useCreateStore();

  return (
    <div className="fixed bottom-5 left-0 right-0 max-w-2xl mx-auto px-3 z-40 pointer-events-none">
      <button
        className="rounded-full p-3 shadow-lg shadow-black/20 bg-white pointer-events-auto"
        onClick={back}
      >
        <IoArrowBack className="text-color-text" size={20} />
      </button>
    </div>
  );
};

export default BackButton;
