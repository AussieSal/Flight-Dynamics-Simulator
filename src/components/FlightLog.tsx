import React, { useState, useMemo } from 'react';
import { FlightLogEntry, LogCategory } from '../types/flight';
import { 
  ClipboardList, 
  X, 
  Trash2, 
  Download, 
  Camera, 
  TrendingUp, 
  Gauge, 
  AlertTriangle, 
  Flame, 
  Plane, 
  Search,
  Filter,
  CheckCircle,
  Copy
} from 'lucide-react';

interface FlightLogProps {
  isOpen: boolean;
  onClose: () => void;
  entries: FlightLogEntry[];
  onClearLog: () => void;
  onTakeSnapshot: (customNote?: string) => void;
}

export const FlightLog: React.FC<FlightLogProps> = ({
  isOpen,
  onClose,
  entries,
  onClearLog,
  onTakeSnapshot,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | LogCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered entries (newest on top)
  const filteredEntries = useMemo(() => {
    let result = [...entries].reverse();
    if (activeFilter !== 'all') {
      result = result.filter((e) => e.category === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.timeString.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, activeFilter, searchQuery]);

  // Counts by category
  const counts = useMemo(() => {
    const c = {
      all: entries.length,
      altitude: 0,
      airspeed: 0,
      forces: 0,
      maneuver: 0,
      alert: 0,
      system: 0,
    };
    entries.forEach((e) => {
      if (c[e.category] !== undefined) {
        c[e.category]++;
      }
    });
    return c;
  }, [entries]);

  // Export handlers
  const exportAsJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aeroforces-flight-log-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportAsCSV = () => {
    const headers = [
      'ID',
      'UTC Time',
      'Session Elapsed',
      'Category',
      'Milestone Title',
      'Description',
      'Altitude (ft)',
      'Altitude (m)',
      'Airspeed (kts)',
      'Mach',
      'Vertical Speed (fpm)',
      'Thrust (kN)',
      'Drag (kN)',
      'Lift (kN)',
      'Weight (kN)',
      'Latitude',
      'Longitude',
    ];

    const rows = entries.map((e) => [
      e.id,
      e.timeString,
      e.sessionTimeStr,
      e.category,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      e.altitudeFt,
      e.altitudeM,
      e.airspeedKts,
      e.mach,
      e.verticalSpeedFpm,
      e.forcesSnapshot.thrust,
      e.forcesSnapshot.drag,
      e.forcesSnapshot.lift,
      e.forcesSnapshot.weight,
      e.coordinates.lat,
      e.coordinates.lon,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `aeroforces-flight-log-${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const copyEntryDetails = (entry: FlightLogEntry) => {
    const text = `[${entry.timeString} | ${entry.sessionTimeStr}] ${entry.title}: ${entry.description} (Alt: ${entry.altitudeFt} ft, Spd: ${entry.airspeedKts} kts, Mach ${entry.mach}, T: ${entry.forcesSnapshot.thrust}kN, D: ${entry.forcesSnapshot.drag}kN, L: ${entry.forcesSnapshot.lift}kN, W: ${entry.forcesSnapshot.weight}kN)`;
    navigator.clipboard.writeText(text);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateSnapshot = () => {
    onTakeSnapshot(customNote.trim() || undefined);
    setCustomNote('');
    setIsAddingNote(false);
  };

  const getCategoryBadge = (cat: LogCategory) => {
    switch (cat) {
      case 'altitude':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            ALTITUDE
          </span>
        );
      case 'airspeed':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
            <Gauge className="w-3 h-3 text-cyan-400" />
            AIRSPEED
          </span>
        );
      case 'forces':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40">
            <Flame className="w-3 h-3 text-amber-400" />
            FORCES
          </span>
        );
      case 'alert':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-500/40">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            ALERT
          </span>
        );
      case 'maneuver':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/40">
            <Plane className="w-3 h-3 text-purple-400" />
            MANEUVER
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            <CheckCircle className="w-3 h-3 text-slate-400" />
            LOG
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[88vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/70 border border-cyan-800/60 text-cyan-400">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Persistent Flight Log
                </h2>
                <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                  {entries.length} Milestones
                </span>
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  PERSISTENT SESSION
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically logs altitude thresholds, airspeed milestones, and flight force changes.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingNote(!isAddingNote)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg shadow transition"
              title="Record a custom telemetry snapshot note"
            >
              <Camera className="w-3.5 h-3.5 text-slate-950" />
              <span>Log Snapshot</span>
            </button>

            <button
              onClick={exportAsCSV}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg transition"
              title="Download CSV report"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={exportAsJSON}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg transition"
              title="Download JSON log"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            <button
              onClick={onClearLog}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-900 hover:bg-red-950/60 border border-slate-700 hover:border-red-800 text-slate-400 hover:text-red-300 rounded-lg transition"
              title="Clear flight log entries"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition ml-1"
              title="Close log viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Custom Snapshot Input Drawer */}
        {isAddingNote && (
          <div className="px-5 py-3 bg-cyan-950/30 border-b border-cyan-800/40 flex items-center gap-2">
            <input
              type="text"
              placeholder="Add optional pilot log remarks (e.g. 'Cruising over North Atlantic with tailwind')..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSnapshot();
              }}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              autoFocus
            />
            <button
              onClick={handleCreateSnapshot}
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg transition"
            >
              Record Snapshot
            </button>
            <button
              onClick={() => setIsAddingNote(false)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 bg-slate-900/40 border-b border-slate-800">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              onClick={() => setActiveFilter('altitude')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition whitespace-nowrap ${
                activeFilter === 'altitude'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              Altitude ({counts.altitude})
            </button>
            <button
              onClick={() => setActiveFilter('airspeed')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition whitespace-nowrap ${
                activeFilter === 'airspeed'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Gauge className="w-3 h-3 text-cyan-400" />
              Airspeed ({counts.airspeed})
            </button>
            <button
              onClick={() => setActiveFilter('forces')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition whitespace-nowrap ${
                activeFilter === 'forces'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-400" />
              Forces ({counts.forces})
            </button>
            <button
              onClick={() => setActiveFilter('alert')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition whitespace-nowrap ${
                activeFilter === 'alert'
                  ? 'bg-red-500 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-red-400" />
              Alerts ({counts.alert})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[180px] sm:min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search milestones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Scrollable Milestone Log List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-slate-800/40">
          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Filter className="w-10 h-10 mb-2 opacity-40 text-slate-400" />
              <p className="text-sm font-medium text-slate-300">No milestones match your filter</p>
              <p className="text-xs text-slate-500 mt-1">
                Fly higher, adjust thrust/drag, or change airspeed to record new milestones!
              </p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className={`pt-3 first:pt-0 group rounded-xl p-3 transition border ${
                  entry.highlight
                    ? 'bg-slate-900/80 border-cyan-500/40 shadow-lg'
                    : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-900/70 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {getCategoryBadge(entry.category)}
                    <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                      {entry.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                      {entry.timeString}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                      {entry.sessionTimeStr}
                    </span>
                    <button
                      onClick={() => copyEntryDetails(entry)}
                      className="p-1 rounded text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition"
                      title="Copy telemetry details"
                    >
                      {copiedId === entry.id ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {entry.description}
                </p>

                {/* Telemetry Strip & 4-Forces Snapshot */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-[10px] font-mono">
                  <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-500 block">ALTITUDE</span>
                    <span className="font-bold text-emerald-400">{entry.altitudeFt.toLocaleString()} FT</span>
                    <span className="text-[9px] text-slate-400 block">({entry.altitudeM.toLocaleString()} m)</span>
                  </div>

                  <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-500 block">AIRSPEED</span>
                    <span className="font-bold text-cyan-400">{entry.airspeedKts} KTS</span>
                    <span className="text-[9px] text-slate-400 block">Mach {entry.mach}</span>
                  </div>

                  <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-500 block">VERTICAL SPEED</span>
                    <span className={`font-bold ${entry.verticalSpeedFpm >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {entry.verticalSpeedFpm > 0 ? `+${entry.verticalSpeedFpm}` : entry.verticalSpeedFpm} FPM
                    </span>
                    <span className="text-[9px] text-slate-400 block">{entry.verticalSpeedFpm >= 0 ? 'Climbing' : 'Descending'}</span>
                  </div>

                  <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-500 block">THRUST / DRAG</span>
                    <span className="text-emerald-300 font-bold">{entry.forcesSnapshot.thrust} kN</span>
                    <span className="text-slate-400"> vs </span>
                    <span className="text-red-300 font-bold">{entry.forcesSnapshot.drag} kN</span>
                  </div>

                  <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-500 block">LIFT / WEIGHT</span>
                    <span className="text-cyan-300 font-bold">{entry.forcesSnapshot.lift} kN</span>
                    <span className="text-slate-400"> vs </span>
                    <span className="text-amber-300 font-bold">{entry.forcesSnapshot.weight} kN</span>
                  </div>

                  <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-500 block">COORDINATES</span>
                    <span className="text-slate-200 font-semibold">{entry.coordinates.lat}°, {entry.coordinates.lon}°</span>
                    <span className="text-[9px] text-slate-500 block">Earth Globe</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="text-white font-mono">{filteredEntries.length}</span> of{' '}
            <span className="text-white font-mono">{entries.length}</span> recorded milestones
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span>Storage: LocalSession (Auto-Saved)</span>
          </div>
        </div>

      </div>
    </div>
  );
};
