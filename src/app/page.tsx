import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen min-w-full flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/95">
      <main className="flex flex-col items-center justify-center text-center px-6 max-w-md mx-auto">
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="Sofia Spelar Badminton Logo"
            width={200}
            height={200}
            className="mb-4"
          />
        </div>
        
        {/* <p className="text-lg text-foreground/70 mb-8 leading-relaxed">
          En speciell bröllopspresent
          <br />
          Gjord med kärlek 💕
        </p> */}
        
        <Link
          href="/game"
          className="bg-foreground text-background px-8 py-4 rounded-full font-medium text-lg transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
        >
          Tryck för att spela
        </Link>
      </main>
    </div>
  );
}
