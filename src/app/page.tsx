import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Theme Switcher</h1>
        <ThemeSwitcher />
      </div>
    </div>
  );
}
