import re

with open("src/components/visuals/Waveform.tsx", "r") as f:
    content = f.read()

new_effect = """  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let frame = 0;
    let raf = 0;
    let w = canvas.clientWidth;
    let h = canvas.clientHeight;
    let dpr = Math.min(window.devicePixelRatio, 2);

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = w * dpr; 
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    
    const observer = new ResizeObserver(() => resize());
    observer.observe(canvas);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const channels = [
        { y: .23, color: "#2AFFA3", freq: 12, speed: 1.0, amp: .18 },
        { y: .50, color: "#F5A800", freq: 8, speed: .82, amp: .23 },
        { y: .77, color: "#FF3C00", freq: 5, speed: 1.1, amp: .16 }
      ];
      channels.forEach((c, idx) => {
        ctx.beginPath();
        ctx.strokeStyle = c.color;
        ctx.lineWidth = idx === 1 ? 2 : 1.4;
        ctx.shadowBlur = 10; ctx.shadowColor = c.color;
        for (let x = 0; x <= w; x += 2) {
          const nx = x / w;
          const y = h*c.y
            + Math.sin(nx*Math.PI*c.freq + frame*.025*c.speed) * h*c.amp
            + Math.sin(nx*Math.PI*(c.freq*2.3) + frame*.035) * h*.045;
          x === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        }
        ctx.stroke();
      });
      ctx.shadowBlur = 0;
      frame++;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);"""

old_effect = re.search(r"  useEffect\(\(\) => \{.*?\n  \}, \[\]\);", content, re.DOTALL)
if old_effect:
    content = content.replace(old_effect.group(0), new_effect)
    
with open("src/components/visuals/Waveform.tsx", "w") as f:
    f.write(content)
