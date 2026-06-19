import { useState } from 'react';
import { Filter, ChevronDown, Calendar, LayoutGrid, Activity } from 'lucide-react';
import { Scene } from '@/types';

interface RecordsFilterProps {
  scenes: Scene[];
  selectedSceneId: string | null;
  selectedMode: 'all' | 'practice' | 'exam';
  timeRange: 'all' | '7d' | '30d';
  onSceneChange: (sceneId: string | null) => void;
  onModeChange: (mode: 'all' | 'practice' | 'exam') => void;
  onTimeRangeChange: (range: 'all' | '7d' | '30d') => void;
}

const MODE_OPTIONS = [
  { value: 'all' as const, label: '全部' },
  { value: 'practice' as const, label: '练习模式' },
  { value: 'exam' as const, label: '考核模式' },
] as const;

const TIME_RANGE_OPTIONS = [
  { value: 'all' as const, label: '全部' },
  { value: '7d' as const, label: '最近7天' },
  { value: '30d' as const, label: '最近30天' },
] as const;

export default function RecordsFilter({
  scenes,
  selectedSceneId,
  selectedMode,
  timeRange,
  onSceneChange,
  onModeChange,
  onTimeRangeChange,
}: RecordsFilterProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedScene = scenes.find((s) => s.id === selectedSceneId);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-5">
        <Filter className="w-5 h-5 text-blue-600" />
        <span className="font-semibold text-gray-800">筛选条件</span>
      </div>

      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-3">
            <LayoutGrid className="w-4 h-4 text-gray-500" />
            <span>场景筛选</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-left flex items-center justify-between gap-2 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
            >
              <div className="flex items-center gap-2 min-w-0">
                {selectedScene ? (
                  <>
                    <span className="text-xl">{selectedScene.icon}</span>
                    <span className="text-gray-800 font-medium truncate">{selectedScene.name}</span>
                  </>
                ) : (
                  <span className="text-gray-500">全部场景</span>
                )}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => {
                      onSceneChange(null);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${selectedSceneId === null ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <LayoutGrid className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="font-medium">全部场景</span>
                    {selectedSceneId === null && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </button>
                  {scenes.map((scene) => (
                    <button
                      key={scene.id}
                      onClick={() => {
                        onSceneChange(scene.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${selectedSceneId === scene.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-lg">
                        {scene.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{scene.name}</div>
                        <div className="text-xs text-gray-400">{scene.difficulty}星难度</div>
                      </div>
                      {selectedSceneId === scene.id && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-3">
            <Activity className="w-4 h-4 text-gray-500" />
            <span>模式筛选</span>
          </div>
          <div className="flex gap-2">
            {MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onModeChange(option.value)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${selectedMode === option.value
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-3">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>时间范围</span>
          </div>
          <div className="flex gap-2">
            {TIME_RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onTimeRangeChange(option.value)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${timeRange === option.value
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
