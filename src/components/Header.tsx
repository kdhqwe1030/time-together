"use client";
const Header = () => {
  return (
    <div className="bg-surface border-b border-border px-5 py-4 flex justify-between items-center">
      <h1 className="text-lg font-bold text-primary">언제 모임?</h1>
      <button className="text-muted text-sm hover:text-text">공유</button>
    </div>
  );
};

export default Header;
