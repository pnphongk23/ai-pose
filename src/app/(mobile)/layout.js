export default function MobileLayout({ children }) {
  return (
    <div className="h-full w-full max-w-[430px] mx-auto relative overflow-hidden">
      {children}
    </div>
  );
}
