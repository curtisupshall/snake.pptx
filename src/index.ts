import * as bodyParser from 'body-parser'
import * as express from 'express'
import * as logger from 'morgan'
import * as routes from './routes'

const app = express()

// For deployment to Heroku, the port needs to be set using ENV, so
// we check for the port number in process.env
app.set('port', (process.env.PORT || 9001))

app.enable('verbose errors')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(routes as any)

app.use('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
	if (req.url === '/favicon.ico') {
		// Short-circuit favicon requests
		res.set({'Content-Type': 'image/x-icon'})
		res.status(200)
		res.end()
		next()
	} else {
		// Reroute all 404 routes to the 404 handler
		const err = new Error() as HTTPStatusError
		err.status = 404
		next(err)
	}

	return
})

// 404 handler middleware, respond with JSON only
app.use((err: HTTPStatusError, req: express.Request, res: express.Response, next: express.NextFunction) => {
	if (err.status !== 404) {
		return next(err)
	}

	res.status(404)
	res.send({
		status: 404,
		error: err.message || 'These are not the snakes you\'re looking for'
	})

	return
})

// 500 handler middleware, respond with JSON only
app.use(function (err, req, res, next) {
	const statusCode = err.status || 500

	res.status(statusCode)
	res.send({
		status: statusCode,
		error: err
	})

	return
})

const server = app.listen(app.get('port'), function () {
	console.log('Server listening on port %s', app.get('port'))
})

interface HTTPStatusError extends express.Errback {
	status: number
	message: string
}
