#!/usr/bin/env node
"use strict"
const { rollup: build, watch } = require("rollup")
const chalk = require("chalk")
const pathExists = require("path-exists")
const meow = require("meow")
const ora = require("ora")
const path = require("path")
const updateNotifier = require("update-notifier")
const exitHook = require("exit-hook")
const pkg = require("./package.json")

const { babel } = require("@rollup/plugin-babel")
const closure = require("@ampproject/rollup-plugin-closure-compiler")
const { nodeResolve } = require("@rollup/plugin-node-resolve")
const commonjs = require("@rollup/plugin-commonjs")
const serve = require("rollup-plugin-serve")

updateNotifier({ pkg }).notify()

const { input } = meow(`
    Usage
	  $ scratcher [build|watch] <source>

    Examples
      $ scratcher build
	  √ ${chalk.green("Successfully built extension!")}

	  $ scratcher watch
	  ${chalk.cyan("/")} Waiting for changes
`)

const [
	action,
	source = path.resolve("source", "index.ts"),
	outputFile = path.resolve("dist", "index.min.js")
] = input

const commonPlugins = [
	commonjs({ extensions: [".js", ".ts"] }),
	nodeResolve({ browser: true }),
	babel({
		presets: [
			["@babel/preset-typescript", {
				allowNamespaces: true,
				allowDeclareFields: true,
				onlyRemoveTypeImports: true
			}],
			["@babel/preset-env", {
				targets: {
					browsers: ["last 3 versions", "Safari >= 8", "iOS >= 8"]
				}
			}]
		],
		babelHelpers: "bundled"
	})
]

const commonOutputOptions = {
	format: "iife"
}

module.exports = (async () => {
	if (!await pathExists(source)) {
		console.log(chalk.redBright("The input file does not exist!"))
	}

	if (action === "build") {
		const spinner = ora(`Building ${source}`).start()

		const bundle = await build({
			input: source,
			plugins: [
				...commonPlugins,
				closure({ externs: path.resolve(__dirname, "utils", "closure-externs.js") })
			]
		})

		spinner.text = `Writing to ${outputFile}`

		await bundle.write({
			file: outputFile,
			...commonOutputOptions
		})

		spinner.succeed(chalk.greenBright("Successfully built extension!"))
	} else if (action === "watch") {
		const spinner = ora("Preparing watcher").start()

		const watcher = watch({
			input: source,
			plugins: [
				serve({
					open: true,
					openPage: `?extension=${path.basename(outputFile)}`,
					// TODO: Uncomment when https://github.com/thgh/rollup-plugin-serve/pull/64 is merged.
					// verbose: false,
					contentBase: [
						path.dirname(outputFile),
						path.dirname(require.resolve("scratch-gui/lib.min"))
					],
					headers: {
						"Access-Control-Allow-Origin": "*"
					}
				}),
				...commonPlugins
			],
			output: {
				file: outputFile,
				...commonOutputOptions,
				sourcemap: true
			}
		})

		watcher.on("event", ({ code: event, error }) => {
			if (event === "START") {
				spinner.text = "Starting watcher"
			} else if (event === "BUNDLE_START") {
				spinner.text = "Building extension"
			} else if (event === "END") {
				spinner.text = "Waiting for changes"
			} else if (event === "ERROR") {
				spinner.text = chalk.red(`Build error: ${error.message}`)
			}
		})

		exitHook(() => {
			watcher.close()
		})
	} else {
		console.log(chalk.redBright("Invalid action! You can only specify `build` or `watch` as the first parameter."))
	}
})()