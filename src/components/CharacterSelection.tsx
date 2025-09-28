'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Character, CHARACTER_OPTIONS, CharacterSelection as CharacterSelectionType } from '@/utils/characterOptions';

interface CharacterSelectProps {
  placeholder: string;
  selectedCharacter: Character | null;
  onSelect: (character: Character) => void;
  accentColor: 'yellow' | 'red';
}

function CharacterSelect({ placeholder, selectedCharacter, onSelect, accentColor }: CharacterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const accentColors = {
    yellow: {
      button: 'border-yellow-400 bg-yellow-50',
      buttonHover: 'hover:border-yellow-500',
      dropdown: 'border-yellow-200',
      option: 'hover:bg-yellow-50',
      optionSelected: 'bg-yellow-100',
    },
    red: {
      button: 'border-red-400 bg-red-50',
      buttonHover: 'hover:border-red-500',
      dropdown: 'border-red-200',
      option: 'hover:bg-red-50',
      optionSelected: 'bg-red-100',
    },
  };

  const colors = accentColors[accentColor];

  return (
    <div className="relative w-full max-w-[10rem] mx-auto" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full aspect-square p-2 bg-white border-2 rounded-lg shadow-sm transition-all duration-200 ${
          selectedCharacter ? colors.button : 'border-gray-300 hover:border-gray-400'
        } ${colors.buttonHover} focus:outline-none relative`}
      >
        {selectedCharacter ? (
          <div className="flex flex-col items-center justify-center h-full">
            <img
              src={selectedCharacter.spriteBodyUrl}
              alt={selectedCharacter.displayName}
              className="w-12 h-12 object-contain mb-1"
            />
            <span className="font-medium text-gray-900 text-xs text-center leading-tight">{selectedCharacter.displayName}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 bg-gray-200 rounded-lg mb-1 flex items-center justify-center">
              <span className="text-gray-400 text-lg">?</span>
            </div>
            <span className="text-gray-500 text-xs text-center leading-tight">{placeholder}</span>
          </div>
        )}
      </button>

      {isOpen && (
        <div className={`absolute z-30 w-80 top-0 left-1/2 transform -translate-x-1/2 bg-white border-2 ${colors.dropdown} rounded-lg shadow-xl p-3 transition-all duration-200 animate-in fade-in-0 zoom-in-95`}>
          <div className="grid grid-cols-3 gap-2">
            {CHARACTER_OPTIONS.map((character) => (
              <button
                key={character.id}
                type="button"
                onClick={() => {
                  onSelect(character);
                  setIsOpen(false);
                }}
                className={`aspect-square p-2 rounded-lg transition-colors duration-150 border-2 ${
                  selectedCharacter?.id === character.id
                    ? `${colors.optionSelected} ${colors.button.split(' ')[0]}`
                    : `${colors.option} border-transparent hover:border-gray-200`
                }`}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <img
                    src={character.spriteBodyUrl}
                    alt={character.displayName}
                    className="w-12 h-12 object-contain mb-1"
                  />
                  <span className="font-medium text-gray-900 text-xs text-center leading-tight">{character.displayName}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface CharacterSelectionProps {
  onSelectionComplete: (selection: CharacterSelectionType) => void;
}

export default function CharacterSelection({ onSelectionComplete }: CharacterSelectionProps) {
  const [playerCharacter, setPlayerCharacter] = useState<Character | null>(null);
  const [computerCharacter, setComputerCharacter] = useState<Character | null>(null);

  // Set default selections on component mount
  useEffect(() => {
    // Default player to first male character (male_1)
    const defaultPlayer = CHARACTER_OPTIONS.find(char => char.id === 'male_1') || CHARACTER_OPTIONS[0];
    setPlayerCharacter(defaultPlayer);

    // Random computer character
    const randomIndex = Math.floor(Math.random() * CHARACTER_OPTIONS.length);
    setComputerCharacter(CHARACTER_OPTIONS[randomIndex]);
  }, []);

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
    <div className="h-screen bg-gradient-to-b from-blue-400 to-green-400 p-4 flex flex-col overflow-hidden">
      {/* Back Arrow */}
      <Link
        href="/"
        className="absolute top-4 left-4 z-40 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Link>

      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full space-y-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white text-center">
          Välj Spelare
        </h1>

        {/* Character Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-xl">
          {/* Player Selection */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white text-center">
              Du
            </h2>
            <CharacterSelect
              placeholder="Select your character"
              selectedCharacter={playerCharacter}
              onSelect={setPlayerCharacter}
              accentColor="yellow"
            />
          </div>

          {/* Computer Selection */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white text-center">
              Motståndare
            </h2>
            <CharacterSelect
              placeholder="Select computer character"
              selectedCharacter={computerCharacter}
              onSelect={setComputerCharacter}
              accentColor="red"
            />
          </div>
        </div>

        {/* Start Game Button */}
        <button
          onClick={handleStartGame}
          disabled={!canStartGame}
          className={`px-6 py-3 text-lg font-bold rounded-lg transition-all duration-200 ${
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