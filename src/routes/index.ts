import * as express from "express"
import {
	Move, StartRequest, DummyHead, MoveRequest, StartResponse,
	MoveResponse, MoveResponseData, StartResponseData, EndRequest, EndRequestData
} from "../types/battlesnake"
import Coord from '../Coord'
import Snake from '../Snake'
import { moveToCoord, coordToMove, randInt, closest } from '../utils/snake.utils'

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
		//name: "carlos-matos",
		//head_url: "",
		//taunt: "bitconneeeeect!"
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
	const snakes: Snake[] = requestData.board.snakes.reduce((arr, snake) => {
		if (snake.id !== me.id) arr.push(new Snake(snake))
		return arr
	}, [])
	
	/**
	 * An array of coordinates, of which a head *may* appear on in
	 * the next turn. This does not include those of snakes that
	 * are shorter than us, since we will hapilly move to that coordinate and
	 * kill the other snake.
	 */
	const dummyHeads: DummyHead[] = snakes.reduce((dummies: DummyHead[], snake) => {
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
	
	const ooB = (coord: Coord): boolean => {
		return coord.x < 0
			|| coord.x >= arena.width
			|| coord.y < 0
			|| coord.y >= arena.width
	}

	const isSegment = (coord: Coord): boolean => {
		return snakes.concat(me).some((snake: Snake) => {
			return snake.hasCoord(coord)
		})
	}

	const isFood = (coord: Coord): boolean => {
		for (let i = 0; i < food.length; i ++) {
			if (food[i].equals(coord)) return true
		}
		return false
	}

	const A_Star = (coord: Coord) => {
		let grid = [...Array(arena.width)].map(e => Array(arena.height).fill(1))
		snakes.concat(me).forEach((snake) => {
			snake.body.forEach((segment) => {
				grid[segment.x][segment.y] = 0
			})
		})
	}
	const safeMoves: Move[] = allMoves.reduce((arr: Move[], direction) => {
		const coord = moveToCoord(me.body[0], direction)
		let isDummyHead = dummyHeads.every((dummyHead) => {
			return coord.equals(dummyHead.coord)
		})
		if ( !isDummyHead && !ooB(coord) && !isSegment(coord) ) {
			arr.push(direction)
		}
		return arr
	}, [])
	
	let closeFood = closest(me.body[0], food)
	const moveChoice = safeMoves[0]

	// Response data
	const responseData: MoveResponseData = {
		move: moveChoice,
		taunt: ''
	}
	
	return res.json(responseData)
})

module.exports = router
