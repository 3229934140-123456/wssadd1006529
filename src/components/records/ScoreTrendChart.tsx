import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, BarChart3, Layers } from 'lucide-react';
import { PracticeRecord, Scene } from '@/types';
import { formatDate } from '@/store/useRecordsStore';

interface ScoreTrendChartProps {
  records: PracticeRecord[];
  scenes?: Scene[];
  height?: number;
  onPointClick?: (record: PracticeRecord) => void;
}

interface PointData {
  x: number;
  y: number;
  record: PracticeRecord;
}

interface HoveredPoint {
  data: PointData;
  screenX: number;
  screenY: number;
}

const SCENE_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f97316',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

const getScoreColor = (score: number): string => {
  if (score < 60) return '#ef4444';
  if (score < 80) return '#3b82f6';
  return '#22c55e';
};

export default function ScoreTrendChart({
  records,
  scenes = [],
  height = 280,
  onPointClick,
}: ScoreTrendChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null);
  const [compareMode, setCompareMode] = useState<'overall' | 'scene'>('overall');
  const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>([]);

  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartHeight = height;
  const innerHeight = height - padding.top - padding.bottom;

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => a.completedAt - b.completedAt);
  }, [records]);

  const { minScore, maxScore } = useMemo(() => {
    if (sortedRecords.length === 0) return { minScore: 0, maxScore: 100 };
    const scores = sortedRecords.map((r) => r.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    
    const padding = 10;
    const yMin = Math.max(0, Math.floor((min - padding) / 10) * 10);
    const yMax = Math.min(100, Math.ceil((max + padding) / 10) * 10);
    
    return { minScore: yMin, maxScore: yMax };
  }, [sortedRecords]);

  const sceneGroups = useMemo(() => {
    const groups = new Map<string, PracticeRecord[]>();
    sortedRecords.forEach((record) => {
      if (!groups.has(record.sceneId)) {
        groups.set(record.sceneId, []);
      }
      groups.get(record.sceneId)!.push(record);
    });
    return groups;
  }, [sortedRecords]);

  const scenesWithRecords = useMemo(() => {
    return scenes.filter((s) => sceneGroups.has(s.id));
  }, [scenes, sceneGroups]);

  const visibleScenes = useMemo(() => {
    if (compareMode === 'overall') return [];
    if (selectedSceneIds.length > 0) {
      return scenesWithRecords.filter((s) => selectedSceneIds.includes(s.id));
    }
    return scenesWithRecords.slice(0, 4);
  }, [compareMode, selectedSceneIds, scenesWithRecords]);

  const toggleScene = (sceneId: string) => {
    setSelectedSceneIds((prev) =>
      prev.includes(sceneId)
        ? prev.filter((id) => id !== sceneId)
        : [...prev, sceneId]
    );
  };

  const points = useMemo((): PointData[] => {
    if (sortedRecords.length === 0) return [];

    const yRange = maxScore - minScore;
    const step = innerHeight / (yRange || 100);
    const xStep = sortedRecords.length > 1 ? 100 / (sortedRecords.length - 1) : 50;

    return sortedRecords.map((record, index) => ({
      x: sortedRecords.length === 1 ? 50 : index * xStep,
      y: 100 - (record.score - minScore) * step / (innerHeight / 100),
      record,
    }));
  }, [sortedRecords, minScore, maxScore, innerHeight]);

  const scenePoints = useMemo(() => {
    if (compareMode !== 'scene' || visibleScenes.length === 0) return [];
    
    return visibleScenes.map((scene, sceneIdx) => {
      const sceneRecords = sceneGroups.get(scene.id) || [];
      const yRange = maxScore - minScore;
      const step = innerHeight / (yRange || 100);
      
      const pts = sceneRecords.map((record, index) => {
        const overallIndex = sortedRecords.findIndex((r) => r.id === record.id);
        const x = sortedRecords.length > 1 ? (overallIndex / (sortedRecords.length - 1)) * 100 : 50;
        return {
          x,
          y: 100 - (record.score - minScore) * step / (innerHeight / 100),
          record,
        };
      });
      
      return {
        scene,
        color: SCENE_COLORS[sceneIdx % SCENE_COLORS.length],
        points: pts,
      };
    });
  }, [compareMode, visibleScenes, sceneGroups, sortedRecords, minScore, maxScore, innerHeight]);

  const trend = useMemo(() => {
    if (points.length < 2) return 'stable';
    const firstScore = points[0].record.score;
    const lastScore = points[points.length - 1].record.score;
    if (lastScore > firstScore + 5) return 'up';
    if (lastScore < firstScore - 5) return 'down';
    return 'stable';
  }, [points]);

  const trendConfig = {
    up: { icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50', label: '上升趋势' },
    down: { icon: TrendingDown, color: 'text-red-600', bgColor: 'bg-red-50', label: '下降趋势' },
    stable: { icon: Minus, color: 'text-blue-600', bgColor: 'bg-blue-50', label: '趋势平稳' },
  };

  const currentTrend = trendConfig[trend];
  const TrendIcon = currentTrend.icon;

  const generatePathData = (pts: PointData[]): string => {
    if (pts.length === 0) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  const gridLines = useMemo(() => {
    const lines: number[] = [];
    const step = (maxScore - minScore) / 5;
    for (let i = 0; i <= 5; i++) {
      lines.push(Math.round(minScore + step * i));
    }
    return lines;
  }, [minScore, maxScore]);

  const handleMouseEnter = (point: PointData, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const parentRect = event.currentTarget.closest('svg')?.getBoundingClientRect();
    if (parentRect) {
      setHoveredPoint({
        data: point,
        screenX: rect.left + rect.width / 2 - parentRect.left,
        screenY: rect.top - parentRect.top,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const handleClick = (record: PracticeRecord) => {
    onPointClick?.(record);
  };

  if (sortedRecords.length < 3) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-800">成绩走势</span>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center" style={{ height: height - 48 }}>
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <Info className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium mb-1">数据不足</p>
          <p className="text-sm text-gray-400">至少需要完成3次练习才能生成成绩走势图</p>
          <p className="text-sm text-gray-400">当前已完成 {sortedRecords.length} 次练习</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-800">成绩走势</span>
          <span className="text-sm text-gray-500">
            共 {sortedRecords.length} 条记录
          </span>
        </div>
        <div className="flex items-center gap-3">
          {scenesWithRecords.length > 0 && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setCompareMode('overall')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  compareMode === 'overall'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                总体
              </button>
              <button
                onClick={() => setCompareMode('scene')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                  compareMode === 'scene'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                场景对比
              </button>
            </div>
          )}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${currentTrend.bgColor}`}>
            <TrendIcon className={`w-4 h-4 ${currentTrend.color}`} />
            <span className={`text-sm font-medium ${currentTrend.color}`}>{currentTrend.label}</span>
          </div>
        </div>
      </div>

      {compareMode === 'scene' && scenesWithRecords.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {scenesWithRecords.map((scene, idx) => {
            const color = SCENE_COLORS[idx % SCENE_COLORS.length];
            const isSelected = visibleScenes.some((s) => s.id === scene.id);
            return (
              <button
                key={scene.id}
                onClick={() => toggleScene(scene.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-white border-2 shadow-sm'
                    : 'bg-gray-50 border-2 border-gray-100 opacity-60 hover:opacity-100'
                }`}
                style={{ borderColor: isSelected ? color : 'transparent' }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-gray-700">{scene.name}</span>
                <span className="text-gray-400">
                  ({sceneGroups.get(scene.id)?.length || 0})
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="relative" style={{ height: chartHeight }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0"
          style={{
            paddingTop: padding.top,
            paddingRight: padding.right,
            paddingBottom: padding.bottom,
            paddingLeft: padding.left,
            width: '100%',
            height: chartHeight,
          }}
        >
          {gridLines.map((value) => {
            const y = 100 - ((value - minScore) / (maxScore - minScore || 1)) * 100;
            return (
              <g key={value}>
                <line
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="0.3"
                />
                {value === 60 && (
                  <line
                    x1="0"
                    y1={y}
                    x2="100"
                    y2={y}
                    stroke="#f97316"
                    strokeWidth="0.3"
                    strokeDasharray="1,1"
                  />
                )}
                {value === 80 && (
                  <line
                    x1="0"
                    y1={y}
                    x2="100"
                    y2={y}
                    stroke="#22c55e"
                    strokeWidth="0.3"
                    strokeDasharray="1,1"
                  />
                )}
              </g>
            );
          })}

          {compareMode === 'overall' ? (
            <>
              <path
                d={generatePathData(points)}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: '100',
                  strokeDashoffset: '100',
                  animation: 'drawLine 0.8s ease-out forwards',
                }}
              />
              {points.map((point, index) => {
                const color = getScoreColor(point.record.score);
                return (
                  <g key={point.record.id}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="1.5"
                      fill={color}
                      className="cursor-pointer transition-all duration-200"
                      style={{
                        opacity: 0,
                        animation: 'fadeIn 0.3s ease-out forwards',
                        animationDelay: `${0.5 + index * 0.05}s`,
                      }}
                      onMouseEnter={(e) => handleMouseEnter(point, e)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleClick(point.record)}
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="2.5"
                      fill="transparent"
                      stroke={color}
                      strokeWidth="0.3"
                      className="cursor-pointer transition-all duration-200"
                      style={{
                        opacity: 0,
                        animation: 'fadeIn 0.3s ease-out forwards',
                        animationDelay: `${0.5 + index * 0.05}s`,
                      }}
                      onMouseEnter={(e) => handleMouseEnter(point, e)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleClick(point.record)}
                    />
                  </g>
                );
              })}
            </>
          ) : (
            scenePoints.map((group, groupIdx) => (
              <g key={group.scene.id}>
                <path
                  d={generatePathData(group.points)}
                  fill="none"
                  stroke={group.color}
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: '100',
                    strokeDashoffset: '100',
                    animation: `drawLine 0.8s ease-out forwards`,
                    animationDelay: `${groupIdx * 0.2}s`,
                  }}
                />
                {group.points.map((point, idx) => (
                  <circle
                    key={`${group.scene.id}-${point.record.id}`}
                    cx={point.x}
                    cy={point.y}
                    r="1.2"
                    fill={group.color}
                    className="cursor-pointer transition-all duration-200"
                    style={{
                      opacity: 0,
                      animation: 'fadeIn 0.3s ease-out forwards',
                      animationDelay: `${0.5 + groupIdx * 0.2 + idx * 0.03}s`,
                    }}
                    onMouseEnter={(e) => handleMouseEnter(point, e)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleClick(point.record)}
                  />
                ))}
              </g>
            ))
          )}
        </svg>

        <div
          className="absolute flex flex-col justify-between text-xs text-gray-400"
          style={{
            top: padding.top,
            left: 0,
            width: padding.left - 8,
            height: innerHeight,
            textAlign: 'right',
          }}
        >
          {gridLines.slice().reverse().map((value) => (
            <div key={value} className="leading-none">
              {value}
            </div>
          ))}
        </div>

        <div
          className="absolute flex justify-between text-xs text-gray-400"
          style={{
            bottom: 10,
            left: padding.left,
            right: padding.right,
            height: padding.bottom - 10,
          }}
        >
          {points.filter((_, i, arr) => i === 0 || i === arr.length - 1 || i === Math.floor(arr.length / 2)).map((point) => (
            <div
              key={point.record.id}
              className="flex flex-col items-center"
              style={{
                position: 'absolute',
                left: `${point.x}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="text-gray-500 font-medium">
                {new Date(point.record.completedAt).getMonth() + 1}/{new Date(point.record.completedAt).getDate()}
              </div>
            </div>
          ))}
        </div>

        {hoveredPoint && (
          <div
            className="absolute z-10 pointer-events-none bg-gray-900 text-white rounded-lg p-3 shadow-xl text-xs min-w-[180px]"
            style={{
              left: `${hoveredPoint.screenX + padding.left}px`,
              top: `${hoveredPoint.screenY - 10}px`,
              transform: hoveredPoint.screenX > 200 ? 'translate(-110%, -100%)' : 'translate(10px, -100%)',
            }}
          >
            <div className="font-semibold text-sm mb-2 flex items-center gap-2">
              <span style={{ color: getScoreColor(hoveredPoint.data.record.score) }}>
                {hoveredPoint.data.record.score}分
              </span>
              <span className="text-gray-300 text-[10px]">
                {hoveredPoint.data.record.isExamMode ? '考核模式' : '练习模式'}
              </span>
            </div>
            <div className="space-y-1 text-gray-300">
              <div className="flex justify-between gap-4">
                <span>场景：</span>
                <span className="text-white">{hoveredPoint.data.record.sceneName}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>时间：</span>
                <span className="text-white">{formatDate(hoveredPoint.data.record.completedAt)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>状态：</span>
                <span className={hoveredPoint.data.record.isPassed ? 'text-green-400' : 'text-red-400'}>
                  {hoveredPoint.data.record.isPassed ? '通过' : '未通过'}
                </span>
              </div>
            </div>
            <div
              className="absolute w-2 h-2 bg-gray-900 rotate-45"
              style={{
                left: hoveredPoint.screenX > 200 ? 'auto' : '-4px',
                right: hoveredPoint.screenX > 200 ? '-4px' : 'auto',
                top: '50%',
                marginTop: '-4px',
              }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-red-500 rounded" />
          <span className="text-xs text-gray-500">未及格 (&lt;60)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-blue-500 rounded" />
          <span className="text-xs text-gray-500">良好 (60-79)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-green-500 rounded" />
          <span className="text-xs text-gray-500">优秀 (≥80)</span>
        </div>
      </div>

      {compareMode === 'scene' && (
        <div className="mt-4 pt-4 border-t border-gray-50">
          <p className="text-xs text-gray-500 mb-2">场景平均得分对比</p>
          <div className="space-y-2">
            {scenesWithRecords
              .map((scene) => {
                const sceneRecords = sceneGroups.get(scene.id) || [];
                const avgScore = sceneRecords.length > 0
                  ? Math.round(sceneRecords.reduce((sum, r) => sum + r.score, 0) / sceneRecords.length)
                  : 0;
                return { scene, avgScore, count: sceneRecords.length };
              })
              .sort((a, b) => b.avgScore - a.avgScore)
              .map((item, idx) => (
                <div key={item.scene.id} className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: SCENE_COLORS[idx % SCENE_COLORS.length] }}
                  />
                  <span className="text-xs text-gray-600 w-24 truncate">{item.scene.name}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.avgScore}%`,
                        backgroundColor: SCENE_COLORS[idx % SCENE_COLORS.length],
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-10 text-right">
                    {item.avgScore}分
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
