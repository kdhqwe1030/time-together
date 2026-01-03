import { useCreateStore } from "@/src/stores/createStore";
import { IoArrowBack } from "react-icons/io5";

const BackButton = () => {
  const { back } = useCreateStore();

  return (
    <button
      className="absolute bottom-5 left-3 rounded-full p-3 shadow-lg shadow-black/20 bg-white"
      onClick={back}
    >
      <IoArrowBack className="text-color-text" size={20} />
    </button>
  );
};

export default BackButton;
