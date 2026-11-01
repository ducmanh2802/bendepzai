import React, { useState, useEffect, useRef } from 'react';
import { Lesson, SubjectType, Topic } from '../../types';
import { getTopicsBySubject } from '../../data/curriculum';
import { StorageService } from '../../services/storage';
import { sound } from '../../services/sound';
import { LessonPlayerModal } from '../learning/LessonPlayerModal';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { ArrowLeft, CheckCircle2, Star, Sparkles, Play, Lock, Volume2, X } from 'lucide-react';
import { KidButton, Pill, ProgressStars } from '../ui';

interface SubjectScreenProps {
  subject: SubjectType;
  onBack: () => void;
  onProfileUpdate: () => void;
  /** Opens the Kid's Box Companion track (English only). */
  onOpenKidBox?: () => void;
}

interface PathPoint {
  x: number;
  y: number;
  lesson: Lesson;
  topicIdx: number;
  lessonIdx: number;
  globalIdx: number;
}

interface ChestPosition {
  x: number;
  y: number;
  topic: Topic;
  topicIdx: number;
}

const LESSON_BUTTON_SIZE = 72;
const PATH_PADDING = 60;
const VERTICAL_SPACING = 160;
const HORIZONTAL_AMPLITUDE = 220;

export const SubjectScreen: React.FC<SubjectScreenProps> = ({
  subject,
  onBack,
  onProfileUpdate,
  onOpenKidBox,
}) => {
  const topics: Topic[] = getTopicsBySubject(subject);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [showLessonPopup, setShowLessonPopup] = useState<Lesson | null>(null);
  const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null);
  // Popup giới thiệu bài là hộp thoại thật: phải bẫy Tab và trả focus về nút
  // bài học khi đóng, nếu không bé dùng bàn phím/switch sẽ lạc ra sau lớp phủ.
  const lessonPopupRef = useFocusTrap<HTMLDivElement>(!!showLessonPopup);
  const profile = StorageService.getChildProfile();

  const subjectInfo = {
    'tieng-viet': {
      title: 'Vương Quốc Tiếng Việt Lớp 1',
      subtitle: 'Học chữ cái, ghép âm, vần, chính tả và đọc hiểu mẩu chuyện',
      mascotEmoji: '🐻',
      mascotName: 'Gấu Bút Chì',
      color: 'from-amber-400 to-orange-500',
      welcome: 'Chào bé đến với thế giới Tiếng Việt rực rỡ sắc màu!',
      variant: 'subject-viet' as const,
    },
    'toan': {
      title: 'Thành Phố Toán Học Lớp 1',
      subtitle: 'Đếm số, so sánh >, <, =, cộng trừ trong phạm vi 10 & 20, hình học',
      mascotEmoji: '🦊',
      mascotName: 'Cáo Toán',
      color: 'from-blue-400 to-cyan-500',
      welcome: 'Cáo Toán xin chào! Cùng nhau tính toán siêu vui nhé!',
      variant: 'subject-math' as const,
    },
    'english': {
      title: 'Đảo Phiêu Lưu Tiếng Anh',
      subtitle: 'Ngữ âm, số đếm, màu sắc, động vật, gia đình và bộ phận cơ thể',
      mascotEmoji: '🐰',
      mascotName: 'Thỏ Tiếng Anh',
      color: 'from-emerald-400 to-teal-500',
      welcome: 'Chào bé đến với Đảo Tiếng Anh! Cùng học tiếng Anh thật vui nhé!',
      variant: 'subject-english' as const,
    },
    'cuoc-song': {
      title: 'Làng Cuộc Sống Lớp 1',
      subtitle: 'Cảm xúc · An toàn · Kỹ năng sống · Quan sát',
      mascotEmoji: '🐻',
      mascotName: 'Gấu Bút Chì',
      color: 'from-purple-500 to-violet-500',
      welcome: 'Chào bé đến với Làng Cuộc Sống! Học cách sống vui và an toàn nhé!',
      variant: 'subject-viet' as const,
    },
  }[subject];

  // Build path points for all lessons across all topics
  const pathPoints = React.useMemo((): PathPoint[] => {
    const points: PathPoint[] = [];
    let globalIdx = 0;
    topics.forEach((topic, topicIdx) => {
      topic.lessons.forEach((lesson, lessonIdx) => {
        const isEvenRow = topicIdx % 2 === 0;
        const x = isEvenRow
          ? PATH_PADDING + HORIZONTAL_AMPLITUDE * (lessonIdx / Math.max(1, topic.lessons.length - 1))
          : PATH_PADDING + HORIZONTAL_AMPLITUDE * (1 - lessonIdx / Math.max(1, topic.lessons.length - 1));
        const y = PATH_PADDING + topicIdx * VERTICAL_SPACING + lessonIdx * (VERTICAL_SPACING / Math.max(1, topic.lessons.length));
        points.push({ x, y, lesson, topicIdx, lessonIdx, globalIdx });
        globalIdx++;
      });
    });
    return points;
  }, [topics]);

  // Build chest positions (at end of each topic)
  const chestPositions = React.useMemo((): ChestPosition[] => {
    return topics.map((topic, topicIdx) => {
      const topicPoints = pathPoints.filter((p) => p.topicIdx === topicIdx);
      const lastPoint = topicPoints[topicPoints.length - 1];
      const isEvenRow = topicIdx % 2 === 0;
      const chestX = isEvenRow ? lastPoint.x + 100 : lastPoint.x - 100;
      return { x: chestX, y: lastPoint.y, topic, topicIdx };
    });
  }, [topics, pathPoints]);

  // Generate SVG path (zig-zag)
  const svgPath = React.useMemo(() => {
    if (pathPoints.length < 2) return '';
    let d = `M ${pathPoints[0].x} ${pathPoints[0].y}`;
    for (let i = 1; i < pathPoints.length; i++) {
      const prev = pathPoints[i - 1];
      const curr = pathPoints[i];
      const cpX = (prev.x + curr.x) / 2;
      const cpY1 = prev.y + (curr.y - prev.y) * 0.3;
      const cpY2 = prev.y + (curr.y - prev.y) * 0.7;
      d += ` C ${cpX} ${cpY1}, ${cpX} ${cpY2}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [pathPoints]);

  // Determine lesson status
  const getLessonStatus = (lesson: Lesson, globalIdx: number) => {
    const isCompleted = profile.completedLessons.includes(lesson.id);
    const completedCount = profile.completedLessons.length;
    const isUnlocked = profile.unlockAllLessons || globalIdx <= completedCount;
    const isCurrent = !isCompleted && isUnlocked && globalIdx === completedCount;
    const isLocked = !isUnlocked && !isCompleted;
    return { isCompleted, isCurrent, isLocked, isUnlocked };
  };

  // Determine chest status
  const getChestStatus = (topic: Topic) => {
    const allCompleted = topic.lessons.every((l) => profile.completedLessons.includes(l.id));
    const isClaimed = profile.chestState[topic.id] === true;
    return { allCompleted, isClaimed, canClaim: allCompleted && !isClaimed };
  };

  const handleLessonClick = (lesson: Lesson, globalIdx: number) => {
    const status = getLessonStatus(lesson, globalIdx);
    if (status.isLocked) {
      sound.playWrong();
      return;
    }
    sound.playClick();
    setShowLessonPopup(lesson);
  };

  const handleStartLesson = (lesson: Lesson) => {
    sound.playClick();
    setShowLessonPopup(null);
    setActiveLesson(lesson);
  };

  // Esc đóng popup giới thiệu, giống mọi hộp thoại khác trong app.
  useEffect(() => {
    if (!showLessonPopup) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowLessonPopup(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showLessonPopup]);

  const handleLessonComplete = () => {
    // T20A / B-03 — this used to also unmount the lesson, so the player's own
    // "CHÚC MỪNG BÉ HOÀN THÀNH!" screen (sao/XP/vé + "Về bản đồ") never showed:
    // the child finished a lesson and was dropped straight back on the map
    // without ever seeing what they earned. Rewards are already recorded by
    // LessonPlayerModal (StorageService.completeLesson), so here we only
    // refresh the profile and let the child tap "Về bản đồ" to leave.
    onProfileUpdate();
  };

  const handleClaimChest = (topic: Topic) => {
    const starsAwarded = StorageService.claimTopicChest(topic.id, subject, 3);
    if (starsAwarded > 0) {
      sound.playLevelUp();
      onProfileUpdate();
    } else {
      sound.playWrong();
    }
  };

  const handlePlayDescription = (lesson: Lesson) => {
    sound.speak(lesson.description, subject === 'english' ? 'en-GB' : 'vi-VN');
  };

  // Auto-scroll to current lesson on mount
  useEffect(() => {
    if (scrollContainerRef) {
      const completedCount = profile.completedLessons.length;
      const currentPoint = pathPoints.find((p) => p.globalIdx === completedCount);
      if (currentPoint && scrollContainerRef) {
        const container = scrollContainerRef;
        const targetY = currentPoint.y - container.clientHeight / 2 + LESSON_BUTTON_SIZE / 2;
        container.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      }
    }
  }, [pathPoints, profile.completedLessons.length]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6 select-none">
      {/* Top Bar with back button */}
      <div className="flex items-center justify-between">
        <KidButton
          variant="secondary"
          size="md"
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Quay Lại
        </KidButton>

        {/* T20A / B-10 — the pill is `whitespace-nowrap`, so the long
            "Chương trình Chuẩn Lớp 1 · N Chủ Điểm" label pushed this row
            ~59px past a 360px phone. Shorter wording keeps it on one line. */}
        <Pill variant="default" size="sm" className="bg-amber-100/80 text-amber-900 border-amber-300">
          Chuẩn Lớp 1 · {topics.length} Chủ Điểm
        </Pill>
      </div>

      {/* Hero Subject Banner */}
      <div
        className={`bg-gradient-to-r ${subjectInfo.color} rounded-3xl p-6 md:p-8 text-white shadow-xl border-4 border-white/60 flex flex-col md:flex-row items-center justify-between gap-6`}
      >
        <div className="flex items-center gap-5 text-center md:text-left">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center text-5xl md:text-6xl border-4 border-amber-200 animate-float shrink-0">
            {subjectInfo.mascotEmoji}
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-100">
              Linh vật: {subjectInfo.mascotName}
            </span>
            <h1 className="text-2xl md:text-3xl font-black font-display mt-0.5">
              {subjectInfo.title}
            </h1>
            <p className="text-xs md:text-sm text-white/90 font-bold mt-1 max-w-xl leading-relaxed">
              {subjectInfo.subtitle}
            </p>
          </div>
        </div>

        <KidButton
          variant="secondary"
          size="md"
          className="shrink-0"
          onClick={() => sound.speak(subjectInfo.welcome, subject === 'english' ? 'en-GB' : 'vi-VN')}
          leftIcon="🔊"
        >
          Nghe giới thiệu
        </KidButton>
      </div>

      {/* Adventure Path */}
      <div
        ref={setScrollContainerRef}
        className="relative overflow-y-auto overflow-x-hidden"
        style={{ maxHeight: '70vh' }}
        data-testid="subject-adventure-path"
      >
        <div className="relative" style={{ minHeight: `${topics.length * VERTICAL_SPACING + PATH_PADDING * 2}px` }}>
          {/* SVG Path */}
          <svg
            className="absolute left-0 top-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${PATH_PADDING * 2 + HORIZONTAL_AMPLITUDE} ${topics.length * VERTICAL_SPACING + PATH_PADDING * 2}`}
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%' }}
          >
            {/* Path line */}
            <path
              d={svgPath}
              stroke="#fbbf24"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-60"
            />
            {/* Path glow for current lesson */}
            {pathPoints.map((point) => {
              const status = getLessonStatus(point.lesson, point.globalIdx);
              if (status.isCurrent) {
                return (
                  <circle
                    key={`glow-${point.globalIdx}`}
                    cx={point.x}
                    cy={point.y}
                    r="40"
                    fill="#fde047"
                    fillOpacity="0.3"
                    className="animate-pulse"
                  />
                );
              }
              return null;
            })}
          </svg>

          {/* Topic Labels */}
          {topics.map((topic, topicIdx) => {
            const topicPoints = pathPoints.filter((p) => p.topicIdx === topicIdx);
            const firstPoint = topicPoints[0];
            const isEvenRow = topicIdx % 2 === 0;
            return (
              <div
                key={`topic-label-${topic.id}`}
                className="absolute pointer-events-none z-20"
                style={{
                  left: isEvenRow ? '10px' : 'auto',
                  right: isEvenRow ? 'auto' : '10px',
                  top: `${firstPoint.y - 30}px`,
                }}
              >
                <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full border-2 border-amber-300 shadow-lg text-xs font-black text-amber-900 whitespace-nowrap">
                  {topic.title}
                </div>
              </div>
            );
          })}

          {/* Lesson Buttons */}
          {pathPoints.map((point) => {
            const status = getLessonStatus(point.lesson, point.globalIdx);
            const starsEarned = profile.lessonStars[point.lesson.id] || 0;
            const isLeftSide = point.topicIdx % 2 === 0;

            return (
              <button
                key={point.lesson.id}
                onClick={() => handleLessonClick(point.lesson, point.globalIdx)}
                disabled={status.isLocked}
                className="absolute pointer-events-auto transition-all duration-300 z-10"
                style={{
                  left: `${point.x - LESSON_BUTTON_SIZE / 2}px`,
                  top: `${point.y - LESSON_BUTTON_SIZE / 2}px`,
                  width: `${LESSON_BUTTON_SIZE}px`,
                  height: `${LESSON_BUTTON_SIZE}px`,
                }}
                data-testid={`lesson-button-${point.lesson.id}`}
                aria-label={status.isCompleted ? `Bài ${point.lesson.title}, đã hoàn thành` : status.isCurrent ? `Bài ${point.lesson.title}, đang học` : status.isLocked ? `Bài ${point.lesson.title}, bị khoá` : `Bài ${point.lesson.title}, sắp tới`}
              >
                <div
                  className={`relative w-full h-full rounded-full border-4 flex items-center justify-center ${
                    status.isCompleted
                      ? 'bg-gradient-to-br from-amber-300 to-amber-500 border-amber-400 shadow-xl'
                      : status.isCurrent
                      ? 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-500 shadow-[0_0_0_4px_rgba(251,191,36,0.5)] animate-pulse-ring'
                      : status.isUnlocked
                      ? 'bg-slate-100 border-slate-300 hover:bg-slate-200'
                      : 'bg-slate-100/50 border-slate-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {status.isCompleted && (
                    <div className="absolute -top-1 -right-1 flex gap-0.5">
                      {Array.from({ length: starsEarned }, (_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-500" />
                      ))}
                    </div>
                  )}
                  {status.isLocked && (
                    <Lock className="w-10 h-10 text-slate-400" aria-hidden="true" />
                  )}
                  {!status.isCompleted && !status.isLocked && (
                    <span className="text-2xl font-black text-slate-900">{point.lessonIdx + 1}</span>
                  )}
                  {status.isCurrent && (
                    <div className="absolute -left-10 top-1/2 -translate-y-1/2 text-3xl animate-bounce" aria-hidden="true">
                      🐻
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {/* Chest Buttons */}
          {chestPositions.map((chest) => {
            const chestStatus = getChestStatus(chest.topic);
            const isLeftSide = chest.topicIdx % 2 === 0;

            return (
              <button
                key={`chest-${chest.topic.id}`}
                onClick={() => handleClaimChest(chest.topic)}
                disabled={!chestStatus.canClaim}
                className="absolute pointer-events-auto transition-all duration-300 z-10"
                style={{
                  left: isLeftSide ? `${chest.x - 50}px` : `${chest.x - 50}px`,
                  top: `${chest.y - 50}px`,
                  width: '100px',
                  height: '100px',
                }}
                data-testid={`topic-chest-${chest.topic.id}`}
                aria-label={chestStatus.isClaimed ? `Rương ${chest.topic.title}, đã mở` : chestStatus.canClaim ? `Rương ${chest.topic.title}, sẵn sàng mở` : `Rương ${chest.topic.title}, chưa đủ điều kiện`}
              >
                <div className="relative w-full h-full">
                  <span className="absolute inset-0 text-6xl transition-transform hover:scale-110" style={{ transformOrigin: 'center bottom' }}>
                    {chestStatus.isClaimed ? '🎁' : '🧰'}
                  </span>
                  {chestStatus.canClaim && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-black animate-bounce">
                      +
                    </div>
                  )}
                  {chestStatus.isClaimed && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-black">
                      ✓
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {/* Kid's Box Companion entry (English only) */}
          {subject === 'english' && onOpenKidBox && (
            <div
              className="absolute pointer-events-auto"
              style={{
                left: '50%',
                top: `${topics.length * VERTICAL_SPACING + PATH_PADDING - 80}px`,
                transform: 'translateX(-50%)',
                width: '90%',
                maxWidth: '400px',
              }}
            >
              <KidButton
                variant="subject-english"
                size="lg"
                fullWidth
                className="text-left justify-between p-5 md:p-6 min-h-[140px]"
                onClick={() => {
                  sound.playClick();
                  onOpenKidBox!();
                }}
              >
                <div className="flex items-center gap-4">
                  <span className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-3xl flex items-center justify-center text-3xl md:text-4xl border-4 border-emerald-200 shrink-0">
                    🐰
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[11px] font-black uppercase tracking-wider text-emerald-50">
                      British English · en-GB
                    </span>
                    <span className="block text-base md:text-lg font-black font-display">Kid's Box Companion</span>
                    <span className="block text-xs font-bold text-emerald-50 mt-0.5">
                      Unit hiện tại · Từ vựng · Nghe · Nói · Âm thanh · Trò chơi
                    </span>
                  </span>
                </div>
                <Play className="w-6 h-6 fill-white shrink-0" />
              </KidButton>
            </div>
          )}
        </div>
      </div>

      {/* Lesson Popup Modal */}
      {showLessonPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-pop"
          role="dialog"
          aria-modal="true"
          aria-label={showLessonPopup.title}
          ref={lessonPopupRef}
          tabIndex={-1}
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowLessonPopup(null);
          }}
        >
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-4 border-amber-300 p-6 animate-pop select-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-black text-slate-900 font-display">{showLessonPopup.title}</h3>
              <button
                onClick={() => { sound.playClick(); setShowLessonPopup(null); }}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-all active:scale-95"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-4">{showLessonPopup.description}</p>

            <div className="flex items-center gap-3 mb-4 p-3 bg-amber-50 rounded-2xl border border-amber-200">
              <span className="text-2xl">{subjectInfo.mascotEmoji}</span>
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-800">Số câu hỏi: <span className="font-black text-amber-600">{showLessonPopup.questions.length}</span></p>
                <p className="text-xs font-bold text-amber-800">Thưởng: <span className="font-black text-amber-600">+{showLessonPopup.starReward} Sao, +{showLessonPopup.xpReward} XP</span></p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <KidButton
                variant="secondary"
                size="md"
                onClick={() => handlePlayDescription(showLessonPopup)}
                leftIcon={<Volume2 className="w-4 h-4" />}
                className="flex-1"
              >
                Nghe mô tả
              </KidButton>
            </div>

            <KidButton
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => handleStartLesson(showLessonPopup)}
              leftIcon={<Play className="w-5 h-5 fill-white" />}
              className="min-h-[52px] text-lg"
            >
              Bắt đầu
            </KidButton>
          </div>
        </div>
      )}

      {/* Lesson Runner Modal */}
      {activeLesson && (
        <LessonPlayerModal
          lesson={activeLesson}
          onClose={() => {
            onProfileUpdate();
            setActiveLesson(null);
          }}
          onComplete={handleLessonComplete}
        />
      )}
    </div>
  );
};