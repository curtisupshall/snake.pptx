import * as express from "express"
import {
	Move, StartRequest, DummyHead, Target, MoveRequest, StartResponse,
	MoveResponse, MoveResponseData, StartResponseData, EndRequest, EndRequestData
} from "../types/battlesnake"
import Coord from '../Coord'
import Snake from '../Snake'
import { moveToCoord, coordToMove, randInt } from '../utils/snake.utils'
import { json } from "body-parser";

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
		color: "#CB4A32",
		headType: 'tongue',
		tailType: 'bolt'
	}
	
	return res.json(responseData)
})

router.post('/end', (req: any, res: any): any => {
	res.status(200)
	return res.json()
})

router.post('/ping', (req: any, res: any): any => {
	res.status(200)
	return res.json()
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
	const enemies: Snake[] = requestData.board.snakes.reduce((arr: Snake[], snake: Snake) => {
		if (snake.id !== me.id) arr.push(new Snake(snake))
		return arr
	}, [])

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
	 * An array of DummyHeads - coordinates which an enemy snake *may* move into
	 * on the next turn. Since moving to a Dummy Head square might net us a kill,
	 * the *avoid* paramter tells us whether or not we should avoid that coordinate.
	 * See the type definition for *DummyHead*.
	 */
	const dummyHeads: DummyHead[] = enemies.reduce((dummies: DummyHead[], snake) => {
		let head: Coord = snake.body[0]
		dummies.push(...allMoves.reduce((directions: DummyHead[], dir: Move) => {
			let step: Coord = moveToCoord(head, dir)
			if (!snake.hasCoord(step) && !ooB(step) && !step.equals(me.getTail())) {
				directions.push({
					coord: step,
					avoid: snake.body.length >= me.body.length
				})
			}
			return directions
		}, []))
		return dummies
	}, [])

	/**
	 * An array of food on the board, sorted in ascending 
	 * order by distance its distance to us.
	 */
	const food = requestData.board.food.map(food => new Coord(food.x, food.y)).sort((a, b) => {
		let head = me.getHead()
		return head.distanceTo(a) - head.distanceTo(b)
	})
	console.log('Turn: ', requestData.turn)
	/**
	 * A 2D array of weights used for Floodfill and A*.
	 * 0 denotes a wall, and 1 denotes a free space.
	 */
	let grid: Array<Array<number>> = []
	// Fill our array with 1's (empty space)
	for (let i = 0; i < arena.width; i ++) {
		grid[i] = []
		for (let j = 0; j < arena.height; j ++) {
			grid[i][j] = 1
		}
	}
	let snakes: Snake[] = enemies
	snakes.push(me)

	// We wish to fill in our grid with zeros wherever we see
	// a snake segment, denoting "walls" for our A* algorithm
	//console.log('Parsing # of snakes:'+snakes.length) 
	for (let i = 0; i < snakes.length; i ++) {
		//console.log('parsing ' + snakes[i].name +"'s "+ (snakes[i].body.length) + ' segs')
		for (let j = 0; j < snakes[i].body.length - 1; j ++) {
			//console.log('inspecting '+snakes[i].name+"'s seg:" + snakes[i].body[j].toString())
			grid[snakes[i].body[j].x][snakes[i].body[j].y] = 0
		}

		if (snakes[i].willGrow()) {
			let tail = snakes[i].getTail()
			grid[tail.x][tail.y] = 0
		}
		//console.log('parsing ' + snakes[i].name +"'s tail")
	}
	//console.log('about to parse dummyHeads:', dummyHeads)
	// Add dummy heads
	for (let k = 0; k < dummyHeads.length; k ++) {
		if (dummyHeads[k].avoid) {
			grid[dummyHeads[k].coord.x][dummyHeads[k].coord.y] = 0
		}
	}
	//console.log('parsed dummy heads')

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
	 * Determines if we should go for food or not.
	 */
	const needFood = (): boolean => {
		let amLongest = true
		for (let i = 0; i < enemies.length; i ++) {
			if (enemies[i].body.length > me.body.length) {
				amLongest = false
				break
			}
		}
		return !me.hasEvenLength() //|| !amLongest
	}
	/**
	 * Helper method for using the A* library, which gives us the shortest
	 * path to a desired coordinate. Target might include food (if we're
	 * hungry), our own tail (stall for time), or an enemy snakes head
	 * (going for a kill).
	 * @param to The coordinate we wish to reach.
	 * @param from The coordinate we're currently at (defaults to our head).
	 * @return The shortest path to the given point. An empty array
	 * signifies no path could be found.
	 */
	const targetPathfind = (to: Coord, from?: Coord): Coord[] => {
		if (!from) from = me.body[0]
		if (!to) {
			// If we can't resolve our target, just return the start Coord.
			return [from]
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
		const coord = moveToCoord(me.getHead(), direction)
		let isDummyHead = dummyHeads.some((dummyHead) => {
			return coord.equals(dummyHead.coord) && dummyHead.avoid
		})
		let isOoB = ooB(coord)
		let isASegment = isSegment(coord)
		if ( !isDummyHead && !isOoB && !isASegment ) {
			arr.push(direction)
		}
		return arr
	}, [])

	/**
	 * Moves that may result in a death, but may not.
	 */
	const riskyMoves: Move[] = allMoves.reduce((arr: Move[], direction) => {
		const coord = moveToCoord(me.getHead(), direction)
		let isDummyHead = dummyHeads.some((dummyHead) => {
			return coord.equals(dummyHead.coord)
		})
		if (isDummyHead) {
			arr.push(direction)
		}
		return arr
	}, [])

	/**
	 * An array of Coords that, should we follow one, will kill another
	 * snake on the board.
	 */
	const killCoords: Coord[] = dummyHeads.reduce((arr: Coord[], dummyHead: DummyHead) => {
		if (dummyHead.avoid === false) {
			arr.push(dummyHead.coord)
		}
		return arr
	}, [])

	/**
	 * A prioritized list of target Coords
	 */
	let targets: Target[] = []
	
	if (me.isHungry()) {
		for (let i = 0; i < food.length; i ++) {
			targets.push({coord: food[i], name: 'Food '+food[i].toString()})
		}
	}
	if (killCoords.length) {
		for (let i = 0; i < killCoords.length; i ++) {
			targets.push({coord: killCoords[i], name: 'killCoord '+killCoords[i].toString()})
		}
		targets.push({coord: me.getTail(), name: 'Our tail '+me.getTail().toString()})
	}
	else {
		if (needFood()) {
			for (let i = 0; i < food.length; i ++) {
				targets.push({coord: food[i], name: 'Food '+food[i].toString()})
			}
		}
		else {
			targets.push({coord: me.getTail(), name: 'Our tail '+me.getTail().toString()})
			for (let i = 0; i < killCoords.length; i ++) {
				targets.push({coord: killCoords[i], name: 'killCoord '+killCoords[i].toString()})
			}
		}
	}
	
	// We decided our final move based on target priority list
	let finalMove = false
	let prelimMove = false
	let moveChoice = safeMoves[randInt(0, safeMoves.length - 1)]
	let head = me.getHead()
	let targetPath: Coord[] = []
	while (!finalMove) {
		while (!prelimMove) {
			if (targets.length) {
				let target = targets.shift()
				console.log('Current target: '+ target.name)
				targetPath = targetPathfind(target.coord)
				console.log('Target path:', targetPath)
				if (targetPath.length)	{
					moveChoice = coordToMove(head, targetPath[0])
					if (safeMoves.includes(moveChoice)) {
						prelimMove = true
					}
				}
			}
			else {
				console.log('Ran out of targets!')
				break
			}
		}
		finalMove = true
	}

	console.log('Safe moves', safeMoves)
	console.log('Move choice', moveChoice)
	// Response data
	const responseData: MoveResponseData = {
		move: moveChoice
	}
	
	return res.json(responseData)
})

module.exports = router
