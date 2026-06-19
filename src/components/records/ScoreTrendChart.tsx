import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { PracticeRecord } from '@/types';
import { formatDate } from '@/store/useRecordsStore';

interface ScoreTrendChartProps {
  records: PracticeRecord[];
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

const getScoreColor = (score: number): string => {
  if (score < 60) return '#ef4444';
  if (score < 80) return '#3b82f6';
  return '#22c55e';
};

const getSegmentColor = (startScore: number, endScore: number): string => {
  const avgScore = (startScore + endScore) / 2;
  return getScoreColor(avgScore);
};

export default function ScoreTrendChart({
  records,
  height = 240,
  onPointClick,
}: ScoreTrendChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null);

  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = '100%';
  const chartHeight = height;
  const innerHeight = height - padding.top - padding.bottom;

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => a.completedAt - b.completedAt);
  }, [records]);

  const points = useMemo((): PointData[] => {
    if (sortedRecords.length === 0) return [];

    const step = innerHeight / 100;
    const xStep = sortedRecords.length > 1 ? 100 / (sortedRecords.length - 1) : 50;

    return sortedRecords.map((record, index) => ({
      x: sortedRecords.length === 1 ? 50 : index * xStep,
      y: 100 - record.score * step,
      record,
    }));
  }, [sortedRecords, innerHeight]);

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

  const generatePathData = (): string => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  const generateGradientSegments = (): { d: string; color: string; key: string }[] => {
    const segments: { d: string; color: string; key: string }[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      const color = getSegmentColor(start.record.score, end.record.score);
      segments.push({
        d: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
        color,
        key: `segment-${i}`,
      });
    }
    return segments;
  };

  const gridLines = [0, 20, 40, 60, 80, 100];
  const segments = generateGradientSegments();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
          <span className="font-semibold text-gray-800">成绩走势</span>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${currentTrend.bgColor}`}>
          <TrendIcon className={`w-4 h-4 ${currentTrend.color}`} />
          <span className={`text-sm font-medium ${currentTrend.color}`}>{currentTrend.label}</span>
        </div>
      </div>

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
            width: chartWidth,
            height: chartHeight,
          }}
        >
          {gridLines.map((value) => (
            <g key={value}>
              <line
                x1="0"
                y1={100 - value}
                x2="100"
                y2={100 - value}
                stroke={value === 60 || value === 80 ? 'transparent' : '#f1f5f9'}
                strokeWidth="0.3"
              />
              {value === 60 && (
                <line
                  x1="0"
                  y1={100 - value}
                  x2="100"
                  y2={100 - value}
                  stroke="#f97316"
                  strokeWidth="0.3"
                  strokeDasharray="1,1"
                />
              )}
              {value === 80 && (
                <line
                  x1="0"
                  y1={100 - value}
                  x2="100"
                  y2={100 - value}
                  stroke="#22c55e"
                  strokeWidth="0.3"
                  strokeDasharray="1,1"
                />
              )}
            </g>
          ))}

          <path
            d={generatePathData()}
            fill="none"
            stroke="transparent"
            strokeWidth="2"
            className="animate-pulse"
          />

          {segments.map((segment) => (
            <path
              key={segment.key}
              d={segment.d}
              fill="none"
              stroke={segment.color}
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: '100',
                strokeDashoffset: '100',
                animation: 'drawLine 0.6s ease-out forwards',
                animationDelay: `${parseInt(segment.key.split('-')[1]) * 0.1}s`,
              }}
            />
          ))}

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
                    animationDelay: `${segments.length * 0.1 + index * 0.05 + 0.2}s`,
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
                    animationDelay: `${segments.length * 0.1 + index * 0.05 + 0.2}s`,
                  }}
                  onMouseEnter={(e) => handleMouseEnter(point, e)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleClick(point.record)}
                />
              </g>
            );
          })}
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
          {points.map((point, index) => (
            <div
              key={point.record.id}
              className="flex flex-col items-center"
              style={{
                position: 'absolute',
                left: `${point.x}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="text-gray-500 font-medium">{index + 1}</div>
              <div className="text-gray-400 text-[10px] mt-0.5">
                {new Date(point.record.completedAt).getMonth() + 1}/{new Date(point.record.completedAt).getDate()}
              </div>
            </div>
          ))}
        </div>

        {hoveredPoint && (
          <div
            className="absolute z-10 pointer-events-none bg-gray-900 text-white rounded-lg p-3 shadow-xl text-xs min-w-[160px]"
            style={{
              left: `${(hoveredPoint.screenX / (hoveredPoint.screenX > 0 ? 1 : 1)) + padding.left}px`,
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
          <span className="text-xs text-gray-500">未及格 (0-59)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-blue-500 rounded" />
          <span className="text-xs text-gray-500">良好 (60-79)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-green-500 rounded" />
          <span className="text-xs text-gray-500">优秀 (80-100)</span>
        </div>
      </div>

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
