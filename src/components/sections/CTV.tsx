import { ArrowRight, Clock } from 'lucide-react';
import { Button } from '../ui/button';

export function CTV({ onEnterStudio }: { onEnterStudio: () => void }) {
  return (
    <section className="relative bg-[#F5A800] py-12 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,0,0,0.15),transparent_60%)]" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-14 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="hidden md:flex w-12 h-12 rounded-2xl bg-black text-white items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="font-display text-2xl md:text-3xl tracking-tight text-black">
              Try for Free —{' '}
              <span className="underline decoration-black/20">Save 10+ hours this week.</span>
            </div>
            <div className="font-mono text-xs text-black/70 mt-1">
              Get your first master in 10 minutes. No card required. Council on standby.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="gold"
            className="bg-black text-white hover:bg-black/80 h-12 px-8 text-base border-0"
            onClick={onEnterStudio}
          >
            Start Free <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <div className="hidden md:block font-mono text-[10px] text-black/60 text-right leading-tight">
            14-day guarantee
            <br />
            Cancel anytime
          </div>
        </div>
      </div>
    </section>
  );
}
