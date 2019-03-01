import Coord from '../Coord'
import { Move } from '../types/battlesnake'

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

export const coordToMove = (from: Coord, to: Coord): Move => {
	if (to.x > from.x) return 'right'
	else if (to.x < from.x) return 'left'
	else if (to.y > from.y) return 'down'
	else return 'up'
}

export const closest = (from: Coord, array: Coord[]): Coord => {
	let closest = array[0]
	if (array.length > 1) {
		for (let i = 1; i < array.length - 1; i ++) {
			if (array[i].distanceTo(from) < closest.distanceTo(from)) {
				closest = array[i]
			}
		}
	}
	return closest
}

export const randInt = (min: number, max: number) => {
	return Math.floor(Math.random() * (max - min)) + min
}
