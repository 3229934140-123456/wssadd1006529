import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Trash2,
  BarChart3,
  Target,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import RecordsFilter from '@/components/records/RecordsFilter';
import ScoreTrendChart from '@/components/records/ScoreTrendChart';
import { scenes } from '@/data/scenes';
import {
  useRecordsStore,
  formatDuration,
  formatDate,
  getScoreLevel,
  getMostFrequentWrongIssues,
  initialWrongStats,
} from '@/store/useRecordsStore';
import { ISSUE_TYPE_LABELS } from '@/types';

export default function Records() {
  const navigate = useNavigate();
  const {
    records,
    getAverageScore,
    getTotalPracticeCount,
    getWrongIssueTypeStats,
    clearRecords,
  } = useRecordsStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'all' | 'practice' | 'exam'>('all');
  const [timeRange, setTimeRange] = useState<'all' | '7d' | '30d'>('all');

  const filteredRecords = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    return records.filter((r) => {
      if (selectedSceneId !== null && r.sceneId !== selectedSceneId) {
        return false;
      }

      if (selectedMode === 'practice' && r.isExamMode) {
        return false;
      }
      if (selectedMode === 'exam' && !r.isExamMode) {
        return false;
      }

      if (timeRange === '7d' && r.completedAt < sevenDaysAgo) {
        return false;
      }
      if (timeRange === '30d' && r.completedAt < thirtyDaysAgo) {
        return false;
      }

      return true;
    });
  }, [records, selectedSceneId, selectedMode, timeRange]);

  const averageScore = useMemo(() => {
    if (filteredRecords.length === 0) return 0;
    const sum = filteredRecords.reduce((acc, r) => acc + r.score, 0);
    return Math.round(sum / filteredRecords.length);
  }, [filteredRecords]);

  const totalCount = filteredRecords.length;

  const wrongStats = useMemo(() => {
    const stats = initialWrongStats();
    filteredRecords.forEach((r) => {
      r.wrongIssueTypes.forEach((issue) => {
        stats[issue] = (stats[issue] || 0) + 1;
      });
    });
    return stats;
  }, [filteredRecords]);

  const frequentWrongIssues = getMostFrequentWrongIssues(wrongStats, 3);

  const totalDuration = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.duration, 0);
  }, [filteredRecords]);

  const passedSceneCount = useMemo(() => {
    const passedScenes = new Set<string>();
    filteredRecords.forEach((r) => {
      if (r.isPassed) {
        passedScenes.add(r.sceneId);
      }
    });
    return passedScenes.size;
  }, [filteredRecords]);

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => b.completedAt - a.completedAt);
  }, [filteredRecords]);

  const chartRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => a.completedAt - b.completedAt);
  }, [filteredRecords]);

  const handleClearRecords = () => {
    clearRecords();
    setShowClearModal(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const stats = [
    {
      icon: <Trophy className="w-6 h-6 text-amber-500" />,
      label: '总练习次数',
      value: totalCount,
      unit: '次',
      bgColor: 'bg-amber-50',
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-blue-500" />,
      label: '平均分',
      value: averageScore,
      unit: '分',
      bgColor: 'bg-blue-50',
    },
    {
      icon: <Clock className="w-6 h-6 text-emerald-500" />,
      label: '练习时长',
      value: Math.floor(totalDuration / 60),
      unit: '分钟',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-green-500" />,
      label: '通过场景数',
      value: passedSceneCount,
      unit: '个',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-white">
      <div className="container px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="md"
              onClick={() => navigate('/')}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">练习记录</h1>
              <p className="text-sm text-gray-500 mt-1">查看你的练习历史和成绩分析</p>
            </div>
          </div>
          {records.length > 0 && (
            <Button
              variant="danger"
              size="md"
              onClick={() => setShowClearModal(true)}
            >
              <Trash2 className="w-4 h-4" />
              清除记录
            </Button>
          )}
        </div>

        {records.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">暂无练习记录</h3>
            <p className="text-gray-500 mb-6">完成一次练习后，你的记录将显示在这里</p>
            <Button variant="primary" size="lg" onClick={() => navigate('/')}>
              开始练习
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6 transition-all duration-300">
              <RecordsFilter
                scenes={scenes}
                selectedSceneId={selectedSceneId}
                selectedMode={selectedMode}
                timeRange={timeRange}
                onSceneChange={setSelectedSceneId}
                onModeChange={setSelectedMode}
                onTimeRangeChange={setTimeRange}
              />
            </div>

            {filteredRecords.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-50 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">暂无匹配记录</h3>
                <p className="text-gray-500 mb-6">当前筛选条件下暂无练习记录，试试调整筛选条件或开始新练习</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 transition-all duration-300">
                  {stats.map((stat, index) => (
                    <Card key={index} className="p-5">
                      <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center mb-4`}>
                        {stat.icon}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {stat.value}
                        <span className="text-sm font-normal text-gray-500 ml-1">{stat.unit}</span>
                      </div>
                      <div className="text-sm text-gray-500">{stat.label}</div>
                    </Card>
                  ))}
                </div>

                <div className="mb-8 transition-all duration-300">
                  {chartRecords.length >= 3 ? (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 3v18h18" />
                          <path d="m19 9-5 5-4-4-3 3" />
                        </svg>
                        <h2 className="text-lg font-semibold text-gray-800">成绩走势</h2>
                        <span className="text-sm text-gray-500">
                          共 {chartRecords.length} 条记录
                          {timeRange === '7d' && ' · 最近7天'}
                          {timeRange === '30d' && ' · 最近30天'}
                        </span>
                      </div>
                      <ScoreTrendChart records={chartRecords} />
                    </>
                  ) : (
                    <Card className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 3v18h18" />
                          <path d="m19 9-5 5-4-4-3 3" />
                        </svg>
                        <h2 className="text-lg font-semibold text-gray-800">成绩走势</h2>
                        <span className="text-sm text-gray-500">共 {chartRecords.length} 条记录</span>
                      </div>
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                          </svg>
                        </div>
                        <p className="text-gray-600 font-medium mb-1">至少需要 3 条记录才能生成走势图</p>
                        <p className="text-sm text-gray-400">当前筛选条件下只有 {chartRecords.length} 条记录</p>
                      </div>
                    </Card>
                  )}
                </div>

                {frequentWrongIssues.length > 0 && (
                  <Card className="p-6 mb-8">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                        <Target className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">薄弱知识点</h2>
                        <p className="text-sm text-gray-500">最常出错的问题类型</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {frequentWrongIssues.map((issue, index) => (
                        <div key={issue.type} className="flex items-center gap-4">
                          <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-800">{issue.label}</span>
                              <span className="text-sm text-gray-500">{issue.count}次</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                                style={{
                                  width: `${(issue.count / frequentWrongIssues[0].count) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">
                    练习记录
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      共 {sortedRecords.length} 条
                    </span>
                  </h2>
                </div>

                <div className="space-y-4">
                  {sortedRecords.map((record) => {
                    const scoreLevel = getScoreLevel(record.score);
                    const isExpanded = expandedId === record.id;

                    return (
                      <Card
                        key={record.id}
                        onClick={() => toggleExpand(record.id)}
                        className="overflow-hidden cursor-pointer"
                      >
                        <div className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-2xl flex-shrink-0">
                              {record.sceneIcon}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3 className="font-semibold text-gray-900 mb-1">
                                    {record.sceneName}
                                  </h3>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge
                                      variant={record.isPassed ? 'success' : 'danger'}
                                      className="gap-1"
                                    >
                                      {record.isPassed ? (
                                        <CheckCircle2 className="w-3 h-3" />
                                      ) : (
                                        <XCircle className="w-3 h-3" />
                                      )}
                                      {record.isPassed ? '通过' : '未通过'}
                                    </Badge>
                                    <Badge variant={record.isExamMode ? 'warning' : 'info'}>
                                      {record.isExamMode ? '考核模式' : '练习模式'}
                                    </Badge>
                                    <Badge variant="default">{scoreLevel.label}</Badge>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-2xl font-bold text-gray-900">
                                    {record.score}
                                    <span className="text-sm font-normal text-gray-500">分</span>
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    {formatDate(record.completedAt)}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-4 h-4" />
                                  用时 {formatDuration(record.duration)}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <AlertTriangle className="w-4 h-4" />
                                  错题 {record.wrongPatientCount}/{record.totalPatientCount} 人
                                </div>
                              </div>
                            </div>

                            <div className="text-gray-400 flex-shrink-0">
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-5 pt-5 border-t border-gray-100">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <div className="text-sm font-medium text-gray-700 mb-2">
                                    错题数量
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-red-500">
                                      {record.wrongPatientCount}
                                    </span>
                                    <span className="text-gray-400">/</span>
                                    <span className="text-lg text-gray-600">
                                      {record.totalPatientCount} 人
                                    </span>
                                  </div>
                                  <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-red-400 rounded-full"
                                      style={{
                                        width: `${(record.wrongPatientCount / record.totalPatientCount) * 100}%`,
                                      }}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <div className="text-sm font-medium text-gray-700 mb-2">
                                    主要错因
                                  </div>
                                  {record.wrongIssueTypes.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {record.wrongIssueTypes.map((issue) => (
                                        <Badge key={issue} variant="danger">
                                          {ISSUE_TYPE_LABELS[issue]}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-400">全部正确</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="确认清除记录"
        maxWidth="max-w-sm"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-700 mb-2">
            确定要清除所有练习记录吗？
          </p>
          <p className="text-sm text-gray-500 mb-6">
            此操作不可恢复，所有历史成绩和统计数据将被清空
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowClearModal(false)}
            >
              取消
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleClearRecords}
            >
              确认清除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
