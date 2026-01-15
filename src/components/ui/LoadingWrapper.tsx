import Image from "next/image";

const LoadingWrapper = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center z-50 bg-white">
      <Image
        src={"/loadingLogo.webp"}
        alt="로고"
        width={60}
        height={60}
        className="jello-horizontal"
      />
    </div>
  );
};

export default LoadingWrapper;
