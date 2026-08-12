import { createContext, useContext, useReducer } from 'react';
import {
  initialPerencanaan,
  initialPrograms,
  initialKegiatan,
  initialSubKegiatan,
  initialUsers,
  initialActivities,
  ACCOUNT_PRESETS,
} from '../data/initialData';

const AppContext = createContext();

const STORAGE_KEY = 'sipk_garut_data';

function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return null;
}

function saveToStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

const DATA_VERSION = 7; // pure database mode

const defaultState = {
  _version: DATA_VERSION,
  currentUser: ACCOUNT_PRESETS[0], // default Sekretariat / Admin
  perencanaan: [],
  programs: [],
  kegiatan: [],
  subKegiatan: [],
  users: initialUsers,
  activities: initialActivities,
  selectedYear: 2025,
  settings: {
    appName: 'SIPK Garut',
    dinas: 'Dinkes Kab. Garut',
    tahunAnggaran: 2025,
    emailNotif: true,
    autoBackup: false,
  },
};

function getInitialState() {
  try {
    const stored = loadFromStorage();
    if (!stored) return defaultState;
    // Version check — clear old/incompatible localStorage
    if (!stored._version || stored._version < DATA_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return { ...defaultState, _version: DATA_VERSION };
    }
    // Ensure all required arrays exist and are arrays
    const required = ['perencanaan','programs','kegiatan','subKegiatan','users','activities'];
    for (const key of required) {
      if (!Array.isArray(stored[key])) {
        localStorage.removeItem(STORAGE_KEY);
        return { ...defaultState, _version: DATA_VERSION };
      }
    }
    return stored;
  } catch (e) {
    console.warn('localStorage invalid, resetting:', e);
    localStorage.removeItem(STORAGE_KEY);
    return { ...defaultState, _version: DATA_VERSION };
  }
}

function generateId(items) {
  return items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
}

function createActivity(state, actionText, color) {
  return {
    id: generateId(state.activities || []),
    user: state.currentUser?.nama || 'Admin Dinkes',
    action: actionText,
    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    color,
  };
}

function handleAddItem(state, key, label, item) {
  const newItem = { ...item, id: generateId(state[key]) };
  const labelText = item.nama || item.periode || item.tujuan || '';
  return {
    ...state,
    [key]: [...state[key], newItem],
    activities: [createActivity(state, `Menambah ${label}${labelText ? ': ' + labelText : ''}`, 'blue'), ...state.activities],
  };
}

function handleUpdateItem(state, key, label, item) {
  const labelText = item.nama || item.periode || item.tujuan || '';
  return {
    ...state,
    [key]: state[key].map(i => String(i.id) === String(item.id) ? item : i),
    activities: label ? [createActivity(state, `Memperbarui ${label}${labelText ? ': ' + labelText : ''}`, 'green'), ...state.activities] : state.activities,
  };
}

function handleDeleteItem(state, key, label, id) {
  return {
    ...state,
    [key]: state[key].filter(i => String(i.id) !== String(id)),
    activities: label ? [createActivity(state, `Menghapus ${label}`, 'red'), ...state.activities] : state.activities,
  };
}

function reducer(state, action) {
  let newState;
  switch (action.type) {
    // Perencanaan
    case 'ADD_PERENCANAAN':
      newState = handleAddItem(state, 'perencanaan', 'perencanaan', action.payload);
      break;
    case 'UPDATE_PERENCANAAN':
      newState = handleUpdateItem(state, 'perencanaan', 'perencanaan', action.payload);
      break;
    case 'DELETE_PERENCANAAN':
      newState = handleDeleteItem(state, 'perencanaan', 'perencanaan', action.payload);
      break;

    // Programs
    case 'ADD_PROGRAM':
      newState = handleAddItem(state, 'programs', 'program', action.payload);
      break;
    case 'UPDATE_PROGRAM':
      newState = handleUpdateItem(state, 'programs', 'program', action.payload);
      break;
    case 'DELETE_PROGRAM':
      newState = handleDeleteItem(state, 'programs', 'program', action.payload);
      break;

    // Kegiatan
    case 'ADD_KEGIATAN':
      newState = handleAddItem(state, 'kegiatan', 'kegiatan', action.payload);
      break;
    case 'UPDATE_KEGIATAN':
      newState = handleUpdateItem(state, 'kegiatan', 'kegiatan', action.payload);
      break;
    case 'DELETE_KEGIATAN':
      newState = handleDeleteItem(state, 'kegiatan', 'kegiatan', action.payload);
      break;

    // Sub Kegiatan
    case 'ADD_SUB_KEGIATAN':
      newState = handleAddItem(state, 'subKegiatan', 'sub kegiatan', action.payload);
      break;
    case 'UPDATE_SUB_KEGIATAN':
      newState = handleUpdateItem(state, 'subKegiatan', 'sub kegiatan', action.payload);
      break;
    case 'DELETE_SUB_KEGIATAN':
      newState = handleDeleteItem(state, 'subKegiatan', 'sub kegiatan', action.payload);
      break;

    // Users & Authentication
    case 'SET_USER':
      newState = { ...state, currentUser: action.payload };
      break;
    case 'LOGOUT':
      newState = { ...state, currentUser: null };
      break;
    case 'ADD_USER':
      newState = handleAddItem(state, 'users', null, action.payload);
      break;
    case 'UPDATE_USER':
      newState = handleUpdateItem(state, 'users', null, action.payload);
      break;
    case 'DELETE_USER':
      newState = handleDeleteItem(state, 'users', null, action.payload);
      break;

    // Settings
    case 'UPDATE_SETTINGS':
      newState = {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
      break;

    // Year
    case 'SET_YEAR':
      newState = { ...state, selectedYear: action.payload };
      break;

    // Reset
    case 'RESET_DATA':
      newState = defaultState;
      break;

    default:
      return state;
  }

  saveToStorage(newState);
  return newState;
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, getInitialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
