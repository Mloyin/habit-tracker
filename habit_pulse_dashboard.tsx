<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HabitPulse - Dashboard Kebiasaan & Streak</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- React & Babel -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen">
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useEffect } = React;

        function HabitTracker() {
            const [habits, setHabits] = useState([
                { id: 1, name: 'Minum Air Putih (2L)', category: 'Kesehatan', target: 7, color: 'blue' },
                { id: 2, name: 'Olahraga / Stretching 15 Min', category: 'Kebugaran', target: 5, color: 'emerald' },
                { id: 3, name: 'Membaca Buku 20 Halaman', category: 'Pengembangan', target: 7, color: 'purple' },
                { id: 4, name: 'Meditasi / Sholat Tepat Waktu', category: 'Spiritual', target: 7, color: 'amber' },
                { id: 5, name: 'Belajar Coding / Skill Baru', category: 'Karier', target: 5, color: 'indigo' }
            ]);

            const [logs, setLogs] = useState({});
            const [activeTab, setActiveTab] = useState('daily');
            const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
            const [newHabitName, setNewHabitName] = useState('');
            const [newHabitCategory, setNewHabitCategory] = useState('Kesehatan');
            const [syncCode, setSyncCode] = useState(() => localStorage.getItem('habit_sync_code') || 'habit-pribadi-2026');
            const [showSyncModal, setShowSyncModal] = useState(false);

            // Load data dari LocalStorage
            useEffect(() => {
                const savedHabits = localStorage.getItem('habitpulse_habits_full');
                const savedLogs = localStorage.getItem('habitpulse_logs_full');
                if (savedHabits) setHabits(JSON.parse(savedHabits));
                if (savedLogs) setLogs(JSON.parse(savedLogs));
            }, []);

            // Auto-Save
            useEffect(() => {
                localStorage.setItem('habitpulse_habits_full', JSON.stringify(habits));
                localStorage.setItem('habitpulse_logs_full', JSON.stringify(logs));
                localStorage.setItem('habit_sync_code', syncCode);
            }, [habits, logs, syncCode]);

            const toggleLog = (habitId, dateStr) => {
                setLogs(prev => ({
                    ...prev,
                    [habitId]: {
                        ...(prev[habitId] || {}),
                        [dateStr]: !(prev[habitId]?.[dateStr])
                    }
                }));
            };

            const addHabit = (e) => {
                e.preventDefault();
                if (!newHabitName.trim()) return;
                const newH = {
                    id: Date.now(),
                    name: newHabitName,
                    category: newHabitCategory,
                    target: 7,
                    color: 'indigo'
                };
                setHabits([...habits, newH]);
                setNewHabitName('');
            };

            const deleteHabit = (id) => {
                setHabits(habits.filter(h => h.id !== id));
            };

            // Hitung 7 hari ke belakang untuk Weekly Streak Matrix
            const getPast7Days = () => {
                const dates = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    dates.push(d.toISOString().slice(0, 10));
                }
                return dates;
            };

            const weekDays = getPast7Days();

            const exportToCSV = () => {
                let csvContent = "data:text/csv;charset=utf-8,Habit,Kategori,Tanggal,Status\n";
                habits.forEach(h => {
                    Object.keys(logs[h.id] || {}).forEach(date => {
                        if (logs[h.id][date]) {
                            csvContent += `"${h.name}","${h.category}",${date},Selesai\n`;
                        }
                    });
                });
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `laporan_habit_lengkap_${new Date().toISOString().slice(0,10)}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            };

            return (
                <div className="max-w-4xl mx-auto p-4 sm:p-6 font-sans">
                    {/* Header */}
                    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                ⚡ HabitPulse Dashboard
                            </h1>
                            <p className="text-sm text-slate-500">Kelola target harian & pantau weekly streak chart Anda.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button onClick={() => setShowSyncModal(true)} className="px-3.5 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-sm font-medium transition">
                                ☁️ Kode: {syncCode}
                            </button>
                            <button onClick={exportToCSV} className="px-3.5 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-sm font-medium transition">
                                📥 Export Excel
                            </button>
                        </div>
                    </header>

                    {/* Navigasi Tab */}
                    <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2 overflow-x-auto">
                        <button onClick={() => setActiveTab('daily')} className={`px-4 py-2 rounded-xl font-medium text-sm transition whitespace-nowrap ${activeTab === 'daily' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
                            📅 Check-In Harian
                        </button>
                        <button onClick={() => setActiveTab('weekly')} className={`px-4 py-2 rounded-xl font-medium text-sm transition whitespace-nowrap ${activeTab === 'weekly' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
                            🔥 Weekly Streak Matrix
                        </button>
                        <button onClick={() => setActiveTab('manage')} className={`px-4 py-2 rounded-xl font-medium text-sm transition whitespace-nowrap ${activeTab === 'manage' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
                            ⚙️ Kelola Habit
                        </button>
                    </div>

                    {/* Tab 1: Daily Check-In */}
                    {activeTab === 'daily' && (
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="font-bold text-lg text-slate-800">Check-In Hari Ini</h2>
                                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-1.5 border rounded-xl text-sm" />
                            </div>
                            <div className="space-y-3">
                                {habits.map(habit => {
                                    const isChecked = logs[habit.id]?.[selectedDate] || false;
                                    return (
                                        <div key={habit.id} onClick={() => toggleLog(habit.id, selectedDate)} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${isChecked ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center border font-bold text-xs ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                                                    {isChecked && '✓'}
                                                </div>
                                                <div>
                                                    <h3 className={`font-medium ${isChecked ? 'line-through text-slate-400' : 'text-slate-800'}`}>{habit.name}</h3>
                                                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{habit.category}</span>
                                                </div>
                                            </div>
                                            <span className="text-xs font-medium text-slate-400">{isChecked ? 'Selesai ✨' : 'Belum'}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Weekly Streak Matrix Chart */}
                    {activeTab === 'weekly' && (
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 overflow-x-auto">
                            <h2 className="font-bold text-lg text-slate-800 mb-1">Weekly Streak Chart</h2>
                            <p className="text-sm text-slate-500 mb-4">Klik kotak tanggal di bawah untuk menandai atau membatalkan status habit.</p>
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="border-b border-slate-200 text-xs text-slate-400 uppercase">
                                        <th className="py-3 px-2">Daftar Habit</th>
                                        {weekDays.map(date => (
                                            <th key={date} className="py-3 px-2 text-center">{date.slice(5)}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {habits.map(habit => (
                                        <tr key={habit.id} className="hover:bg-slate-50">
                                            <td className="py-3 px-2 font-medium text-slate-800 text-sm">{habit.name}</td>
                                            {weekDays.map(date => {
                                                const done = logs[habit.id]?.[date] || false;
                                                return (
                                                    <td key={date} className="py-3 px-2 text-center">
                                                        <button onClick={() => toggleLog(habit.id, date)} className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center font-bold text-xs transition ${done ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}>
                                                            {done ? '✓' : '•'}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Tab 3: Kelola Habit */}
                    {activeTab === 'manage' && (
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                            <h2 className="font-bold text-lg text-slate-800 mb-4">Tambah Habit Baru</h2>
                            <form onSubmit={addHabit} className="flex flex-col sm:flex-row gap-3 mb-6">
                                <input type="text" value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} placeholder="Nama habit baru (contoh: Olahraga pagi)..." className="flex-1 px-4 py-2 border rounded-xl text-sm" />
                                <select value={newHabitCategory} onChange={(e) => setNewHabitCategory(e.target.value)} className="px-4 py-2 border rounded-xl text-sm bg-white">
                                    <option value="Kesehatan">Kesehatan</option>
                                    <option value="Kebugaran">Kebugaran</option>
                                    <option value="Pengembangan">Pengembangan</option>
                                    <option value="Spiritual">Spiritual</option>
                                    <option value="Karier">Karier</option>
                                </select>
                                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition">Tambah</button>
                            </form>

                            <h3 className="font-bold text-md text-slate-800 mb-3">Daftar Habit Aktif</h3>
                            <div className="space-y-2">
                                {habits.map(habit => (
                                    <div key={habit.id} className="flex justify-between items-center p-3 border rounded-xl bg-slate-50">
                                        <div>
                                            <p className="font-medium text-slate-800 text-sm">{habit.name}</p>
                                            <span className="text-xs text-slate-500">{habit.category}</span>
                                        </div>
                                        <button onClick={() => deleteHabit(habit.id)} className="text-rose-500 hover:text-rose-700 text-xs font-medium px-3 py-1 bg-rose-50 rounded-lg">Hapus</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Modal Sinkronisasi */}
                    {showSyncModal && (
                        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Kode Sinkronisasi Data</h3>
                                <p className="text-sm text-slate-500 mb-4">Gunakan kode ini di HP Anda agar tersinkron.</p>
                                <input type="text" value={syncCode} onChange={(e) => setSyncCode(e.target.value)} className="w-full px-4 py-2 border rounded-xl mb-4 text-sm font-mono" />
                                <div className="flex justify-end">
                                    <button onClick={() => setShowSyncModal(false)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium">Tutup</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        ReactDOM.render(<HabitTracker />, document.getElementById('root'));
    </script>
</body>
</html>
