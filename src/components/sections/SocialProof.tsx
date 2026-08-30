import { Star, Users, Music, Award } from 'lucide-react';

export function SocialProof() {
  return (
    <section className="relative bg-[#0D0D0D] border-y border-white/5 py-8">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F5A800]/5 to-transparent pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-14">
        {/* Top trust bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F5A800] to-[#FF3C00] border-2 border-[#0D0D0D] flex items-center justify-center text-[10px] font-bold text-black"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-3 h-3 fill-[#F5A800] text-[#F5A800]" />
                  ))}
                  <span className="ml-1 font-mono text-xs font-bold text-white">4.8/5</span>
                </div>
                <div className="font-mono text-[10px] text-neutral-500">from 12,400 producers</div>
              </div>
            </div>
            <div className="hidden md:block h-8 w-px bg-white/10" />
            <div className="flex items-center gap-6 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-[#F5A800]" />
                <span className="text-white font-bold">12M+</span>
                <span className="text-neutral-500">stems generated</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2AFFA3]" />
                <span className="text-white font-bold">4.2k</span>
                <span className="text-neutral-500">active studios</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
              Trusted by
            </span>
            <div className="flex items-center gap-4 opacity-60">
              {['BURNA BOY', 'TEMS', 'REMA', 'FIREBOY'].map((name) => (
                <span key={name} className="font-display text-xs tracking-widest text-white/80">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Visual mockup dots — use cases preview */}
        <div className="mt-6 flex justify-center gap-2">
          <span className="h-1.5 w-8 rounded-full bg-[#F5A800]" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
        </div>
      </div>
    </section>
  );
}
