import React, { useState, useEffect } from 'react';
import { Cloud, CheckCircle2, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import { CloudSyncService, type CloudSyncState } from '../../services/cloudSync';
import { AccountModal } from './AccountModal';
import { sound } from '../../services/sound';
import type { ChildProfile } from '../../types';

interface CloudSyncBannerProps {
  profile: ChildProfile;
}

export const CloudSyncBanner: React.FC<CloudSyncBannerProps> = ({ profile }) => {
  const [syncState, setSyncState] = useState<CloudSyncState>(CloudSyncService.getState());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsub = CloudSyncService.subscribe((state) => {
      setSyncState(state);
    });
    return () => unsub();
  }, []);

  const handleOpenModal = () => {
    sound.playClick?.();
    setIsModalOpen(true);
  };

  const handleDirectSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick?.();
    setIsSyncing(true);
    try {
      await CloudSyncService.syncNow();
      sound.playCorrect?.();
    } catch {
      // Handled inside service
    } finally {
      setIsSyncing(false);
    }
  };

  const isUserLoggedIn = !!syncState.user;

  return (
    <>
      <div
        onClick={handleOpenModal}
        className={`w-full p-3.5 sm:p-4 rounded-3xl border-2 transition-all cursor-pointer shadow-xs ${
          isUserLoggedIn
            ? 'bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-emerald-100/70 border-emerald-300 hover:border-emerald-400'
            : 'bg-gradient-to-r from-amber-50 via-orange-50/80 to-yellow-50 border-amber-300 hover:border-amber-400 hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          {/* Left info */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl shadow-xs border ${
                isUserLoggedIn
                  ? 'bg-emerald-100 border-emerald-300'
                  : 'bg-amber-100 border-amber-300'
              }`}
            >
              {isUserLoggedIn ? '☁️' : '🔐'}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-slate-900 font-display">
                  {isUserLoggedIn
                    ? `Đã liên kết Google: ${syncState.user?.displayName || 'Học viên'}`
                    : 'Lưu Kết Quả & Điểm Số Lên Google'}
                </h3>
                {isUserLoggedIn && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã bảo vệ
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                {isUserLoggedIn
                  ? `Dữ liệu sao ⭐, XP ✨ và bài học được lưu an toàn tại ${syncState.user?.email}`
                  : 'Đăng nhập Google để lưu trữ vĩnh viễn tiến độ học của bé khi đổi máy'}
              </p>
            </div>
          </div>

          {/* Right Action Button */}
          <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto justify-end">
            {isUserLoggedIn ? (
              <button
                onClick={handleDirectSync}
                disabled={isSyncing || syncState.status === 'syncing'}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isSyncing || syncState.status === 'syncing' ? 'animate-spin' : ''}`}
                />
                <span>Đồng bộ ngay</span>
              </button>
            ) : (
              <button
                onClick={handleOpenModal}
                className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-amber-50 active:scale-95 border-2 border-amber-400 hover:border-amber-500 text-amber-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                {/* Google Icon */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Đăng nhập Google</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <AccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        syncState={syncState}
        profile={profile}
      />
    </>
  );
};
