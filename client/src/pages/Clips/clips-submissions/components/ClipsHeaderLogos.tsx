import NoonBlackLogo from "@/assets/noon-black-logo.svg";

export default function ClipsHeaderLogos() {
  return (
    <div className={`flex items-center justify-center`}>
      <div className="w-24 h-8 flex items-center justify-center overflow-hidden">
        <img
          src={NoonBlackLogo}
          alt="Noon Logo"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}
