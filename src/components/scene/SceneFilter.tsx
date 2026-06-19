import { Star, Filter } from 'lucide-react';
import { Difficulty } from '../../types';

interface SceneFilterProps {
  selectedDifficulty: Difficulty | null;
  selectedCategory: string;
  onDifficultyChange: (difficulty: Difficulty | null) => void;
  onCategoryChange: (category: string) => void;
}

const CATEGORIES = [
  '全部',
  '基础诊疗',
  '种植修复',
  '正畸治疗',
  '会员服务',
  '儿童牙科',
  '急诊处理',
];

export default function SceneFilter({
  selectedDifficulty,
  selectedCategory,
  onDifficultyChange,
  onCategoryChange,
}: SceneFilterProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-blue-600" />
        <span className="font-semibold text-gray-800">筛选条件</span>
      </div>

      <div className="space-y-5">
        <div>
          <div className="text-sm font-medium text-gray-700 mb-3">难度等级</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onDifficultyChange(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedDifficulty === null
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              全部
            </button>
            {([1, 2, 3, 4, 5] as Difficulty[]).map((level) => (
              <button
                key={level}
                onClick={() => onDifficultyChange(level)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                  selectedDifficulty === level
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {level}星
                <Star
                  className={`w-3.5 h-3.5 ${
                    selectedDifficulty === level
                      ? 'text-amber-300 fill-amber-300'
                      : 'text-gray-400'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-700 mb-3">场景分类</div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
