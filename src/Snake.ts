import Coord from './Coord'

export default class Snake {
    id: string
    name: string
    taunt: string
    health: number
    body: Coord[]

    constructor(snake: Snake) {
        this.id = snake.id
        this.name = snake.name
        this.taunt = snake.taunt
        this.health = snake.health
        this.body = snake.body.reduce((arr, segment) => {
            arr.push(new Coord(segment.x, segment.y))
            return arr
        }, [])
    }

    hasCoord(coord: Coord): boolean {
        return this.body.some((segment: Coord) => {
            return coord.equals(segment)
        })
    }

    isAlive(): boolean {
        return this.health > 0
    }
}
