import { Clock, Users, Star, Trophy, RotateCcw, CheckCircle } from 'lucide-react';
import { Scene } from '../../types';
import { useRecordsStore, getScoreLevel } from '../../store/useRecordsStore';

interface SceneCardProps {
  scene: Scene;
  onClick: () => void;
}

export default function SceneCard({ scene, onClick }: SceneCardProps) {
  const getLatestRecordBySceneId = useRecordsStore((state) => state.getLatestRecordBySceneId);
  const getRecordsBySceneId = useRecordsStore((state) => state.getRecordsBySceneId);

  const latestRecord = getLatestRecordBySceneId(scene.id);
  const practiceCount = getRecordsBySceneId(scene.id).length;

  const renderStars = (difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${
          i < difficulty
            ? 'text-amber-400 fill-amber-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const scoreLevel = latestRecord ? getScoreLevel(latestRecord.score) : null;

  return (
    <div
      onClick={onClick}
      className={`relative bg-gradient-to-br ${scene.background} rounded-2xl p-6 cursor-pointer 
        transition-all duration-300 hover:scale-105 hover:shadow-xl border border-white/60
        hover:shadow-blue-100/50 group`}
    >
      <div className="absolute top-3 right-3">
        <span className="px-2.5 py-1 bg-white/80 backdrop-blur-sm text-xs font-medium text-blue-600 rounded-full">
          {scene.category}
        </span>
      </div>

      <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
        {scene.icon}
      </div>

      <h3 className="text-lg font-bold text-gray-800 mb-2">{scene.name}</h3>
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{scene.description}</p>

      <div className="flex items-center gap-1 mb-3">
        {renderStars(scene.difficulty)}
        <span className="text-xs text-gray-500 ml-1">{scene.difficulty}星难度</span>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{scene.duration}分钟</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{scene.patientCount}位患者</span>
        </div>
      </div>

      {latestRecord && (
        <div className="pt-3 border-t border-white/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${scoreLevel?.bgColor}`}>
                <Trophy className="w-3.5 h-3.5" style={{ color: 'currentColor' }} />
                <span className={`text-xs font-medium ${scoreLevel?.color}`}>
                  {latestRecord.score}分 {scoreLevel?.label}
                </span>
              </div>
              {latestRecord.isExamMode && (
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${latestRecord.isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">
                    {latestRecord.isPassed ? '通过' : '未通过'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{practiceCount}次</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
