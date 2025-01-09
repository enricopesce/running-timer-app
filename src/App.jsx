import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const RunningApp = () => {
  const [week, setWeek] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [audioContext, setAudioContext] = useState(null);

  // Funzioni per generare i suoni
  const createAudioContext = () => {
    if (!audioContext) {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(context);
    }
  };

  const playBeepSound = (frequency = 440, duration = 0.2, type = 'sine') => {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    gainNode.gain.value = 0.1;

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();

    setTimeout(() => {
      oscillator.stop();
      oscillator.disconnect();
      gainNode.disconnect();
    }, duration * 1000);
  };

  // Suoni diversi per diverse notifiche
  const playWarningSound = () => {
    playBeepSound(660, 0.2, 'square'); // Suono più acuto per il preavviso
  };

  const playChangeSound = () => {
    // Sequenza di due beep per il cambio fase
    playBeepSound(440, 0.15);
    setTimeout(() => playBeepSound(880, 0.15), 200);
  };

  const workoutPlans = {
    1: {
      phases: [
        { name: "Riscaldamento", duration: 300, type: "walk" },
        { name: "Corsa", duration: 60, type: "run" },
        { name: "Camminata", duration: 240, type: "walk" },
        { name: "Corsa", duration: 60, type: "run" },
        { name: "Camminata", duration: 240, type: "walk" },
        { name: "Corsa", duration: 60, type: "run" },
        { name: "Camminata", duration: 240, type: "walk" },
        { name: "Defaticamento", duration: 300, type: "walk" }
      ]
    },
    // ... altri piani rimangono invariati ...
  };

  useEffect(() => {
    let intervalId;
    
    if (isRunning) {
      intervalId = setInterval(() => {
        setTimeLeft(prevTime => {
          // Controlla se mancano 3 secondi al cambio fase
          if (prevTime === 4) {
            playWarningSound();
          }
          
          if (prevTime <= 1) {
            // Cambio fase
            if (currentPhase < workoutPlans[week].phases.length - 1) {
              playChangeSound();
              setCurrentPhase(prev => prev + 1);
              return workoutPlans[week].phases[currentPhase + 1].duration;
            } else {
              // Fine dell'allenamento
              playChangeSound();
              setIsRunning(false);
              return 0;
            }
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, currentPhase, week]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetWorkout = () => {
    setIsRunning(false);
    setCurrentPhase(0);
    setTimeLeft(workoutPlans[week].phases[0].duration);
  };

  const toggleTimer = () => {
    createAudioContext(); // Inizializza l'AudioContext al primo click
    setIsRunning(!isRunning);
  };

  const getCurrentPhase = () => {
    return workoutPlans[week].phases[currentPhase];
  };

  // Calcola la prossima fase
  const getNextPhase = () => {
    if (currentPhase < workoutPlans[week].phases.length - 1) {
      return workoutPlans[week].phases[currentPhase + 1];
    }
    return null;
  };

  return (
    <div className="max-w-md mx-auto p-4 text-center min-h-screen bg-white">
      <h1 className="text-2xl font-bold mb-4">Timer Allenamento Corsa</h1>
      
      <div className="mb-6">
        <label className="block text-lg mb-2">Seleziona Settimana:</label>
        <select 
          className="w-full p-2 border rounded bg-white"
          value={week}
          onChange={(e) => {
            const newWeek = parseInt(e.target.value);
            setWeek(newWeek);
            setCurrentPhase(0);
            setTimeLeft(workoutPlans[newWeek].phases[0].duration);
            setIsRunning(false);
          }}
        >
          <option value={1}>Settimana 1-2</option>
          <option value={3}>Settimana 3-4</option>
          <option value={5}>Settimana 5-6</option>
          <option value={7}>Settimana 7-8</option>
        </select>
      </div>

      <div 
        className={`p-6 rounded-lg mb-4 ${
          getCurrentPhase().type === 'run' ? 'bg-red-100' : 'bg-green-100'
        }`}
        style={{
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <h2 className="text-xl font-bold mb-2">{getCurrentPhase().name}</h2>
        <div className="text-6xl font-mono mb-2 font-bold">{formatTime(timeLeft)}</div>
        <p className="text-lg font-semibold">
          {getCurrentPhase().type === 'run' ? 'Corri!' : 'Cammina'}
        </p>
        {timeLeft <= 3 && getNextPhase() && (
          <div className="mt-2 text-sm font-semibold text-gray-600">
            Preparati per: {getNextPhase().name}
          </div>
        )}
      </div>

      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={toggleTimer}
          className="p-4 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          style={{
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button
          onClick={resetWorkout}
          className="p-4 rounded-full bg-gray-500 text-white hover:bg-gray-600 transition-colors"
          style={{
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <RotateCcw size={24} />
        </button>
      </div>

      <div className="mt-6 text-left bg-gray-50 p-4 rounded-lg">
        <h3 className="font-bold mb-2">Prossime fasi:</h3>
        <div className="space-y-2">
          {workoutPlans[week].phases.slice(currentPhase + 1, currentPhase + 4).map((phase, idx) => (
            <div key={idx} className="text-gray-600 flex justify-between border-b pb-1">
              <span>{phase.name}</span>
              <span className="font-mono">{formatTime(phase.duration)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RunningApp;