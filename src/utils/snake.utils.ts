import Coord from '../Coord'
import { Move } from '../types/battlesnake'

/**
 * Converts a Move ('up' | 'down' | 'left' | 'right') into a Coord
 * based on the given starting coordinate.
 * @param coord The current location of the snake.
 * @param direction The direction to move in.
 * @return A coordinate.
 */
export const moveToCoord = (coord: Coord, direction: Move): Coord => {
	switch (direction) {
		case 'up':
			return new Coord(coord.x, coord.y - 1)
		case 'down':
			return new Coord(coord.x, coord.y + 1)
		case 'left':
			return new Coord(coord.x - 1, coord.y)
		case 'right':
			return new Coord(coord.x + 1, coord.y)
		default:
			return coord
	}
}

/**
 * Takes a start and end coordinate, and determines the Move used
 * to get there.
 * @param from Starting Coord.
 * @param to Ending Coord.
 * @return The direction to move ('up' | 'down' | 'left' | 'right')
 */
export const coordToMove = (from: Coord, to: Coord): Move | null => {
	if (to.x > from.x) return 'right'
	else if (to.x < from.x) return 'left'
	else if (to.y > from.y) return 'down'
	else if (to.y  < from.y) return 'up'
	else return null
}

export const randInt = (min: number, max: number) => {
	return Math.floor(Math.random() * (max - min)) + min
}
