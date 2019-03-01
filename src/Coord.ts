export default class Coord {
    x: number
	y: number
	
	constructor(x: number, y: number) {
		this.x = x
		this.y = y
	}
	
	equals(coord: Coord): boolean {
		return this.x == coord.x && this.y == coord.y
	}

	distanceTo(coord: Coord): number {
		return Math.abs(this.x - coord.x) + Math.abs(this.y - coord.y)
	}

	toArray(): number[] {
		return [this.x, this.y]
	}

	toString(): string {
		return '(' + this.x + ',' + this.y + ')'
	}
}