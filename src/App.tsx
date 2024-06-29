import React, { useState, useEffect } from 'react';
import './App.css';

interface Habit {
  id: string;
  name: string;
  unitOfMeasurement: string;
  completions: { [date: string]: number };
}

interface CodingHabit extends Habit {
  githubUsername: string;
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

  const [codingHabit, setCodingHabit] = useState<CodingHabit>(() => {
    const savedCodingHabit = localStorage.getItem('codingHabit');
    return savedCodingHabit ? JSON.parse(savedCodingHabit) : {
      id: 'coding',
      name: 'Coding',
      completions: {},
      githubUsername: '',
      unitOfMeasurement: 'commits'
    };
  });

  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('codingHabit', JSON.stringify(codingHabit));
  }, [codingHabit]);

  useEffect(() => {
    if (selectedHabit) {
      setCompletionValue(selectedHabit.completions[selectedDate] || 0);
    }
  }, [selectedHabit, selectedDate]);

  useEffect(() => {
    if (codingHabit.githubUsername) {
      fetchGitHubContributions(codingHabit.githubUsername);
    }
  }, [codingHabit.githubUsername]);

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
      if (selectedHabit.id === 'coding') {
        setCodingHabit(prevHabit => ({
          ...prevHabit,
          completions: { ...prevHabit.completions, [selectedDate]: completionValue }
        }));
      } else {
        setHabits(prevHabits =>
          prevHabits.map(habit =>
            habit.id === selectedHabit.id
              ? { ...habit, completions: { ...habit.completions, [selectedDate]: completionValue } }
              : habit
          )
        );
      }
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

  const renderYearlyCalendar = (habit: Habit | CodingHabit): JSX.Element => {
    const dates = getLastYear();
    const calendar: JSX.Element[] = [];
  
    dates.forEach((date, index) => {
      if (index % 7 === 0) {
        calendar.push(<div key={`week-${index}`} className="week"></div>);
      }
      const completion = habit.completions[date] || 0;
      calendar.push(
        <div
          key={date}
          className={`day ${completion > 0 ? 'completed' : ''} ${date === selectedDate ? 'selected' : ''}`}
          style={{ backgroundColor: `rgba(104, 236, 139, ${Math.min(completion / 10, 1)})` }}
          onClick={() => setSelectedDate(date)}
          title={`${date}: ${completion}`}
        ></div>
      );
    });
  
    return <div className="yearly-calendar">{calendar}</div>;
  };

  const fetchGitHubContributions = async (username: string) => {
    try {
      // Get user's repositories
      const reposResponse = await fetch(`https://api.github.com/users/${username}/repos`);
      
      if (!reposResponse.ok) {
        throw new Error(`HTTP error! status: ${reposResponse.status}`);
      }
      
      const repos = await reposResponse.json();
      
      if (!Array.isArray(repos)) {
        console.error('Unexpected response format for repos:', repos);
        throw new Error('Repositories data is not in the expected format');
      }
  
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
      const newCompletions: { [date: string]: number } = {};
  
      // Fetch commits for each repository
      for (const repo of repos) {
        let page = 1;
        let hasMoreCommits = true;
  
        while (hasMoreCommits) {
          const commitsResponse = await fetch(
            `https://api.github.com/repos/${username}/${repo.name}/commits?per_page=100&page=${page}&since=${oneYearAgo.toISOString()}`
          );
          
          if (!commitsResponse.ok) {
            console.error(`Error fetching commits for ${repo.name}: ${commitsResponse.status}`);
            break;
          }
          
          const commits = await commitsResponse.json();
  
          if (!Array.isArray(commits) || commits.length === 0) {
            hasMoreCommits = false;
          } else {
            commits.forEach((commit: any) => {
              const date = commit.commit.author.date.split('T')[0];
              newCompletions[date] = (newCompletions[date] || 0) + 1;
            });
            page++;
          }
        }
      }
  
      // Update state with the combined data
      setCodingHabit(prevHabit => ({
        ...prevHabit,
        completions: newCompletions
      }));
    } catch (error) {
      console.error('Error fetching GitHub contributions:', error);
    }
  };

  return (
    <div className="App">
      <h1>HabGIT - Habit Tracker Heatmap</h1>
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
          <div className="habit-item-container">
          <div 
            className={`habit-item ${selectedHabit?.id === 'coding' ? 'selected' : ''}`}
            onClick={() => setSelectedHabit(codingHabit)}
          >
            coding
          </div>
          <input
            type="text"
            value={codingHabit.githubUsername}
            onChange={(e) => setCodingHabit({...codingHabit, githubUsername: e.target.value})}
            placeholder="GitHub Username"
          />
          </div>
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
            {renderYearlyCalendar(selectedHabit)}
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