import re

with open('src/components/agents/AgentPanel.tsx', 'r') as f:
    text = f.read()

# Add currentTrackRef
text = text.replace("const recognitionRef = useRef<any>(null);", 
"""const recognitionRef = useRef<any>(null);
  const currentTrackRef = useRef<Track | null | undefined>(currentTrack);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
""")

# Replace SpeechRecognition logic
old_speech = """  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setPrompt(currentTranscript);
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      recognitionRef.current = recognition;
    }
  }, []);"""

new_speech = """  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        let isFinal = false;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }
        
        setPrompt(currentTranscript);
        
        if (isFinal) {
          recognition.stop();
          setIsListening(false);
          setPrompt('');
          
          const track = currentTrackRef.current;
          const context = track ? {
            trackId: track.id,
            trackTitle: track.title,
            bpm: track.bpm,
            key: track.key,
            dspSettings: track.settings,
            hasVocals: track.vocals !== undefined
          } : undefined;
          
          orchestrator.dispatchUserIntent(currentTranscript, context);
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
  }, []);"""

text = text.replace(old_speech, new_speech)

# Enhance the form to show a Voice Commander UI
old_form = """            <form onSubmit={handleSendPrompt} className="flex items-center gap-2">
              <span className="text-emerald-500 font-mono text-xs font-bold animate-pulse">❯</span>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter command..."
                className="flex-1 bg-transparent border-none text-xs font-mono text-neutral-200 focus:outline-none placeholder-neutral-700"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={toggleListening}
                className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
                  isListening 
                    ? 'text-red-400 bg-red-400/10' 
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                }`}
                title="Voice Command"
              >
                <Mic className={`w-3.5 h-3.5 ${isListening ? 'animate-pulse' : ''}`} />
              </button>
            </form>"""

new_form = """            <form onSubmit={handleSendPrompt} className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${isListening ? 'bg-red-500/10 border border-red-500/30' : 'border border-transparent'}`}>
              <span className={`${isListening ? 'text-red-500' : 'text-emar'} font-mono text-xs font-bold ${isListening ? 'animate-pulse' : ''}`}>❯</span>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={isListening ? "Listening for command..." : "Enter command..."}
                className={`flex-1 bg-transparent border-none text-xs font-mono focus:outline-none transition-colors ${isListening ? 'text-red-400 placeholder-red-400/50' : 'text-neutral-200 placeholder-neutral-700'}`}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={toggleListening}
                className={`p-1.5 rounded-md transition-all flex items-center justify-center ${
                  isListening 
                    ? 'text-red-400 bg-red-500/20 shadow-[0_0_10px_rgba(248,113,113,0.3)]' 
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                }`}
                title="Voice Commander"
              >
                <Mic className={`w-3.5 h-3.5 ${isListening ? 'animate-pulse' : ''}`} />
              </button>
            </form>"""

text = text.replace(old_form, new_form)

with open('src/components/agents/AgentPanel.tsx', 'w') as f:
    f.write(text)

