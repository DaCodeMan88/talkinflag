import Image from "next/image";

export function HeroTwins() {
  return (
    <>
      {/* Ambra (#16) — gazes right toward the text */}
      <div
        className="hidden lg:block absolute bottom-0 left-0 z-[5] w-[21vw] max-w-[270px] select-none pointer-events-none"
        style={{
          maskImage: "linear-gradient(to right, black 50%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, black 50%, transparent 100%)",
        }}
      >
        <Image
          src="/twin-left.png"
          alt="Ambra Marcucci, Italian national team"
          width={768}
          height={2048}
          className="w-full h-auto object-contain"
          priority
        />
      </div>

      {/* Tika (#12) — gazes left toward the text */}
      <div
        className="hidden lg:block absolute bottom-0 right-0 z-[5] w-[21vw] max-w-[270px] select-none pointer-events-none"
        style={{
          maskImage: "linear-gradient(to left, black 50%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to left, black 50%, transparent 100%)",
        }}
      >
        <Image
          src="/twin-right.png"
          alt="Tika Marcucci, Italian national team"
          width={768}
          height={2048}
          className="w-full h-auto object-contain"
          priority
        />
      </div>
    </>
  );
}
