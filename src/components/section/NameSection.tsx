import { ChangeEventHandler } from "react";
import { MdMode } from "react-icons/md";

const NameSection = ({
  isMod,
  name,
  onChange,
  onBlur,
  changeMode,
}: {
  isMod: boolean;
  name: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onBlur: () => void;
  changeMode: () => void;
}) => {
  return (
    <section className="rounded-2xl shadow shadow-black/10 bg-surface p-4 animate-fade-in">
      <div className="text-sm font-semibold text-text">이름</div>
      {!isMod ? (
        <input
          placeholder="이름을 입력하세요"
          className={[
            "mt-2 w-full rounded-xl border border-border bg-surface px-3 py-3",
            "text-text placeholder:text-muted outline-none",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
          ].join(" ")}
          value={name}
          onChange={onChange}
          onBlur={onBlur}
        />
      ) : (
        <div className="mt-2 text-lg flex items-center gap-4">
          {name}
          <MdMode className="text-primary" onClick={changeMode} />
        </div>
      )}
    </section>
  );
};

export default NameSection;
