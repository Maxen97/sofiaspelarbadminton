'use client';

import { useState, useEffect } from 'react';
import BadmintonGame from '@/components/BadmintonGame';
import OrientationOverlay from '@/components/OrientationOverlay';
import LoadingScreen from '@/components/LoadingScreen';
import CharacterSelection from '@/components/CharacterSelection';
import { CharacterSelection as CharacterSelectionType } from '@/utils/characterOptions';

export default function GamePage() {
  const [characterSelection, setCharacterSelection] = useState<CharacterSelectionType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldRenderGame, setShouldRenderGame] = useState(false);

  const handleCharacterSelection = (selection: CharacterSelectionType) => {
    setCharacterSelection(selection);
    setIsLoading(true);
  };

  const handleGameReady = () => {
    setIsLoading(false);
  };

  // Delay game rendering to ensure loading screen paints first
  useEffect(() => {
    if (characterSelection && !shouldRenderGame) {
      // Use requestAnimationFrame to delay until after paint
      requestAnimationFrame(() => {
        setShouldRenderGame(true);
      });
    }
  }, [characterSelection, shouldRenderGame]);

  if (!characterSelection) {
    return <CharacterSelection onSelectionComplete={handleCharacterSelection} />;
  }

  return (
    <div className="w-full h-screen overflow-hidden">
      {shouldRenderGame && (
        <BadmintonGame characterSelection={characterSelection} onGameReady={handleGameReady} />
      )}
      <OrientationOverlay />
      <LoadingScreen isVisible={isLoading} />
    </div>
  );
}