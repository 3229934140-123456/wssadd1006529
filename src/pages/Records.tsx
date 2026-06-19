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
import {
  useRecordsStore,
  formatDuration,
  formatDate,
  getScoreLevel,
  getMostFrequentWrongIssues,
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

  const averageScore = getAverageScore();
  const totalCount = getTotalPracticeCount();
  const wrongStats = getWrongIssueTypeStats();
  const frequentWrongIssues = getMostFrequentWrongIssues(wrongStats, 3);

  const totalDuration = useMemo(() => {
    return records.reduce((sum, r) => sum + r.duration, 0);
  }, [records]);

  const passedSceneCount = useMemo(() => {
    const passedScenes = new Set<string>();
    records.forEach((r) => {
      if (r.isPassed) {
        passedScenes.add(r.sceneId);
      }
    });
    return passedScenes.size;
  }, [records]);

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => b.completedAt - a.completedAt);
  }, [records]);

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
