'use client';

import { useState } from 'react';
import { Character, CHARACTER_OPTIONS, CharacterSelection as CharacterSelectionType } from '@/utils/characterOptions';

interface CharacterSelectionProps {
  onSelectionComplete: (selection: CharacterSelectionType) => void;
}

export default function CharacterSelection({ onSelectionComplete }: CharacterSelectionProps) {
  const [playerCharacter, setPlayerCharacter] = useState<Character | null>(null);
  const [computerCharacter, setComputerCharacter] = useState<Character | null>(null);

  const handleCharacterSelect = (character: Character, type: 'player' | 'computer') => {
    if (type === 'player') {
      setPlayerCharacter(character);
    } else {
      setComputerCharacter(character);
    }
  };

  const handleStartGame = () => {
    if (playerCharacter && computerCharacter) {
      onSelectionComplete({
        player: playerCharacter,
        computer: computerCharacter,
      });
    }
  };

  const canStartGame = playerCharacter && computerCharacter;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-green-400 p-4 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
          Choose Your Characters
        </h1>

        {/* Player Selection */}
        <div className="mb-8 w-full">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            Your Character {playerCharacter && `(${playerCharacter.displayName})`}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {CHARACTER_OPTIONS.map((character) => (
              <button
                key={`player-${character.id}`}
                onClick={() => handleCharacterSelect(character, 'player')}
                className={`aspect-square rounded-lg border-4 transition-all duration-200 ${
                  playerCharacter?.id === character.id
                    ? 'border-yellow-400 bg-yellow-100'
                    : 'border-white/30 bg-white/20 hover:border-white/60'
                }`}
              >
                <div className="w-full h-full flex flex-col items-center justify-center p-2">
                  <img
                    src={character.spriteBodyUrl}
                    alt={character.displayName}
                    className="w-12 h-12 md:w-16 md:h-16 object-contain mb-2"
                  />
                  <span className="text-white text-xs md:text-sm font-medium text-center">
                    {character.displayName}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Computer Selection */}
        <div className="mb-8 w-full">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            Computer Character {computerCharacter && `(${computerCharacter.displayName})`}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {CHARACTER_OPTIONS.map((character) => (
              <button
                key={`computer-${character.id}`}
                onClick={() => handleCharacterSelect(character, 'computer')}
                className={`aspect-square rounded-lg border-4 transition-all duration-200 ${
                  computerCharacter?.id === character.id
                    ? 'border-red-400 bg-red-100'
                    : 'border-white/30 bg-white/20 hover:border-white/60'
                }`}
              >
                <div className="w-full h-full flex flex-col items-center justify-center p-2">
                  <img
                    src={character.spriteBodyUrl}
                    alt={character.displayName}
                    className="w-12 h-12 md:w-16 md:h-16 object-contain mb-2"
                  />
                  <span className="text-white text-xs md:text-sm font-medium text-center">
                    {character.displayName}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Start Game Button */}
        <button
          onClick={handleStartGame}
          disabled={!canStartGame}
          className={`px-8 py-4 text-xl font-bold rounded-lg transition-all duration-200 ${
            canStartGame
              ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-400 text-gray-600 cursor-not-allowed'
          }`}
        >
          Start Game
        </button>
      </div>
    </div>
  );
}