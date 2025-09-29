export interface Character {
  id: string;
  displayName: string;
  spriteBodyUrl: string;
  spriteHeadUrl?: string; // For future use
}

export const CHARACTER_OPTIONS: Character[] = [
  {
    id: 'male_1',
    displayName: 'Male 1',
    spriteBodyUrl: '/sprites/players/bodies/male_1.png',
  },
  {
    id: 'male_2',
    displayName: 'Male 2',
    spriteBodyUrl: '/sprites/players/bodies/male_2.png',
  },
  {
    id: 'female_1',
    displayName: 'Female 1',
    spriteBodyUrl: '/sprites/players/bodies/female_1.png',
  },
  {
    id: 'female_2',
    displayName: 'Female 2',
    spriteBodyUrl: '/sprites/players/bodies/female_2.png',
  },
  {
    id: 'female_3',
    displayName: 'Female 3',
    spriteBodyUrl: '/sprites/players/bodies/female_3.png',
  },
  {
    id: 'sofia',
    displayName: 'Sofia',
    spriteBodyUrl: '/sprites/players/bodies/female_1.png',
    spriteHeadUrl: '/sprites/players/heads/sofia.png',
  },
];

export interface CharacterSelection {
  player: Character;
  computer: Character;
}