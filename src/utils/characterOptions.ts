export interface Character {
  id: string;
  displayName: string;
  spriteBodyUrl: string;
  spriteHeadUrl?: string; // For future use
}

export const CHARACTER_OPTIONS: Character[] = [
  {
    id: 'sofia',
    displayName: 'Sofia',
    spriteBodyUrl: '/sprites/players/bodies/sofia.png',
    spriteHeadUrl: '/sprites/players/heads/sofia.png',
  },
  {
    id: 'max',
    displayName: 'Max',
    spriteBodyUrl: '/sprites/players/bodies/max.png',
    spriteHeadUrl: '/sprites/players/heads/max.png',
  },
  {
    id: 'ani',
    displayName: 'Ani',
    spriteBodyUrl: '/sprites/players/bodies/ani.png',
    spriteHeadUrl: '/sprites/players/heads/ani.png',
  },
  {
    id: 'abhijit',
    displayName: 'Abhijit',
    spriteBodyUrl: '/sprites/players/bodies/abhijit.png',
    spriteHeadUrl: '/sprites/players/heads/abhijit.png',
  },
  {
    id: 'claudia',
    displayName: 'Claudia',
    spriteBodyUrl: '/sprites/players/bodies/claudia.png',
    spriteHeadUrl: '/sprites/players/heads/claudia.png',
  },
  {
    id: 'alina',
    displayName: 'Alina',
    spriteBodyUrl: '/sprites/players/bodies/alina.png',
    spriteHeadUrl: '/sprites/players/heads/alina.png',
  },
];

export interface CharacterSelection {
  player: Character;
  computer: Character;
}