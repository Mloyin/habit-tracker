import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CheckCircle2,
  Flame,
  Plus,
  Trash2,
  Edit3,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Award,
  TrendingUp,
  Sparkles,
  Check,
  X,
  Dumbbell,
  BookOpen,
  Droplets,
  Moon,
  Brain,
  Code,
  Apple,
  Music,
  Sun,
  ShieldCheck,
  Zap,
  RotateCcw,
  Cloud,
  CloudOff,
  Download,
  Upload,
  FileSpreadsheet,
  KeyRound,
  Copy,
  RefreshCw,
  Smartphone,
  Laptop,
  AlertCircle,
  CheckCheck
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';

// --- Inisialisasi Firebase Sesuai Standar ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Fungsi Utilitas Tanggal ---
const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isSameDay = (d1, d2) => formatDateKey(d1) === formatDateKey(d2);

const sanitizeSyncCode = (raw) => {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// --- Konfigurasi Kategori, Ikon & Warna ---
const CATEGORIES = [
  { id: 'all', name: 'Semua Habit' },
  { id: 'Health', name: 'Kesehatan & Fisik' },
  { id: 'Mindfulness', name: 'Ketenangan Pikiran' },
  { id: 'Growth', name: 'Belajar & Bertumbuh' },
  { id: 'Productivity', name: 'Produktivitas' }
];

const ICONS = {
  Dumbbell: { component: Dumbbell, label: 'Olahraga' },
  BookOpen: { component: BookOpen, label: 'Membaca' },
  Droplets: { component: Droplets, label: 'Air Putih' },
  Moon: { component: Moon, label: 'Tidur' },
  Brain: { component: Brain, label: 'Meditasi' },
  Code: { component: Code, label: 'Koding' },
  Apple: { component: Apple, label: 'Nutrisi' },
  Music: { component: Music, label: 'Latihan' },
  Sun: { component: Sun, label: 'Pagi' },
  Zap: { component: Zap, label: 'Fokus' }
};

const COLORS = [
  { id: 'emerald', name: 'Hijau Emerald', bg: 'bg-emerald-500', softBg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', ring: 'focus:ring-emerald-500', hex: '#10b981' },
  { id: 'indigo', name: 'Biru Indigo', bg: 'bg-indigo-500', softBg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30', ring: 'focus:ring-indigo-500', hex: '#6366f1' },
  { id: 'rose', name: 'Merah Rose', bg: 'bg-rose-500', softBg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', ring: 'focus:ring-rose-500', hex: '#f43f5e' },
  { id: 'amber', name: 'Kuning Amber', bg: 'bg-amber-500', softBg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', ring: 'focus:ring-amber-500', hex: '#f59e0b' },
  { id: 'cyan', name: 'Biru Cyan', bg: 'bg-cyan-500', softBg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30', ring: 'focus:ring-cyan-500', hex: '#06b6d4' },
  { id: 'purple', name: 'Ungu Purple', bg: 'bg-purple-500', softBg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30', ring: 'focus:ring-purple-500', hex: '#a855f7' }
];

// Data contoh awal
const generateInitialHabits = (today) => {
  const makeLogs = (pattern) => {
    const logs = {};
    pattern.forEach((completed, idx) => {
      if (completed) {
        const d = addDays(today, -idx);
        logs[formatDateKey(d)] = true;
      }
    });
    return logs;
  };

  return [
    {
      id: 'h-1',
      name: 'Minum 2.5L Air Putih',
      description: 'Jaga tubuh tetap terhidrasi sepanjang hari',
      category: 'Health',
      icon: 'Droplets',
      color: 'cyan',
      targetPerWeek: 7,
      logs: makeLogs([true, true, true, true, true, false, true, true, true, true, false, true, true, true])
    },
    {
      id: 'h-2',
      name: 'Olahraga / Jalan Pagi 30 Menit',
      description: 'Sesi gym ringan, jogging, atau stretching',
      category: 'Health',
      icon: 'Dumbbell',
      color: 'rose',
      targetPerWeek: 5,
      logs: makeLogs([true, false, true, true, false, true, true, false, true, true, false, true, false, true])
    },
    {
      id: 'h-3',
      name: 'Baca Buku 15 Halaman',
      description: 'Buku pengembangan diri sebelum tidur',
      category: 'Growth',
      icon: 'BookOpen',
      color: 'amber',
      targetPerWeek: 6,
      logs: makeLogs([false, true, true, true, true, true, false, true, true, true, true, false, true, true])
    },
    {
      id: 'h-4',
      name: 'Meditasi & Doa Tenang',
      description: '10 menit latihan pernapasan & syukur harian',
      category: 'Mindfulness',
      icon: 'Brain',
      color: 'purple',
      targetPerWeek: 7,
      logs: makeLogs([true, true, true, false, true, true, true, true, false, true, true, true, true, true])
    },
    {
      id: 'h-5',
      name: 'Fokus Kerja Tanpa Distraksi HP',
      description: '2 jam fokus penuh pada tugas terpenting',
      category: 'Productivity',
      icon: 'Zap',
      color: 'emerald',
      targetPerWeek: 5,
      logs: makeLogs([true, true, true, true, false, false, true, true, true, true, true, false, false, true])
    }
  ];
};

export default function App() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // --- State Utama ---
  const [user, setUser] = useState(null);
  const [syncCode, setSyncCode] = useState('habit-pribadi-saya');
  const [inputSyncCode, setInputSyncCode] = useState('habit-pribadi-saya');
  const [cloudStatus, setCloudStatus] = useState('connecting'); // 'connecting' | 'connected' | 'saving' | 'error'
  const [lastSyncedTime, setLastSyncedTime] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const [habits, setHabits] = useState(() => generateInitialHabits(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [confirmActionModal, setConfirmActionModal] = useState(null); // 'reset-demo' | 'clear-all' | null

  const fileInputRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);

  // Form State untuk Tambah/Edit Habit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Health',
    icon: 'Dumbbell',
    color: 'emerald',
    targetPerWeek: 7
  });

  // Helper Notifikasi Singkat
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // --- 1. Autentikasi Firebase (Wajib sesuai aturan) ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Auth error:', err);
        setCloudStatus('error');
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Muat preferensi kode sinkronisasi user jika pernah disimpan di profil pribadinya
        const userPrefRef = doc(db, 'artifacts', appId, 'users', u.uid, 'settings', 'preferences');
        getDoc(userPrefRef)
          .then((snap) => {
            if (snap.exists() && snap.data().activeSyncCode) {
              const savedCode = snap.data().activeSyncCode;
              setSyncCode(savedCode);
              setInputSyncCode(savedCode);
            }
          })
          .catch((e) => console.error('Failed loading user pref:', e));
      }
    });
    return () => unsubscribe();
  }, []);

  // --- 2. Real-time Listener Firestore Berdasarkan Kode Sinkronisasi ---
  useEffect(() => {
    if (!user || !syncCode) return;

    setCloudStatus('connecting');
    const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'habit_sync_rooms', syncCode);

    const unsubscribe = onSnapshot(
      roomDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && Array.isArray(data.habits)) {
            isRemoteUpdateRef.current = true;
            setHabits(data.habits);
            setLastSyncedTime(new Date());
          }
          setCloudStatus('connected');
        } else {
          // Jika kode sinkronisasi ini baru pertama kali dipakai, simpan data saat ini ke Cloud
          const initialData = generateInitialHabits(today);
          setDoc(roomDocRef, {
            habits: initialData,
            updatedAt: new Date().toISOString(),
            updatedBy: user.uid
          })
            .then(() => {
              setCloudStatus('connected');
              setLastSyncedTime(new Date());
            })
            .catch((e) => {
              console.error('Error initializing cloud room:', e);
              setCloudStatus('error');
            });
        }
      },
      (error) => {
        console.error('Firestore real-time sync error:', error);
        setCloudStatus('error');
      }
    );

    return () => unsubscribe();
  }, [user, syncCode, today]);

  // Fungsi untuk menyimpan perubahan ke Cloud Firestore
  const saveHabitsToCloud = async (updatedHabits, customCode = syncCode) => {
    setHabits(updatedHabits);
    if (!user || !customCode) return;

    setCloudStatus('saving');
    try {
      const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'habit_sync_rooms', customCode);
      await setDoc(roomDocRef, {
        habits: updatedHabits,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid
      });
      setCloudStatus('connected');
      setLastSyncedTime(new Date());
    } catch (error) {
      console.error('Failed saving to cloud:', error);
      setCloudStatus('error');
    }
  };

  // Fungsi ganti Kode Sinkronisasi Cloud (Menghubungkan Laptop & HP)
  const handleApplySyncCode = async (e) => {
    e.preventDefault();
    const cleaned = sanitizeSyncCode(inputSyncCode);
    if (!cleaned || cleaned.length < 3) {
      showToast('Kode Cloud minimal 3 huruf/angka.');
      return;
    }

    setSyncCode(cleaned);
    setInputSyncCode(cleaned);

    if (user) {
      try {
        const userPrefRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'preferences');
        await setDoc(userPrefRef, { activeSyncCode: cleaned }, { merge: true });
      } catch (err) {
        console.error('Error saving sync code pref:', err);
      }
    }
    showToast(`Tersambung ke Kode Cloud: "${cleaned}"`);
  };

  const handleCopySyncCode = () => {
    navigator.clipboard?.writeText(syncCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showToast('Kode Cloud berhasil disalin!');
  };

  // --- Perhitungan Minggu Aktif ---
  const activeWeekStart = useMemo(() => {
    const baseStart = getStartOfWeek(today);
    return addDays(baseStart, weekOffset * 7);
  }, [today, weekOffset]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(activeWeekStart, i));
  }, [activeWeekStart]);

  // --- Perhitungan Streak ---
  const calculateCurrentStreak = (logs = {}) => {
    let streak = 0;
    let checkDate = new Date(today);
    const todayKey = formatDateKey(checkDate);

    if (!logs[todayKey]) {
      checkDate = addDays(checkDate, -1);
    }

    while (true) {
      const key = formatDateKey(checkDate);
      if (logs[key]) {
        streak++;
        checkDate = addDays(checkDate, -1);
      } else {
        break;
      }
    }
    return streak;
  };

  const calculateBestStreak = (logs = {}) => {
    const dates = Object.keys(logs).filter((k) => logs[k]).sort();
    if (dates.length === 0) return 0;

    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffTime = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

      if (diffTime === 1) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else if (diffTime > 1) {
        currentStreak = 1;
      }
    }
    return maxStreak;
  };

  // --- Handlers Habit ---
  const toggleHabitDate = (habitId, dateObj) => {
    if (dateObj > today) return;

    const dateKey = formatDateKey(dateObj);
    const updated = habits.map((h) => {
      if (h.id !== habitId) return h;
      const updatedLogs = { ...(h.logs || {}) };
      if (updatedLogs[dateKey]) {
        delete updatedLogs[dateKey];
      } else {
        updatedLogs[dateKey] = true;
      }
      return { ...h, logs: updatedLogs };
    });

    saveHabitsToCloud(updated);
  };

  const openCreateModal = () => {
    setEditingHabit(null);
    setFormData({
      name: '',
      description: '',
      category: 'Health',
      icon: 'Dumbbell',
      color: 'emerald',
      targetPerWeek: 7
    });
    setIsModalOpen(true);
  };

  const openEditModal = (habit) => {
    setEditingHabit(habit);
    setFormData({
      name: habit.name,
      description: habit.description || '',
      category: habit.category,
      icon: habit.icon,
      color: habit.color,
      targetPerWeek: habit.targetPerWeek || 7
    });
    setIsModalOpen(true);
  };

  const handleSaveHabit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    let updated;
    if (editingHabit) {
      updated = habits.map((h) =>
        h.id === editingHabit.id
          ? { ...h, ...formData, name: formData.name.trim() }
          : h
      );
      showToast('Habit berhasil diperbarui & disimpan ke Cloud!');
    } else {
      const newHabit = {
        id: `h-${Date.now()}`,
        ...formData,
        name: formData.name.trim(),
        logs: {}
      };
      updated = [...habits, newHabit];
      showToast('Habit baru ditambahkan ke Cloud!');
    }
    saveHabitsToCloud(updated);
    setIsModalOpen(false);
  };

  const handleDeleteHabit = (id) => {
    const updated = habits.filter((h) => h.id !== id);
    saveHabitsToCloud(updated);
    if (editingHabit && editingHabit.id === id) {
      setIsModalOpen(false);
    }
    showToast('Habit telah dihapus.');
  };

  const handleConfirmAction = () => {
    if (confirmActionModal === 'reset-demo') {
      const fresh = generateInitialHabits(today);
      saveHabitsToCloud(fresh);
      setSelectedDate(today);
      setWeekOffset(0);
      showToast('Data contoh berhasil dikembalikan.');
    } else if (confirmActionModal === 'clear-all') {
      saveHabitsToCloud([]);
      setSelectedDate(today);
      setWeekOffset(0);
      setIsCloudModalOpen(false);
      showToast('Semua daftar habit dikosongkan. Silakan mulai dari nol!');
    }
    setConfirmActionModal(null);
  };

  const markAllForSelectedDate = () => {
    if (selectedDate > today) return;
    const key = formatDateKey(selectedDate);
    const updated = habits.map((h) => ({
      ...h,
      logs: { ...(h.logs || {}), [key]: true }
    }));
    saveHabitsToCloud(updated);
    showToast('Semua habit hari ini berhasil dicentang!');
  };

  // --- Fitur Export & Import Data Pribadi ---
  const handleExportCSV = () => {
    // Buat daftar 30 hari terakhir untuk kolom Excel
    const daysList = Array.from({ length: 30 }, (_, idx) => addDays(today, -idx)).reverse();
    const headers = [
      'Nama Habit',
      'Kategori',
      'Target Mingguan',
      'Streak Saat Ini (Hari)',
      'Rekor Streak Terbaik',
      ...daysList.map((d) => formatDateKey(d))
    ];

    const rows = habits.map((h) => {
      const currentStreak = calculateCurrentStreak(h.logs);
      const bestStreak = calculateBestStreak(h.logs);
      const dateCells = daysList.map((d) => (h.logs && h.logs[formatDateKey(d)] ? 'SELESAI' : '-'));
      return [
        `"${(h.name || '').replace(/"/g, '""')}"`,
        `"${h.category || ''}"`,
        h.targetPerWeek || 7,
        currentStreak,
        bestStreak,
        ...dateCells
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Habit_${syncCode}_${formatDateKey(today)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('File Excel (.CSV) berhasil diunduh!');
  };

  const handleExportJSON = () => {
    const payload = {
      app: 'HabitPulse',
      syncCode,
      exportedAt: new Date().toISOString(),
      habits
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `Backup_HabitPulse_${syncCode}_${formatDateKey(today)}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('File Cadangan (.JSON) berhasil diunduh!');
  };

  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const importedHabits = Array.isArray(parsed) ? parsed : parsed.habits;
        if (Array.isArray(importedHabits)) {
          saveHabitsToCloud(importedHabits);
          showToast('Data cadangan berhasil dipulihkan & disinkronkan ke Cloud!');
          setIsCloudModalOpen(false);
        } else {
          showToast('Format file backup tidak dikenali.');
        }
      } catch (err) {
        console.error('Import error:', err);
        showToast('Gagal membaca file backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- Analitik & Filter ---
  const filteredHabits = useMemo(() => {
    if (selectedCategory === 'all') return habits;
    return habits.filter((h) => h.category === selectedCategory);
  }, [habits, selectedCategory]);

  const selectedDateKey = formatDateKey(selectedDate);
  const completedOnSelectedDate = habits.filter((h) => h.logs && h.logs[selectedDateKey]).length;
  const dailyCompletionPct = habits.length > 0 ? Math.round((completedOnSelectedDate / habits.length) * 100) : 0;

  const weeklyAnalytics = useMemo(() => {
    const dayStats = weekDays.map((day) => {
      const key = formatDateKey(day);
      const isFuture = day > today;
      const completedCount = isFuture ? 0 : habits.filter((h) => h.logs && h.logs[key]).length;
      const totalPossible = habits.length;
      const pct = totalPossible > 0 && !isFuture ? Math.round((completedCount / totalPossible) * 100) : 0;
      return {
        date: day,
        key,
        dayName: day.toLocaleDateString('id-ID', { weekday: 'short' }),
        dayNumber: day.getDate(),
        completedCount,
        totalPossible,
        pct,
        isFuture,
        isToday: isSameDay(day, today)
      };
    });

    const validDays = dayStats.filter((d) => !d.isFuture);
    const totalCompletedInWeek = validDays.reduce((acc, curr) => acc + curr.completedCount, 0);
    const totalTargetInWeek = habits.reduce((acc, h) => acc + (h.targetPerWeek || 7), 0);
    const weeklySuccessRate = totalTargetInWeek > 0
      ? Math.min(100, Math.round((totalCompletedInWeek / totalTargetInWeek) * 100))
      : 0;

    return { dayStats, totalCompletedInWeek, totalTargetInWeek, weeklySuccessRate };
  }, [weekDays, habits, today]);

  const topCurrentStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map((h) => calculateCurrentStreak(h.logs)));
  }, [habits, today]);

  const allTimeBestStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map((h) => calculateBestStreak(h.logs)));
  }, [habits]);

  const getColorStyles = (colorId) => COLORS.find((c) => c.id === colorId) || COLORS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-16">
      {/* Cahaya Latar Belakang */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      {/* Notifikasi Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-slate-900/95 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Navigasi Atas */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <Flame className="w-6 h-6 text-white fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  HabitPulse
                </h1>
                {/* Indikator Status Cloud Live */}
                <button
                  onClick={() => setIsCloudModalOpen(true)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-all ${
                    cloudStatus === 'connected'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                      : cloudStatus === 'saving' || cloudStatus === 'connecting'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}
                  title="Klik untuk mengatur sinkronisasi Laptop & HP"
                >
                  {cloudStatus === 'connected' ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <Cloud className="w-3 h-3" />
                      <span className="hidden md:inline">Cloud Aktif:</span>
                      <strong className="font-mono">{syncCode}</strong>
                    </>
                  ) : cloudStatus === 'saving' || cloudStatus === 'connecting' ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Menyinkronkan...</span>
                    </>
                  ) : (
                    <>
                      <CloudOff className="w-3 h-3" />
                      <span>Mode Offline</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Catatan Habit Harian & Sinkronisasi Otomatis Laptop/HP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCloudModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-medium text-xs sm:text-sm px-3 py-2 rounded-xl transition-all"
            >
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Sinkronisasi HP & Data</span>
              <span className="sm:hidden">Cloud & Data</span>
            </button>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Habit</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Banner Info Sinkronisasi Cloud & Download Excel */}
        <section className="bg-gradient-to-r from-indigo-950/60 via-slate-900/90 to-emerald-950/50 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  Sinkronisasi Otomatis Laptop & HP Aktif!
                </h2>
                <span className="text-[11px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md font-mono">
                  Kode Cloud: {syncCode}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Centang habit di Laptop, maka di HP akan otomatis ikut tercentang secara <em>real-time</em>. Pastikan Anda memasukkan <strong>Kode Cloud</strong> yang sama di kedua perangkat.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
            <button
              onClick={() => setIsCloudModalOpen(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Atur Kode Sinkronisasi HP
            </button>
            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Unduh Excel (.CSV)
            </button>
          </div>
        </section>

        {/* Kartu Ringkasan KPI */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Progres Hari Ini */}
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                {isSameDay(selectedDate, today)
                  ? 'Target Hari Ini'
                  : selectedDate.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{completedOnSelectedDate}</span>
                <span className="text-sm text-slate-400">/ {habits.length} selesai</span>
              </div>
              <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {dailyCompletionPct === 100
                  ? 'Semua target hari ini tuntas!'
                  : dailyCompletionPct >= 50
                  ? 'Progres harian yang sangat bagus!'
                  : 'Mulai dari satu kebiasaan kecil'}
              </p>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500 transition-all duration-500 ease-out"
                  strokeDasharray={`${dailyCompletionPct}, 100`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-bold text-slate-200">
                {dailyCompletionPct}%
              </span>
            </div>
          </div>

          {/* Card 2: Streak Terpanjang */}
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Streak Aktif Tertinggi
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-400">{topCurrentStreak}</span>
                <span className="text-sm text-slate-400">hari beruntun</span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Rekor terbaik: <strong className="text-slate-200">{allTimeBestStreak} hari</strong>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-6 h-6 fill-amber-400/20" />
            </div>
          </div>

          {/* Card 3: Capaian Mingguan */}
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Target Minggu Ini
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-indigo-400">
                  {weeklyAnalytics.weeklySuccessRate}%
                </span>
                <span className="text-sm text-slate-400">tercapai</span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                <strong className="text-slate-200">{weeklyAnalytics.totalCompletedInWeek}</strong> dari {weeklyAnalytics.totalTargetInWeek} target mingguan
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Status Konsistensi */}
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Status Konsistensi
              </span>
              <div className="mt-1">
                <span className="text-xl font-bold text-white">
                  {weeklyAnalytics.weeklySuccessRate >= 80
                    ? 'Sangat Disiplin'
                    : weeklyAnalytics.weeklySuccessRate >= 50
                    ? 'Ritme Terjaga'
                    : 'Sedang Membangun'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                {habits.length} rutinitas aktif dipantau
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Area Utama: Kolom Kiri (Check-in Harian) + Kolom Kanan (Tabel Streak Mingguan & Grafik) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* KOLOM KIRI: Check-In Harian */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">Log Harian</h2>
                  {isSameDay(selectedDate, today) && (
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                      Hari Ini
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedDate.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>

              {/* Pemilih Tanggal Cepat */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
                <button
                  onClick={() => setSelectedDate((prev) => addDays(prev, -1))}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title="Hari Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedDate(today);
                    setWeekOffset(0);
                  }}
                  className="px-2 py-1 text-xs font-medium text-slate-300 hover:text-white"
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => {
                    const next = addDays(selectedDate, 1);
                    if (next <= today) setSelectedDate(next);
                  }}
                  disabled={isSameDay(selectedDate, today)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isSameDay(selectedDate, today)
                      ? 'text-slate-700 cursor-not-allowed'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                  title="Hari Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Kategori */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Daftar Checklist Habit */}
            <div className="space-y-3">
              {filteredHabits.length === 0 ? (
                <div className="text-center py-10 px-4 border border-dashed border-slate-800 rounded-2xl">
                  <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-300">Belum ada habit di kategori ini</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Tambahkan habit baru untuk mulai mencatat kebiasaan harian Anda.
                  </p>
                  <button
                    onClick={openCreateModal}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    <Plus className="w-4 h-4" /> Buat Habit Baru
                  </button>
                </div>
              ) : (
                filteredHabits.map((habit) => {
                  const isDone = !!(habit.logs && habit.logs[selectedDateKey]);
                  const colorStyle = getColorStyles(habit.color);
                  const IconComponent = ICONS[habit.icon]?.component || Dumbbell;
                  const currentStreak = calculateCurrentStreak(habit.logs);

                  return (
                    <div
                      key={habit.id}
                      onClick={() => toggleHabitDate(habit.id, selectedDate)}
                      className={`group relative flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                        isDone
                          ? 'bg-slate-950/60 border-emerald-500/40 shadow-sm'
                          : 'bg-slate-950/90 border-slate-800/90 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 pr-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleHabitDate(habit.id, selectedDate);
                          }}
                          className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                            isDone
                              ? `${colorStyle.bg} text-white shadow-md scale-105`
                              : 'bg-slate-900 border-2 border-slate-700 text-transparent group-hover:border-slate-500'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-semibold text-sm truncate transition-all ${
                                isDone ? 'line-through text-slate-400' : 'text-slate-100'
                              }`}
                            >
                              {habit.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium ${colorStyle.softBg} ${colorStyle.text}`}>
                              <IconComponent className="w-3 h-3" />
                              {CATEGORIES.find((c) => c.id === habit.category)?.name || habit.category}
                            </span>
                            {habit.description && (
                              <span className="text-xs text-slate-500 truncate hidden sm:inline">
                                • {habit.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                            currentStreak > 0
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}
                          title="Streak berturut-turut saat ini"
                        >
                          <Flame className={`w-3.5 h-3.5 ${currentStreak > 0 ? 'text-amber-400 fill-amber-400/30' : 'text-slate-600'}`} />
                          <span>{currentStreak}h</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(habit);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity"
                          title="Ubah atau hapus habit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Tombol Centang Semua */}
            {habits.length > 0 && completedOnSelectedDate < habits.length && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={markAllForSelectedDate}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  Centang selesai semua untuk {isSameDay(selectedDate, today) ? 'hari ini' : 'tanggal ini'}
                </button>
              </div>
            )}
          </div>

          {/* KOLOM KANAN: Tabel Matriks Mingguan & Grafik */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Papan Streak Mingguan 7 Hari */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    Tabel Streak Mingguan
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Klik kotak mana saja untuk mencentang habit di hari tersebut
                  </p>
                </div>

                {/* Navigasi Minggu */}
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1 self-start sm:self-auto">
                  <button
                    onClick={() => setWeekOffset((w) => w - 1)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                    title="Minggu Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2.5 text-xs font-semibold text-slate-200 whitespace-nowrap">
                    {weekDays[0].toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} –{' '}
                    {weekDays[6].toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                  <button
                    onClick={() => setWeekOffset((w) => Math.min(0, w + 1))}
                    disabled={weekOffset === 0}
                    className={`p-1.5 rounded-lg transition-colors ${
                      weekOffset === 0
                        ? 'text-slate-700 cursor-not-allowed'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                    title="Minggu Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tabel Matriks */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[520px]">
                  <thead>
                    <tr>
                      <th className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-400 w-48">
                        Kebiasaan (Habit)
                      </th>
                      {weeklyAnalytics.dayStats.map((dayObj) => {
                        const isSelected = isSameDay(dayObj.date, selectedDate);
                        return (
                          <th key={dayObj.key} className="pb-3 px-1 text-center">
                            <button
                              onClick={() => !dayObj.isFuture && setSelectedDate(dayObj.date)}
                              disabled={dayObj.isFuture}
                              className={`w-11 py-1.5 rounded-xl flex flex-col items-center justify-center mx-auto transition-all ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                  : dayObj.isToday
                                  ? 'bg-slate-800 text-indigo-300 border border-indigo-500/40'
                                  : dayObj.isFuture
                                  ? 'opacity-40 cursor-not-allowed text-slate-500'
                                  : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <span className="text-[10px] font-medium uppercase">
                                {dayObj.dayName}
                              </span>
                              <span className="text-xs font-bold mt-0.5">
                                {dayObj.dayNumber}
                              </span>
                            </button>
                          </th>
                        );
                      })}
                      <th className="pb-3 pl-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Target
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredHabits.map((habit) => {
                      const colorStyle = getColorStyles(habit.color);
                      const IconComponent = ICONS[habit.icon]?.component || Dumbbell;
                      const weekCompletedCount = weekDays.filter(
                        (d) => d <= today && habit.logs && habit.logs[formatDateKey(d)]
                      ).length;
                      const target = habit.targetPerWeek || 7;
                      const metTarget = weekCompletedCount >= target;

                      return (
                        <tr key={habit.id} className="group hover:bg-slate-950/40 transition-colors">
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg ${colorStyle.softBg} ${colorStyle.text} flex items-center justify-center shrink-0`}>
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-200 truncate max-w-[140px] sm:max-w-[170px]">
                                  {habit.name}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Target: {target}x / minggu
                                </p>
                              </div>
                            </div>
                          </td>

                          {weeklyAnalytics.dayStats.map((dayObj) => {
                            const completed = !!(habit.logs && habit.logs[dayObj.key]);
                            return (
                              <td key={dayObj.key} className="py-3.5 px-1 text-center">
                                <button
                                  type="button"
                                  disabled={dayObj.isFuture}
                                  onClick={() => toggleHabitDate(habit.id, dayObj.date)}
                                  className={`w-9 h-9 rounded-xl mx-auto flex items-center justify-center transition-all ${
                                    dayObj.isFuture
                                      ? 'bg-slate-900/40 border border-slate-800/40 opacity-30 cursor-not-allowed'
                                      : completed
                                      ? `${colorStyle.bg} text-white shadow-md scale-100 hover:scale-105`
                                      : 'bg-slate-950 border border-slate-800 text-transparent hover:border-slate-600'
                                  }`}
                                  title={`${habit.name} (${dayObj.key})`}
                                >
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </button>
                              </td>
                            );
                          })}

                          <td className="py-3.5 pl-3 text-right">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                                metTarget
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-950 text-slate-400 border border-slate-800'
                              }`}
                            >
                              {weekCompletedCount}/{target}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Grafik Batang Mingguan & Peringkat Konsistensi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Grafik Penyelesaian Harian */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      Grafik Mingguan
                    </h3>
                    <span className="text-xs font-semibold text-emerald-400">
                      {weeklyAnalytics.weeklySuccessRate}% Target
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Persentase habit yang selesai setiap hari
                  </p>
                </div>

                <div className="mt-6 pt-4 flex items-end justify-between gap-2 h-44 border-b border-slate-800 pb-2 px-1">
                  {weeklyAnalytics.dayStats.map((dayObj) => {
                    const isSelected = isSameDay(dayObj.date, selectedDate);
                    return (
                      <div
                        key={dayObj.key}
                        onClick={() => !dayObj.isFuture && setSelectedDate(dayObj.date)}
                        className={`flex-1 flex flex-col items-center h-full justify-end group ${
                          dayObj.isFuture ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-slate-400 mb-1.5 opacity-80 group-hover:text-white transition-opacity">
                          {dayObj.isFuture ? '—' : `${dayObj.pct}%`}
                        </span>

                        <div className="w-full max-w-[34px] h-28 bg-slate-950 rounded-xl p-1 flex items-end border border-slate-800/80 overflow-hidden">
                          <div
                            style={{ height: `${Math.max(dayObj.pct, dayObj.isFuture ? 0 : 8)}%` }}
                            className={`w-full rounded-lg transition-all duration-500 ${
                              dayObj.pct === 100
                                ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-lg shadow-emerald-500/20'
                                : dayObj.pct >= 50
                                ? 'bg-gradient-to-t from-indigo-600 to-indigo-400'
                                : dayObj.pct > 0
                                ? 'bg-amber-500/80'
                                : 'bg-slate-800'
                            }`}
                          />
                        </div>

                        <span
                          className={`mt-2 text-xs font-semibold ${
                            isSelected
                              ? 'text-indigo-400'
                              : dayObj.isToday
                              ? 'text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {dayObj.dayName}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>100% = Hari Sempurna</span>
                  <span className="text-slate-300 font-medium">
                    {weeklyAnalytics.dayStats.filter((d) => !d.isFuture && d.pct === 100).length} Hari Sempurna minggu ini
                  </span>
                </div>
              </div>

              {/* Leaderboard Konsistensi 14 Hari */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Konsistensi 14 Hari Terakhir
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 mb-4">
                    Tingkat ketekunan per habit dalam 2 minggu terakhir
                  </p>

                  <div className="space-y-3.5 max-h-52 overflow-y-auto pr-1">
                    {habits.map((habit) => {
                      const colorStyle = getColorStyles(habit.color);
                      const streak = calculateCurrentStreak(habit.logs);
                      let last14Count = 0;
                      for (let i = 0; i < 14; i++) {
                        if (habit.logs && habit.logs[formatDateKey(addDays(today, -i))]) {
                          last14Count++;
                        }
                      }
                      const rate14 = Math.round((last14Count / 14) * 100);

                      return (
                        <div key={habit.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-200 truncate pr-2">
                              {habit.name}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                                <Flame className="w-3.5 h-3.5 fill-amber-400/20" />
                                {streak}h
                              </span>
                              <span className="text-slate-400 w-9 text-right font-mono">
                                {rate14}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                            <div
                              style={{ width: `${rate14}%` }}
                              className={`h-full rounded-full transition-all duration-500 ${colorStyle.bg}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Tips: Centang sebelum tengah malam agar streak terjaga</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL 1: Sinkronisasi Cloud (Laptop & HP) + Kelola Data */}
      {isCloudModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Sinkronisasi Cloud (Laptop & HP)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Hubungkan perangkat & unduh cadangan data pribadi Anda
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCloudModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bagian 1: Kode Sinkronisasi Cloud */}
            <div className="bg-slate-950/90 border border-indigo-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4" />
                  1. Kode Sinkronisasi Cloud Anda
                </span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Real-time Aktif
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Buat kode unik milik Anda sendiri (contoh: <code className="text-indigo-300">habit-budi-2026</code>). Masukkan kode yang <strong>sama persis</strong> saat membuka aplikasi ini di Laptop maupun di HP agar centangan langsung tersambung otomatis!
              </p>

              <form onSubmit={handleApplySyncCode} className="flex flex-col sm:flex-row gap-2 pt-1">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputSyncCode}
                    onChange={(e) => setInputSyncCode(e.target.value)}
                    placeholder="Contoh: habit-rahasia-saya-99"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all shrink-0"
                >
                  Sambungkan Kode
                </button>
              </form>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400">
                  Kode aktif saat ini: <strong className="text-white font-mono">{syncCode}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCopySyncCode}
                  className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedCode ? 'Tersalin!' : 'Salin Kode'}
                </button>
              </div>
            </div>

            {/* Bagian 2: Unduh & Pulihkan File */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. Simpan ke Perangkat (Excel & Backup File)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">
                      Unduh Tabel Excel (.CSV)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Buka riwayat 30 hari di Excel
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-left transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-300">
                      Unduh Backup (.JSON)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Simpan seluruh data selamanya
                    </p>
                  </div>
                </button>
              </div>

              {/* Pulihkan dari File Backup */}
              <div className="pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-dashed border-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  Pilih File Backup (.JSON) untuk Memulihkan Data
                </button>
              </div>
            </div>

            {/* Bagian 3: Reset / Mulai dari Nol */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setConfirmActionModal('clear-all')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 px-3 py-2 rounded-xl hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Kosongkan Semua (Mulai dari Nol)
              </button>

              <button
                type="button"
                onClick={() => setConfirmActionModal('reset-demo')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Kembalikan 5 Habit Contoh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Buat atau Edit Habit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingHabit ? 'Ubah Habit' : 'Tambah Habit Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Nama Kebiasaan (Habit) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Baca 10 Halaman, Lari Pagi..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Catatan / Motivasi Singkat
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dilakukan setiap habis bangun tidur"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Target Mingguan ({formData.targetPerWeek} hari)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="7"
                    value={formData.targetPerWeek}
                    onChange={(e) =>
                      setFormData({ ...formData, targetPerWeek: Number(e.target.value) })
                    }
                    className="w-full accent-indigo-500 mt-2 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 px-1">
                    <span>1x</span>
                    <span>3x</span>
                    <span>5x</span>
                    <span>Tiap hari</span>
                  </div>
                </div>
              </div>

              {/* Pemilih Ikon */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Pilih Ikon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(ICONS).map(([key, item]) => {
                    const IconComp = item.component;
                    const selected = formData.icon === key;
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setFormData({ ...formData, icon: key })}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          selected
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[10px]">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pemilih Warna */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Warna Tema
                </label>
                <div className="flex items-center gap-2.5">
                  {COLORS.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setFormData({ ...formData, color: c.id })}
                      className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center transition-transform ${
                        formData.color === c.id
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      title={c.name}
                    >
                      {formData.color === c.id && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                {editingHabit ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteHabit(editingHabit.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all"
                  >
                    {editingHabit ? 'Simpan Perubahan' : 'Simpan Habit'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Konfirmasi Reset / Hapus Semua */}
      {confirmActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-white">
                {confirmActionModal === 'clear-all'
                  ? 'Kosongkan Semua Habit?'
                  : 'Kembalikan Data Contoh?'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {confirmActionModal === 'clear-all'
                ? 'Semua habit di Kode Cloud ini akan dihapus agar Anda bisa membuat daftar habit pribadi dari nol.'
                : 'Ini akan mengembalikan 5 habit contoh awal beserta riwayat centangannya.'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmActionModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}