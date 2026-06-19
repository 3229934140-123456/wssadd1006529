import { useEffect } from 'react';
import { X, Clock, Users, Star, Target, Lightbulb, Play, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Scene } from '../../types';
import { usePracticeStore } from '../../store/usePracticeStore';

interface SceneDetailModalProps {
  scene: Scene | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SceneDetailModal({ scene, isOpen, onClose }: SceneDetailModalProps) {
  const navigate = useNavigate();
  const setCurrentScene = usePracticeStore((state) => state.setCurrentScene);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !scene) return null;

  const renderStars = (difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < difficulty
            ? 'text-amber-400 fill-amber-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const getExamDuration = (difficulty: number): number => {
    const durations: Record<number, number> = {
      1: 10 * 60,
      2: 15 * 60,
      3: 20 * 60,
      4: 25 * 60,
      5: 30 * 60,
    };
    return durations[difficulty] || 15 * 60;
  };

  const handleStart = (isExamMode: boolean = false) => {
    setCurrentScene(scene.id, isExamMode);
    navigate(`/scenes/${scene.id}/bill`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div
          className={`relative bg-gradient-to-br ${scene.background} p-8 pb-12`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-6xl mb-4">{scene.icon}</div>
          <span className="inline-block px-3 py-1 bg-white/80 backdrop-blur-sm text-sm font-medium text-blue-600 rounded-full mb-3">
            {scene.category}
          </span>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">{scene.name}</h2>
          <p className="text-gray-600">{scene.description}</p>

          <div className="flex items-center gap-5 mt-5">
            <div className="flex items-center gap-1.5">
              {renderStars(scene.difficulty)}
              <span className="text-sm text-gray-600 ml-1">{scene.difficulty}星难度</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{scene.duration}分钟</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <Users className="w-4 h-4" />
              <span className="text-sm">{scene.patientCount}位患者</span>
            </div>
          </div>
        </div>

        <div className="p-8 overflow-y-auto max-h-[50vh]">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800">学习目标</h3>
              </div>
              <ul className="space-y-2.5 ml-7">
                {scene.learningObjectives.map((objective, index) => (
                  <li
                    key={index}
                    className="text-gray-600 text-sm flex items-start gap-2"
                  >
                    <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                    {objective}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-gray-800">温馨提示</h3>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 ml-7">
                <ul className="space-y-2">
                  {scene.tips.map((tip, index) => (
                    <li
                      key={index}
                      className="text-amber-800 text-sm flex items-start gap-2"
                    >
                      <span className="font-medium">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-rose-500" />
                <h3 className="font-semibold text-gray-800">考核模式说明</h3>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 ml-7">
                <ul className="space-y-2.5">
                  <li className="text-rose-800 text-sm flex items-start gap-2">
                    <span className="text-base shrink-0">🎯</span>
                    <span>考核模式下会隐藏明显提示和干扰标记</span>
                  </li>
                  <li className="text-rose-800 text-sm flex items-start gap-2">
                    <span className="text-base shrink-0">⏱️</span>
                    <span>有倒计时限制（{getExamDuration(scene.difficulty) / 60}分钟）</span>
                  </li>
                  <li className="text-rose-800 text-sm flex items-start gap-2">
                    <span className="text-base shrink-0">✅</span>
                    <span>80分以上为通过</span>
                  </li>
                  <li className="text-rose-800 text-sm flex items-start gap-2">
                    <span className="text-base shrink-0">📊</span>
                    <span>考核结果会记录在练习档案中</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => handleStart(false)}
              className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-white" />
              练习模式
            </button>
            <button
              onClick={() => handleStart(true)}
              className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2"
            >
              <Trophy className="w-5 h-5" />
              正式考核
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
