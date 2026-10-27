import React, { useState } from 'react';
import { X, Cloud, CloudCheck, RefreshCw, LogOut, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { KidButton } from '../ui';
import { signInWithGoogle, logOut } from '../../services/firebase';
import { CloudSyncService, type CloudSyncState } from '../../services/cloudSync';
import { sound } from '../../services/sound';
import type { ChildProfile } from '../../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncState: CloudSyncState;
  profile: ChildProfile;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  syncState,
  profile,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    sound.playClick();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      setSuccessNotice('Đăng nhập Google thành công! Tiến độ học tập đã được lưu.');
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng nhập không thành công';
      if (!msg.includes('popup-closed-by-user')) {
        setErrorMsg('Không thể đăng nhập Google. Vui lòng kiểm tra kết nối mạng và thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    sound.playClick();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await CloudSyncService.syncNow();
      sound.playCorrect();
      setSuccessNotice('Đã đồng bộ toàn bộ tiến độ lên đám mây thành công!');
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi đồng bộ';
      setErrorMsg('Đồng bộ thất bại: ' + msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    sound.playClick();
    setIsLoading(true);
    try {
      await logOut();
      setSuccessNotice('Đã đăng xuất tài khoản Google.');
      setTimeout(() => {
        setSuccessNotice(null);
        onClose();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi đăng xuất';
      setErrorMsg('Không thể đăng xuất: ' + msg);
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastSynced = (date: Date | null) => {
    if (!date) return 'Chưa đồng bộ';
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      ' ngày ' +
      date.toLocaleDateString('vi-VN');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-4 border-amber-300 p-5 sm:p-6 relative flex flex-col gap-4 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          aria-label="Đóng bảng tài khoản"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl shrink-0 shadow-xs">
            ☁️
          </div>
          <div>
            <h2 id="account-modal-title" className="text-xl font-black text-amber-950 font-display">
              {syncState.user ? 'Tài Khoản & Đồng Bộ' : 'Lưu Lịch Sử Học Tập'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {syncState.user
                ? 'Dữ liệu được lưu trữ an toàn trên Google Cloud'
                : 'Đăng nhập Google để không lo mất điểm số của bé'}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successNotice && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span className="font-semibold">{successNotice}</span>
          </div>
        )}

        {/* Content based on Auth State */}
        {syncState.user ? (
          /* LOGGED IN VIEW */
          <div className="flex flex-col gap-4">
            {/* User Info Card */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center gap-3.5">
              {syncState.user.photoURL ? (
                <img
                  src={syncState.user.photoURL}
                  alt={syncState.user.displayName || 'Avatar'}
                  className="w-13 h-13 rounded-full border-2 border-amber-400 object-cover shrink-0 shadow-xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-13 h-13 rounded-full bg-amber-200 border-2 border-amber-400 flex items-center justify-center text-xl font-black text-amber-800 shrink-0">
                  {syncState.user.displayName?.charAt(0) || 'B'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-slate-900 truncate text-base">
                    {syncState.user.displayName || profile.name}
                  </span>
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Google
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5 font-mono">
                  {syncState.user.email}
                </p>
              </div>
            </div>

            {/* Sync Status Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-sky-500" /> Trạng thái đám mây:
                </span>
                <span className="font-extrabold text-emerald-700 flex items-center gap-1">
                  {syncState.status === 'syncing' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" /> Đang đồng bộ...
                    </>
                  ) : syncState.status === 'error' ? (
                    <span className="text-rose-600 font-bold">Lỗi đồng bộ</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã đồng bộ an toàn
                    </>
                  )}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-2">
                <span>Lần đồng bộ gần nhất:</span>
                <span className="font-semibold text-slate-700 font-mono">
                  {formatLastSynced(syncState.lastSyncedAt)}
                </span>
              </div>
            </div>

            {/* Synced Stats preview */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-base">⭐</span>
                <p className="text-sm font-black text-amber-900 mt-0.5">{profile.stars}</p>
                <p className="text-[10px] text-amber-700 font-semibold">Ngôi sao</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-orange-50 border border-orange-200">
                <span className="text-base">🔥</span>
                <p className="text-sm font-black text-orange-900 mt-0.5">{profile.streak}</p>
                <p className="text-[10px] text-orange-700 font-semibold">Ngày streak</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-purple-50 border border-purple-200">
                <span className="text-base">✨</span>
                <p className="text-sm font-black text-purple-900 mt-0.5">{profile.xp}</p>
                <p className="text-[10px] text-purple-700 font-semibold">Điểm XP</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <KidButton
                variant="primary"
                className="flex-1 min-h-[44px]"
                onClick={handleManualSync}
                disabled={isLoading || syncState.status === 'syncing'}
                leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
              >
                Đồng bộ ngay
              </KidButton>

              <button
                onClick={handleSignOut}
                disabled={isLoading}
                aria-label="Đăng xuất Google"
                className="min-h-[44px] px-3.5 rounded-2xl border-2 border-slate-200 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 text-slate-600 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        ) : (
          /* NOT LOGGED IN VIEW */
          <div className="flex flex-col gap-4">
            {/* Value prop list */}
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 flex flex-col gap-2.5 text-xs sm:text-sm text-sky-950">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <span><strong>Bảo vệ tiến độ học:</strong> Toàn bộ điểm số, sao, huy hiệu và bài học được lưu vĩnh viễn trên mây.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Cloud className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <span><strong>Học trên nhiều thiết bị:</strong> Đổi điện thoại hay máy tính bảng, bé vẫn giữ nguyên kết quả học tập.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Miễn phí & An toàn:</strong> Dành riêng cho học sinh tiểu học, không quảng cáo, bảo mật chuẩn Firebase.</span>
              </div>
            </div>

            {/* Google Sign In Action */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full min-h-[48px] px-4 rounded-2xl bg-white border-2 border-slate-300 hover:border-amber-400 hover:bg-amber-50/40 active:scale-[0.98] flex items-center justify-center gap-3 font-extrabold text-sm sm:text-base text-slate-800 shadow-md transition-all cursor-pointer"
              >
                {/* Official Google SVG Logo */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span>{isLoading ? 'Đang kết nối Google...' : 'Đăng nhập bằng Google'}</span>
              </button>

              <p className="text-[11px] text-center text-slate-400">
                Nếu không đăng nhập, kết quả học vẫn được lưu tạm thời trên máy này.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
