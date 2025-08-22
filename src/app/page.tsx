import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen min-w-full flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/95">
      <main className="flex flex-col items-center justify-center text-center px-6 max-w-md mx-auto">
        <div className="mb-8">
          <span className="text-6xl mb-4 block">🏸</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
          Sofia Spelar
          <br />
          <span className="text-3xl sm:text-4xl text-foreground/80">Badminton</span>
        </h1>
        
        <p className="text-lg text-foreground/70 mb-8 leading-relaxed">
          En speciell bröllopspresent
          <br />
          Gjord med kärlek 💕
        </p>
        
        <Link
          href="/game"
          className="bg-foreground text-background px-8 py-4 rounded-full font-medium text-lg transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
        >
          Spela
        </Link>
      </main>
    </div>
  );
}
