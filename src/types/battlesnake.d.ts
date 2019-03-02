import {Request, Response} from "express"
import Coord from '../Coord'
import Snake from '../Snake'


export interface StartRequest extends Request {
    body: StartRequestData
}

export interface StartRequestData {
    game_id: string
    height: number
    width: number
}

interface StartSend {
    (status: number, body?: StartResponseData): StartResponse
    (body?: StartResponseData): StartResponse
}

export interface StartResponse {
    json: StartSend
}

export type headType =
    | 'beluga'
    | 'bendr'
    | 'dead'
    | 'evil'
    | 'fang'
    | 'pixel'
    | 'regular'
    | 'safe'
    | 'sand-worm'
    | 'shades'
    | 'silly'
    | 'smile'
    | 'tongue'

export type tailType = 
    | 'block-bum'
    | 'bolt'
    | 'curled'
    | 'fat-rattle'
    | 'freckled'
    | 'hook'
    | 'pixel'
    | 'regular'
    | 'round-bum'
    | 'sharp'
    | 'skinny'
    | 'small-rattle'

export interface StartResponseData {
    color: string
    // name: string
    // head_url?: string
    // taunt?: string
    headType?: headType
    tailType?: tailType

}

export interface MoveRequest extends Request {
    body: MoveRequestData
}

export interface MoveRequestData {
    game_id: string
    board: Board
    turn: number
    you: Snake
}

interface MoveSend {
    (status: number, body?: MoveResponseData): MoveResponse
    (body?: MoveResponseData): MoveResponse
}

export interface MoveResponse {
    json: MoveSend
}

export interface EndRequest extends Request {
    body: EndRequestData
}

export interface EndRequestData extends MoveRequestData {}

export type Move = "up" | "down" | "left" | "right"

export interface MoveResponseData {
    move: Move
}

export interface Game {
    id: string
}

export interface Board {
    height: number
    width: number
    food: Coord[]
    snakes: Snake[]
}

export interface DummyHead {
    coord: Coord
    avoid: boolean
}

export interface Target {
    coord: Coord
    name: string
}