import * as express from "express"
import {
	Move, StartRequest, DummyHead, MoveRequest, StartResponse,
	MoveResponse, MoveResponseData, StartResponseData, EndRequest, EndRequestData
} from "../types/battlesnake"
import Coord from '../Coord'
import Snake from '../Snake'
import { moveToCoord, coordToMove, closest } from '../utils/snake.utils'

const astar = require('javascript-astar')

interface BattleSnakeRouter {
	post(route: '/start', cb: (req: StartRequest, res: StartResponse) => any): void
	post(route: '/end', cb: (req: EndRequest, res: any) => any): void
	post(route: '/ping', cb: (req: any, res: any) => any): void
	post(route: '/move', cb: (req: MoveRequest, res: MoveResponse) => any): void
}

const router: BattleSnakeRouter = express.Router()

router.post('/start', (req: StartRequest, res: StartResponse): StartResponse => {

	const responseData: StartResponseData = {
		color: "#FF0000",
		headType: 'tongue',
		tailType: 'bolt'
	}
	
	return res.json(responseData)
})

router.post('/end', (req: EndRequest, res: any): void => {
	res.status(200)
})

router.post('/ping', ( res: any): void => {
	res.status(200)
})

// Handle POST request to '/move'
router.post('/move', (req: MoveRequest, res: MoveResponse): MoveResponse => {
	const requestData = req.body
	const allMoves: Move[] = ['up', 'down', 'left', 'right']
	const arena = {
		width: requestData.board.width,
		height: requestData.board.height
	}
	const me: Snake = new Snake(requestData.you)
	const enemies: Snake[] = requestData.board.snakes.reduce((arr, snake) => {
		if (snake.id !== me.id) arr.push(new Snake(snake))
		return arr
	}, [])
	
	/**
	 * An array of DummyHeads - coordinates which an enemy snake *may* move into
	 * on the next turn. Since moving to a Dummy Head square might net us a kill,
	 * the *avoid* paramter tells us whether or not we should avoid that coordinate.
	 * See the type definition for *DummyHead*.
	 */
	const dummyHeads: DummyHead[] = enemies.reduce((dummies: DummyHead[], snake) => {
		let head: Coord = snake.body[0]
		dummies.push(...allMoves.reduce((directions: DummyHead[], dir: Move) => {
			let step: Coord = moveToCoord(head, dir)
			if (!snake.hasCoord(step)) directions.push({
				coord: step,
				avoid: snake.body.length >= me.body.length
			})
			return directions
		}, []))
		return dummies
	}, [])
	const food = requestData.board.food.map(food => new Coord(food.x, food.y))
	
	/**
	 * Determines whether or not a given coordinate is out-of-bounds.
	 * @param coord The coordinate we're testing.
	 * @return True if it's out-of-bounds (should avoid), false otherwise.
	 */
	const ooB = (coord: Coord): boolean => {
		return coord.x < 0
			|| coord.x >= arena.width
			|| coord.y < 0
			|| coord.y >= arena.width
	}

	/**
	 * Determines if a given coordinate is occupied by part of
	 * another snakes body, including out own.
	 * @param coord The coordinate we're testing.
	 * @return True if it's a segment, false otherwise.
	 */
	const isSegment = (coord: Coord): boolean => {
		return enemies.concat(me).some((snake: Snake) => {
			return snake.hasCoord(coord)
		})
	}

	/**
	 * Determines whether or not a given coordinate has a piece
	 * of food located there.
	 * @param coord The coordinate to test.
	 * @return True if there's food there, false otherwise.
	 */
	const isFood = (coord: Coord): boolean => {
		for (let i = 0; i < food.length; i ++) {
			if (food[i].equals(coord)) return true
		}
		return false
	}

	/**
	 * Helper method for using the A* library, which gives us the shortest
	 * path to a desired coordinate. Target might include food (if we're
	 * hungry), our own tail (stall for time), or an enemy snakes head
	 * (going for a kill).
	 * @param from The coordinate we're currently at.
	 * @param to The coordinate we wish to reach.
	 * @return The shortest path to the given point. An empty array
	 * signifies no path could be found.
	 */
	const A_Star = (from: Coord, to: Coord): Coord[] => {
		if (!to) {
			// If we can't resolve our target, just return the start Coord.
			return [from]
		}
		// Builds a grid array that the A* library will accept
		let grid: Array<Array<number>> = []
		// Fill our array with 1's (empty space)
		for (let i: number = 0; i < arena.width; i ++) {
			grid[i] = []
			for (let j: number = 0; j < arena.height; j ++) grid[i][j] = 1
		}
		let snakes = enemies.concat(me)
		// We wish to fill in our grid with zeros wherever we see
		// a snake segment, denoting "walls" for our A* algorithm 
		for (let i = 0; i < snakes.length; i ++) {
			for (let j = 0; j < snakes[i].body.length; j ++) {
				grid[snakes[i].body[j].x][snakes[i].body[j].y] = 0
			}
		}
		let graph = new astar.Graph(grid)
		let start = graph.grid[from.x][from.y]
		let end = graph.grid[to.x][to.y]
		let path = astar.astar.search(graph, start, end)
		// Return array of Coord objects, denoting the path to take
		return path.map((gridNode) => new Coord(gridNode.x, gridNode.y))
	}

	/**
	 * An array of moves that are guarenteed to *at least*
	 * keep us alive for the next turn. Does not guarentee that
	 * the move won't back us into a corner, etc.
	 */
	const safeMoves: Move[] = allMoves.reduce((arr: Move[], direction) => {
		const coord = moveToCoord(me.body[0], direction)
		let isDummyHead = dummyHeads.some((dummyHead) => {
			return coord.equals(dummyHead.coord) && dummyHead.avoid
		})
		let isOoB = ooB(coord)
		let isASegment = isSegment(coord)
		if ( !isDummyHead && !isOoB && !isASegment ) {
			arr.push(direction)
		}
		//console.log(direction)
		//console.log('isDummyHead:', isDummyHead, ' isOoB:', isOoB, ' isSegment:', isASegment)
		return arr
	}, [])
	
	//console.log("Safe moves: ", safeMoves)

	/**
	 * An array of moves that, should we follow it, will kill another
	 * snake on the board.
	 */
	const killMoves: Move[] = dummyHeads.reduce((arr: Move[], dummyHead: DummyHead) => {
		if (dummyHead.avoid === false) {
			arr.push(coordToMove(me.body[0], dummyHead.coord))
		}
		return arr
	}, [])
	
	let closeFood = closest(me.body[0], food)
	// Tail chase
	//let head = me.body[0]
	//let tail = me.body[-1]
	//console.log('Head:'+head.toString()+' Tail:'+tail.toString())
	//const pathToTail = A_Star(me.body[0], me.body[-1])
	//console.log('Path to tail: ', pathToTail)
	//const moveChoice = coordToMove(me.body[0], pathToTail[1])

	const moveChoice = safeMoves[0]
	// Response data
	const responseData: MoveResponseData = {
		move: moveChoice,
		taunt: ''
	}
	
	return res.json(responseData)
})

module.exports = router
