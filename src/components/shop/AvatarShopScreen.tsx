import React, { useState } from 'react';
import { AvatarItem, ChildProfile } from '../../types';
import { AVATAR_SHOP_ITEMS, StorageService } from '../../services/storage';
import { sound } from '../../services/sound';
import { fireCelebrationConfetti } from '../../services/confetti';
import { ArrowLeft, Star, ShoppingBag, Check } from 'lucide-react';

interface AvatarShopScreenProps {
  onBack: () => void;
  onProfileUpdate: () => void;
}

export const AvatarShopScreen: React.FC<AvatarShopScreenProps> = ({
  onBack,
  onProfileUpdate,
}) => {
  const [profile, setProfile] = useState<ChildProfile>(StorageService.getChildProfile());
  const [activeTab, setActiveTab] = useState<'mascot' | 'hat' | 'glasses' | 'backpack' | 'pet'>('mascot');

  const MASCOTS = [
    { id: 'bear', name: 'Gấu Bút Chì', emoji: '🐻', desc: 'Chăm chỉ & Thân thiện' },
    { id: 'fox', name: 'Cáo Toán Học', emoji: '🦊', desc: 'Thông minh & Tinh anh' },
    { id: 'rabbit', name: 'Thỏ English', emoji: '🐰', desc: 'Nhanh nhẹn & Đáng yêu' },
    { id: 'owl', name: 'Cú Thông Thái', emoji: '🦉', desc: 'Uyên bác & Điềm đạm' },
  ];

  const handleSelectMascot = (mId: 'bear' | 'fox' | 'rabbit' | 'owl') => {
    sound.playClick();
    const fresh = StorageService.getChildProfile();
    const updated = { ...fresh, avatarBase: mId };
    setProfile(updated);
    StorageService.saveChildProfile(updated);
    onProfileUpdate();
    sound.speak(`Bé đã chọn bạn ${MASCOTS.find((m) => m.id === mId)?.name}!`);
  };

  const handleBuyOrEquip = (item: AvatarItem) => {
    const fresh = StorageService.getChildProfile();
    const isUnlocked = fresh.unlockedItems.includes(item.id);

    if (isUnlocked) {
      // Toggle equip
      sound.playClick();
      const currentEquipped = fresh.equipped[item.type];
      const newEquipped = currentEquipped === item.id ? undefined : item.id;
      const updated: ChildProfile = {
        ...fresh,
        equipped: {
          ...fresh.equipped,
          [item.type]: newEquipped,
        },
      };
      setProfile(updated);
      StorageService.saveChildProfile(updated);
      onProfileUpdate();
    } else {
      // Buy with stars
      if (fresh.stars >= item.priceStars) {
        sound.playLevelUp();
        fireCelebrationConfetti();
        const updated: ChildProfile = {
          ...fresh,
          stars: fresh.stars - item.priceStars,
          unlockedItems: [...fresh.unlockedItems, item.id],
          equipped: {
            ...fresh.equipped,
            [item.type]: item.id,
          },
        };
        setProfile(updated);
        StorageService.saveChildProfile(updated);
        onProfileUpdate();
        sound.speak(`Chúc mừng bé đã mở khóa ${item.name}!`);
      } else {
        sound.playWrong();
        sound.speak('Bé chưa đủ sao vàng, hãy học thêm bài để tích lũy sao nhé!');
      }
    }
  };

  const filteredItems = AVATAR_SHOP_ITEMS.filter((i) => i.type === activeTab);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6 select-none">
      {/* Top Bar with back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="flex items-center gap-1.5 px-4 min-h-[44px] py-2 bg-white hover:bg-amber-50 border-2 border-amber-300 rounded-2xl font-bold text-xs md:text-sm text-amber-950 transition-all active:scale-95 shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Trang Chủ</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 rounded-full border border-amber-300">
          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
          <span className="text-xs font-black text-amber-950">
            Số sao của bé: {profile.stars}
          </span>
        </div>
      </div>

      {/* Avatar Dressing Stage & Preview */}
      <div className="bg-gradient-to-r from-amber-400 via-orange-300 to-amber-500 rounded-3xl p-6 md:p-8 text-white shadow-xl border-4 border-amber-200 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          {/* Avatar Composite Preview */}
          <div className="relative w-28 h-28 md:w-32 md:h-32 bg-white rounded-3xl shadow-xl border-4 border-amber-200 flex items-center justify-center text-6xl md:text-7xl">
            {profile.avatarBase === 'bear' ? '🐻' : profile.avatarBase === 'fox' ? '🦊' : profile.avatarBase === 'rabbit' ? '🐰' : '🦉'}

            {/* Hat */}
            {profile.equipped.hat && (
              <span className="absolute -top-3 text-3xl">
                {AVATAR_SHOP_ITEMS.find((i) => i.id === profile.equipped.hat)?.emoji}
              </span>
            )}
            {/* Glasses */}
            {profile.equipped.glasses && (
              <span className="absolute top-8 text-2xl">
                {AVATAR_SHOP_ITEMS.find((i) => i.id === profile.equipped.glasses)?.emoji}
              </span>
            )}
            {/* Backpack */}
            {profile.equipped.backpack && (
              <span className="absolute -bottom-2 -left-2 text-2xl">
                {AVATAR_SHOP_ITEMS.find((i) => i.id === profile.equipped.backpack)?.emoji}
              </span>
            )}
            {/* Pet */}
            {profile.equipped.pet && (
              <span className="absolute -bottom-2 -right-2 text-2xl animate-bounce">
                {AVATAR_SHOP_ITEMS.find((i) => i.id === profile.equipped.pet)?.emoji}
              </span>
            )}
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-950/70">
              Nhân Vật Đại Diện
            </span>
            <h1 className="text-2xl md:text-3xl font-black font-display text-amber-950 mt-0.5">
              Phòng Thay Đồ & Linh Thú
            </h1>
            <p className="text-xs md:text-sm text-amber-900 font-bold mt-1 max-w-sm">
              Trang bị mũ xinh, kính ngầu và linh thú đồng hành cùng số sao tích lũy được!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-4 py-2 bg-white/20 rounded-2xl text-xs font-black text-amber-950 backdrop-blur-xs">
          <span>✨ 100% Hoàn Toàn Miễn Phí</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'mascot', label: 'Chọn Bạn Mascot', icon: '🦊' },
          { id: 'hat', label: 'Mũ & Nón', icon: '🧢' },
          { id: 'glasses', label: 'Kính Mắt', icon: '👓' },
          { id: 'backpack', label: 'Ba Lô', icon: '🎒' },
          { id: 'pet', label: 'Thú Cưng', icon: '🐱' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              sound.playClick();
              setActiveTab(tab.id as typeof activeTab);
            }}
            className={`px-4 min-h-[44px] py-2 rounded-2xl text-xs md:text-sm font-black flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
              activeTab === tab.id
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white hover:bg-amber-50 text-slate-700 border border-slate-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="bg-white rounded-3xl p-6 shadow-md border-3 border-amber-200">
        {activeTab === 'mascot' ? (
          // Mascot choices
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {MASCOTS.map((m) => {
              const isSelected = profile.avatarBase === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleSelectMascot(m.id as typeof profile.avatarBase)}
                  className={`p-5 rounded-3xl border-3 flex flex-col items-center text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50 border-amber-500 shadow-md scale-102'
                      : 'bg-white border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <span className="text-6xl mb-2 animate-pulse-subtle">{m.emoji}</span>
                  <h3 className="text-base font-black text-slate-900 font-display">{m.name}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">{m.desc}</p>
                  <span
                    className={`mt-3 px-3 py-1 rounded-xl text-xs font-black ${
                      isSelected
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isSelected ? 'Đang chọn ✓' : 'Chọn bạn này'}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          // Clothing / Accessories Items
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isUnlocked = profile.unlockedItems.includes(item.id);
              const isEquipped = profile.equipped[item.type] === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all ${
                    isEquipped
                      ? 'bg-amber-50 border-amber-500 shadow-sm'
                      : isUnlocked
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-4xl p-2 bg-white rounded-xl shadow-xs border border-amber-100">
                      {item.emoji}
                    </span>
                    <div>
                      <h4 className="text-xs md:text-sm font-black text-slate-900 font-display">
                        {item.name}
                      </h4>
                      <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1 mt-0.5">
                        {isUnlocked ? (
                          <span className="text-emerald-700 font-black">Đã sở hữu</span>
                        ) : (
                          <>
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>{item.priceStars} Sao</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuyOrEquip(item)}
                    className={`px-4 min-h-[44px] py-1.5 rounded-xl font-black text-xs transition-all active:scale-95 cursor-pointer flex items-center ${
                      isEquipped
                        ? 'bg-emerald-600 text-white'
                        : isUnlocked
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : profile.stars >= item.priceStars
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isEquipped ? 'Tháo ra' : isUnlocked ? 'Mặc vào' : 'Mở khóa'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
