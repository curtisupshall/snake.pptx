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
     * segments at the given coordinate. The tail is not included,
     * unless the snake will grow on the next turn.
     * @param coord Coord to test.
     * @return True if the snake has the coordinate, false otherwise.
     */
    hasCoord(coord: Coord): boolean {
        for (let i = 0; i < this.body.length - 1; i ++) {
            if (coord.equals(this.body[i])) {
                return true
            }
        }
        if (this.willGrow() && coord.equals(this.getTail())) {
            return true
        }
        return false
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
     * Determines if the snake should get some grub.
     */
    isHungry(): boolean {
        return this.health <= 50
    }

    /**
     * Returns the head segment of the snake.
     */
    getHead(): Coord {
        return this.body[0]
    }

    /**
     * Returns the tail of the snake.
     */
    getTail(): Coord {
        return this.body[this.body.length - 1]
    }

    /**
     * Determines if the snake is of even or odd length.
     * @return True if the snake has even length, false
     * if it has odd length.
     */
    hasEvenLength(): boolean {
        return this.body.length % 2 == 0
    }

    /**
     * Returns an array of Coords describing the snakes body
     * should it continue forward on the next turn.
     */
    moveForward(): Coord[] {
        let body: Coord[] = []
        let currentHead = this.getHead()
        let previousHead = this.body[1]
        body.push(moveToCoord(currentHead, coordToMove(previousHead, currentHead)))
        for (let i = 0; i < this.body.length - 1; i ++) {
            body.push(this.body[i])
        }
        return body
    }
}
