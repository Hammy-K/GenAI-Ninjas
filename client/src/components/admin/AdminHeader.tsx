import logoImage from "@/assets/noon-black-logo.svg";

export default function AdminHeader() {
  return (
    <header className="h-8 shrink-0 bg-white flex items-center justify-center px-4">
      <img
        src={logoImage}
        alt="GenAI Quest Logo"
        className="h-4 object-contain"
      />
    </header>
  );
}
