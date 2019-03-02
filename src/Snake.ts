import Coord from './Coord'
import {moveToCoord, coordToMove } from './utils/snake.utils'

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

    /**
     * Determines if the given snakes has one of its body
     * segments at the given coordinate.
     * @param coord Coord to test.
     * @return True if the snake has the coordinate, false otherwise.
     */
    hasCoord(coord: Coord): boolean {
        return this.body.some((segment: Coord) => {
            return coord.equals(segment)
        })
    }

    // TODO
    willDie(): boolean {
        return false;
    }

    /**
     * Determines if a snake will grow on the next turn. This
     * is useful to know, since snakes that are growing will
     * leave their tail behind for an additional turn.
     */
    willGrow(): boolean {
        return this.health == 100
    }

    /**
     * Determines the location that the snake's tail had on 
     * the previous turn (unless it just ate, in which case we get
     * the location from two turns ago).
     * @return The location its tail had
     */
    getTail(): Coord {
        let currentTail = this.body[this.body.length - 1]
        let nextTail = this.body[this.body.length - 2]
        return moveToCoord(currentTail, coordToMove(nextTail, currentTail))
    }

    /**
     * Determines if the snake should get some grub.
     */
    isHungry(): boolean {
        return this.health <= 50
    }
}
