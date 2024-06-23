import React, { useState, useEffect } from 'react';
import './App.css';

interface Habit {
  id: string;
  name: string;
  unitOfMeasurement: string;
  completions: { [date: string]: number };
}

const App: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>(() => {
    const savedHabits = localStorage.getItem('habits');
    return savedHabits ? JSON.parse(savedHabits) : [];
  });
  const [newHabit, setNewHabit] = useState<string>('');
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [completionValue, setCompletionValue] = useState<number>(0);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    if (selectedHabit) {
      setCompletionValue(selectedHabit.completions[selectedDate] || 0);
    }
  }, [selectedHabit, selectedDate]);

  const addHabit = (): void => {
    if (newHabit.trim()) {
      const newHabitObj: Habit = {
        id: Date.now().toString(),
        name: newHabit,
        completions: {},
        unitOfMeasurement: ''
      };
      setHabits(prevHabits => [...prevHabits, newHabitObj]);
      setNewHabit('');
    }
  };

  const updateCompletion = (): void => {
    if (selectedHabit) {
      setHabits(prevHabits =>
        prevHabits.map(habit =>
          habit.id === selectedHabit.id
            ? { ...habit, completions: { ...habit.completions, [selectedDate]: completionValue } }
            : habit
        )
      );
      setSelectedHabit(prevHabit =>
        prevHabit ? { ...prevHabit, completions: { ...prevHabit.completions, [selectedDate]: completionValue } } : null
      );
    }
  };

  const startEditingHabit = (habit: Habit) => {
    setEditingHabit(habit);
  };

  const saveEditedHabit = () => {
    if (editingHabit) {
      setHabits(prevHabits =>
        prevHabits.map(habit =>
          habit.id === editingHabit.id ? editingHabit : habit
        )
      );
      setEditingHabit(null);
      if (selectedHabit && selectedHabit.id === editingHabit.id) {
        setSelectedHabit(editingHabit);
      }
    }
  };

  const deleteHabit = (habitId: string) => {
    setHabits(prevHabits => prevHabits.filter(habit => habit.id !== habitId));
    if (selectedHabit && selectedHabit.id === habitId) {
      setSelectedHabit(null);
    }
    if (editingHabit && editingHabit.id === habitId) {
      setEditingHabit(null);
    }
  };
  const getLastYear = (): string[] => {
    const dates: string[] = [];
    for (let i = 365; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const renderYearlyCalendar = (): JSX.Element => {
    const dates = getLastYear();
    const calendar: JSX.Element[] = [];

    dates.forEach((date, index) => {
      if (index % 7 === 0) {
        calendar.push(<div key={`week-${index}`} className="week"></div>);
      }
      const completion = selectedHabit?.completions[date] || 0;
      calendar.push(
        <div
          key={date}
          className={`day ${completion > 0 ? 'completed' : ''} ${date === selectedDate ? 'selected' : ''}`}
          style={{ backgroundColor: `rgba(104, 236, 139, ${completion / 10})` }}
          onClick={() => setSelectedDate(date)}
          title={`${date}: ${completion}`}
        ></div>
      );
    });

    return <div className="yearly-calendar">{calendar}</div>;
  };


  return (
    <div className="App">
      <h1>Habit Tracker Heatmap</h1>
      <div className="habit-input">
        <input
          type="text"
          value={newHabit}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewHabit(e.target.value)}
          placeholder="Enter a new habit"
        />
        <button onClick={addHabit}>Add Habit</button>
      </div>
      <div className="main-content">
        <div className="habits-list">
          <h2>Habits:</h2>
          {habits.map((habit: Habit) => (
            <div key={habit.id} className="habit-item-container">
              {editingHabit && editingHabit.id === habit.id ? (
                <>
                  <input
                    type="text"
                    value={editingHabit.name}
                    onChange={(e) => setEditingHabit({ ...editingHabit, name: e.target.value })}
                  />
                  <button onClick={saveEditedHabit}>Save</button>
                </>
              ) : (
                <>
                  <div
                    className={`habit-item ${selectedHabit?.id === habit.id ? 'selected' : ''}`}
                    onClick={() => setSelectedHabit(habit)}
                  >
                    {habit.name}
                  </div>
                  <button onClick={() => startEditingHabit(habit)}>Edit</button>
                  <button onClick={() => deleteHabit(habit.id)}>Delete</button>
                </>
              )}
            </div>
          ))}
        </div>
        {selectedHabit && (
          <div className="habit-details">
            <h2>{selectedHabit.name}</h2>
            {renderYearlyCalendar()}
            <div className="completion-input">
              <label>
                Date:
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </label>
              <label>
                Completion:
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={completionValue}
                  onChange={(e) => setCompletionValue(Number(e.target.value))}
                />
              </label>
              <button onClick={updateCompletion}>Update</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


export default App;