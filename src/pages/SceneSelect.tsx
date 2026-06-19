import { useState, useMemo } from 'react';
import { Sparkles, GraduationCap, Target, Award, BookOpen } from 'lucide-react';
import SceneCard from '../components/scene/SceneCard';
import SceneFilter from '../components/scene/SceneFilter';
import SceneDetailModal from '../components/scene/SceneDetailModal';
import { scenes } from '../data/scenes';
import { Scene, Difficulty } from '../types';
import { useRecordsStore, getScoreLevel } from '../store/useRecordsStore';

export default function SceneSelect() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getAverageScore = useRecordsStore((state) => state.getAverageScore);
  const getTotalPracticeCount = useRecordsStore((state) => state.getTotalPracticeCount);
  const records = useRecordsStore((state) => state.records);

  const averageScore = getAverageScore();
  const totalPracticeCount = getTotalPracticeCount();
  const practicedSceneCount = useMemo(() => {
    const uniqueSceneIds = new Set(records.map((r) => r.sceneId));
    return uniqueSceneIds.size;
  }, [records]);

  const scoreLevel = averageScore > 0 ? getScoreLevel(averageScore) : null;

  const filteredScenes = useMemo(() => {
    return scenes.filter((scene) => {
      const matchDifficulty =
        selectedDifficulty === null || scene.difficulty === selectedDifficulty;
      const matchCategory =
        selectedCategory === '全部' || scene.category === selectedCategory;
      return matchDifficulty && matchCategory;
    });
  }, [selectedDifficulty, selectedCategory]);

  const handleCardClick = (scene: Scene) => {
    setSelectedScene(scene);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedScene(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-white">
      <div className="container px-4 py-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-8 md:p-12 mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="absolute top-1/2 right-20 w-32 h-32 bg-white/5 rounded-full" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-5">
              <Sparkles className="w-4 h-4" />
              口腔诊所收银培训系统
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              🦷 日清对账训练营
            </h1>
            <p className="text-xl text-blue-100 mb-6">
              口腔诊所收银培训 · 新人上岗考核
            </p>
            <p className="text-blue-50/90 leading-relaxed max-w-2xl mb-8">
              通过真实场景模拟，掌握口腔诊所日常收银对账流程。从基础诊疗到复杂的种植正畸病例，
              系统学习会员卡、退费、减免等各类业务的核对方法，确保每日账目清晰准确。
            </p>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{scenes.length}</div>
                  <div className="text-sm text-white/70">实训场景</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  📋
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {scenes.reduce((sum, s) => sum + s.patientCount, 0)}+
                  </div>
                  <div className="text-sm text-white/70">病例练习</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  ⏱️
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {scenes.reduce((sum, s) => sum + s.duration, 0)}+
                  </div>
                  <div className="text-sm text-white/70">分钟训练</div>
                </div>
              </div>
            </div>

            {totalPracticeCount > 0 && (
              <div className="mt-8 pt-6 border-t border-white/20">
                <div className="text-white/80 text-sm font-medium mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  我的学习进度
                </div>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-3 text-white/90">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      🎯
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {averageScore}分
                        {scoreLevel && (
                          <span className="ml-2 text-sm font-normal text-white/70">
                            {scoreLevel.label}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-white/70">平均分</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-white/90">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{practicedSceneCount}</div>
                      <div className="text-sm text-white/70">已练习场景</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-white/90">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{totalPracticeCount}</div>
                      <div className="text-sm text-white/70">总练习次数</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <SceneFilter
            selectedDifficulty={selectedDifficulty}
            selectedCategory={selectedCategory}
            onDifficultyChange={setSelectedDifficulty}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            可选场景
            <span className="ml-2 text-sm font-normal text-gray-500">
              共 {filteredScenes.length} 个
            </span>
          </h2>
        </div>

        {filteredScenes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredScenes.map((scene) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                onClick={() => handleCardClick(scene)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              暂无符合条件的场景
            </h3>
            <p className="text-gray-500">请调整筛选条件后重试</p>
          </div>
        )}
      </div>

      <SceneDetailModal
        scene={selectedScene}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
