import Image from 'next/image';

export default function LPULogo() {
  return (
    <div className="w-10 h-10 mr-3 bg-white rounded-full flex items-center justify-center shadow-md overflow-hidden">
      <Image
        src="/lpu-logo-mini.png"
        alt="LPU Logo"
        width={40}
        height={40}
        className="object-contain"
        priority
      />
    </div>
  );
}