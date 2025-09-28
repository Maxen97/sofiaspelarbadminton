'use client';

import { useState } from 'react';
import BadmintonGame from '@/components/BadmintonGame';
import OrientationOverlay from '@/components/OrientationOverlay';
import CharacterSelection from '@/components/CharacterSelection';
import { CharacterSelection as CharacterSelectionType } from '@/utils/characterOptions';

export default function GamePage() {
  const [characterSelection, setCharacterSelection] = useState<CharacterSelectionType | null>(null);

  const handleCharacterSelection = (selection: CharacterSelectionType) => {
    setCharacterSelection(selection);
  };

  if (!characterSelection) {
    return <CharacterSelection onSelectionComplete={handleCharacterSelection} />;
  }

  return (
    <div className="w-full h-screen overflow-hidden">
      <BadmintonGame characterSelection={characterSelection} />
      <OrientationOverlay />
    </div>
  );
}