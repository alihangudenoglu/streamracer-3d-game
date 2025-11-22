
export interface Player {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string;
  progress: number; // 0.0 to 1.0 (Normalized for UI)
  distance: number; // Actual distance traveled in World Units
  velocity: number; // Current speed
  laneOffset: number; // X-axis offset on the track
  finished: boolean;
  finishTime?: number;
}

export enum GameState {
  LOBBY = 'LOBBY',
  RACING = 'RACING',
  FINISHED = 'FINISHED'
}

export interface CommentaryState {
  text: string;
  isLoading: boolean;
}
