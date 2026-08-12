import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { EmployeeAvatar } from './EmployeeAvatar';
import { profileService, SUPPORTED_AVATAR_STYLES } from '../services/profileService';
import { Shuffle, Check, Sparkles, RefreshCw, User, UserCheck } from 'lucide-react';

export const AvatarPicker = ({
  isOpen,
  onClose,
  currentStyle = 'bottts',
  currentSeed = '',
  onSave
}) => {
  const [selectedStyle, setSelectedStyle] = useState(currentStyle || 'bottts');
  const [selectedSeed, setSelectedSeed] = useState(currentSeed || '');
  const [seedInput, setSeedInput] = useState('');
  const [genderFilter, setGenderFilter] = useState('all'); // 'all', 'male', 'female'
  const [isSaving, setIsSaving] = useState(false);

  // Sync props when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialStyle = currentStyle || 'bottts';
      const initialSeed = currentSeed || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `emp-${Date.now()}`);
      
      // Auto-detect gender preference if seed starts with male_ or female_
      if (initialSeed.startsWith('male_')) {
        setGenderFilter('male');
      } else if (initialSeed.startsWith('female_')) {
        setGenderFilter('female');
      } else {
        setGenderFilter('all');
      }

      setSelectedStyle(initialStyle);
      setSelectedSeed(initialSeed);
      setSeedInput(initialSeed);
    }
  }, [isOpen, currentStyle, currentSeed]);

  const generateRandomSeed = (overrideGender) => {
    const activeGender = overrideGender !== undefined ? overrideGender : genderFilter;
    const randomSuffix = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID().substring(0, 8) 
      : Math.random().toString(36).substring(2, 10);
    
    let prefix = 'user_';
    if (activeGender === 'male') {
      const maleNames = ['alex', 'david', 'james', 'michael', 'daniel', 'robert', 'john', 'ryan'];
      const pickName = maleNames[Math.floor(Math.random() * maleNames.length)];
      prefix = `male_${pickName}_`;
    } else if (activeGender === 'female') {
      const femaleNames = ['emma', 'sarah', 'sophia', 'olivia', 'emily', 'jessica', 'hannah', 'chloe'];
      const pickName = femaleNames[Math.floor(Math.random() * femaleNames.length)];
      prefix = `female_${pickName}_`;
    }

    const newSeed = `${prefix}${randomSuffix}`;
    setSelectedSeed(newSeed);
    setSeedInput(newSeed);
  };

  const handleGenderChange = (newGender) => {
    setGenderFilter(newGender);
    generateRandomSeed(newGender);
  };

  const handleSeedInputChange = (e) => {
    const val = e.target.value;
    setSeedInput(val);
    if (val.trim()) {
      setSelectedSeed(val.trim());
    }
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave({ avatarStyle: selectedStyle, avatarSeed: selectedSeed });
      }
      onClose();
    } catch (err) {
      console.error('AvatarPicker save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customize Illustrated Avatar"
      description="Select style, gender preference, and shuffle variations for a permanent profile avatar."
    >
      <div className="space-y-5 pt-1">
        {/* Gender Preference Option */}
        <div>
          <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1.5">
            1. Gender &amp; Style Preference
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleGenderChange('all')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                genderFilter === 'all'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-transparent hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> All Styles
            </button>
            <button
              type="button"
              onClick={() => handleGenderChange('male')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                genderFilter === 'male'
                  ? 'bg-blue-600 text-white border-transparent shadow'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-transparent hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              👨 Male Avatar
            </button>
            <button
              type="button"
              onClick={() => handleGenderChange('female')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                genderFilter === 'female'
                  ? 'bg-rose-600 text-white border-transparent shadow'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-transparent hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              👩 Female Avatar
            </button>
          </div>
        </div>

        {/* Step 2: Style Selector */}
        <div>
          <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1.5">
            2. Choose Vector Style
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
            {SUPPORTED_AVATAR_STYLES.map((st) => {
              const isSelected = selectedStyle === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStyle(st.id)}
                  className={`
                    flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center group
                    ${isSelected
                      ? 'border-neutral-900 dark:border-white bg-neutral-100/90 dark:bg-neutral-800 shadow-sm ring-2 ring-neutral-900/10 dark:ring-white/20'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-card'
                    }
                  `}
                >
                  <EmployeeAvatar
                    style={st.id}
                    seed={selectedSeed}
                    size={42}
                    className="mb-1"
                  />
                  <span className="text-[10px] font-semibold text-neutral-900 dark:text-white leading-tight truncate w-full">
                    {st.name}
                  </span>
                  <span className="text-[9px] text-neutral-400 truncate w-full">
                    {st.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Seed & Variation Control */}
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative shrink-0">
              <EmployeeAvatar
                style={selectedStyle}
                seed={selectedSeed}
                size={96}
                className="shadow-lg border-2 border-white dark:border-neutral-800"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex-1 w-full space-y-3 text-center sm:text-left">
              <div>
                <span className="text-xs font-semibold text-neutral-900 dark:text-white block">
                  3. Shuffle Variations ({genderFilter.toUpperCase()})
                </span>
                <p className="text-[11px] text-neutral-500">
                  Click shuffle to cycle through random {genderFilter === 'all' ? '' : genderFilter} character designs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => generateRandomSeed()}
                  className="text-xs shrink-0 font-medium"
                >
                  <Shuffle className="w-3.5 h-3.5 text-neutral-500" /> Shuffle
                </Button>

                <input
                  type="text"
                  value={seedInput}
                  onChange={handleSeedInputChange}
                  placeholder="Custom seed..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirmSave}
            disabled={isSaving}
            className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 min-w-[100px]"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Check className="w-3.5 h-3.5 mr-1" /> Save Avatar
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
