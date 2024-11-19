import { Character } from './player';

export interface RandomNicknameResponse {
  nickName: string;
}
export enum GameScreen {
  LOADING = 'loading',
  LOGIN = 'login',
  HOME = 'home',
  MATCHING = 'matching',
  GAME = 'game',
}

export interface RoomInfo {
  playerCnt: number;
}

export interface GameData {
  remainRunningTime: number;
  characters: Character[];
}
