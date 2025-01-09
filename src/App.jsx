import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Bell } from 'lucide-react';

const RunningApp = () => {
  const [week, setWeek] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [wakeLock, setWakeLock] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(false);
  
  // Piano allenamento (come prima...)
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
    3: {
      phases: [
        { name: "Riscaldamento", duration: 300, type: "walk" },
        { name: "Corsa", duration: 120, type: "run" },
        { name: "Camminata", duration: 180, type: "walk" },
        { name: "Corsa", duration: 120, type: "run" },
        { name: "Camminata", duration: 180, type: "walk" },
        { name: "Corsa", duration: 120, type: "run" },
        { name: "Camminata", duration: 180, type: "walk" },
        { name: "Defaticamento", duration: 300, type: "walk" }
      ]
    },
    5: {
      phases: [
        { name: "Riscaldamento", duration: 300, type: "walk" },
        { name: "Corsa", duration: 180, type: "run" },
        { name: "Camminata", duration: 120, type: "walk" },
        { name: "Corsa", duration: 180, type: "run" },
        { name: "Camminata", duration: 120, type: "walk" },
        { name: "Corsa", duration: 180, type: "run" },
        { name: "Camminata", duration: 120, type: "walk" },
        { name: "Defaticamento", duration: 300, type: "walk" }
      ]
    },
    7: {
      phases: [
        { name: "Riscaldamento", duration: 300, type: "walk" },
        { name: "Corsa", duration: 240, type: "run" },
        { name: "Camminata", duration: 60, type: "walk" },
        { name: "Corsa", duration: 240, type: "run" },
        { name: "Camminata", duration: 60, type: "walk" },
        { name: "Corsa", duration: 240, type: "run" },
        { name: "Camminata", duration: 60, type: "walk" },
        { name: "Defaticamento", duration: 300, type: "walk" }
      ]
    }
  };

  // Gestione Wake Lock
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        
        lock.addEventListener('release', () => {
          setWakeLock(null);
        });
      }
    } catch (err) {
      console.error('Wake Lock error:', err);
    }
  };

  // Gestione delle notifiche
  const requestNotificationPermission = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission === 'granted');
      }
    } catch (err) {
      console.error('Notification error:', err);
    }
  };

  const sendNotification = (message) => {
    if (notificationPermission && !document.hasFocus()) {
      new Notification('Allenamento Corsa', {
        body: message,
        icon: '/favicon.ico'
      });
    }
  };

  // Gestione della visibilità della pagina
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning) {
        sendNotification('Timer in esecuzione in background');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning]);

  // Timer principale
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      // Richiedi wake lock quando il timer parte
      requestWakeLock();
      
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            if (currentPhase < workoutPlans[week].phases.length - 1) {
              const nextPhase = workoutPlans[week].phases[currentPhase + 1];
              sendNotification(`Nuova fase: ${nextPhase.name}`);
              setCurrentPhase(phase => phase + 1);
              return nextPhase.duration;
            } else {
              setIsRunning(false);
              sendNotification('Allenamento completato!');
              return 0;
            }
          }
          return time - 1;
        });
      }, 1000);
    } else if (!isRunning && wakeLock) {
      wakeLock.release();
    }
    
    return () => {
      clearInterval(interval);
      if (wakeLock) wakeLock.release();
    };
  }, [isRunning, timeLeft, currentPhase, week, wakeLock]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetWorkout = () => {
    setIsRunning(false);
    setCurrentPhase(0);
    setTimeLeft(workoutPlans[week].phases[0].duration);
    if (wakeLock) wakeLock.release();
  };

  const toggleTimer = async () => {
    if (!isRunning) {
      // Richiedi i permessi se non sono già stati concessi
      if (!notificationPermission) {
        await requestNotificationPermission();
      }
    }
    setIsRunning(!isRunning);
  };

  const getCurrentPhase = () => {
    return workoutPlans[week].phases[currentPhase];
  };

  return (
    <div className="max-w-md mx-auto p-4 text-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Timer Allenamento Corsa</h1>
      
      <div className="mb-6">
        <label className="block text-lg mb-2">Seleziona Settimana:</label>
        <select 
          className="w-full p-2 border rounded"
          value={week}
          onChange={(e) => {
            setWeek(parseInt(e.target.value));
            setCurrentPhase(0);
            setTimeLeft(workoutPlans[parseInt(e.target.value)].phases[0].duration);
            setIsRunning(false);
          }}
        >
          <option value={1}>Settimana 1-2</option>
          <option value={3}>Settimana 3-4</option>
          <option value={5}>Settimana 5-6</option>
          <option value={7}>Settimana 7-8</option>
        </select>
      </div>

      <div className={`p-6 rounded-lg mb-4 ${
        getCurrentPhase().type === 'run' ? 'bg-red-100' : 'bg-green-100'
      }`}>
        <h2 className="text-xl font-bold mb-2">{getCurrentPhase().name}</h2>
        <div className="text-4xl font-mono mb-2">{formatTime(timeLeft)}</div>
        <p className="text-lg">
          {getCurrentPhase().type === 'run' ? 'Corri!' : 'Cammina'}
        </p>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={toggleTimer}
          className="p-4 rounded-full bg-blue-500 text-white hover:bg-blue-600"
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button
          onClick={resetWorkout}
          className="p-4 rounded-full bg-gray-500 text-white hover:bg-gray-600"
        >
          <RotateCcw size={24} />
        </button>
      </div>

      <div className="mt-6 text-left">
        <h3 className="font-bold mb-2">Prossime fasi:</h3>
        <div className="space-y-2">
          {workoutPlans[week].phases.slice(currentPhase + 1, currentPhase + 4).map((phase, idx) => (
            <div key={idx} className="text-gray-600">
              {phase.name} - {formatTime(phase.duration)}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        {wakeLock ? "Schermo attivo" : "Schermo non bloccato"}
        {notificationPermission ? " • Notifiche attive" : " • Notifiche non attive"}
      </div>
    </div>
  );
};

export default RunningApp;