const test = require("ava")
const pathExists = require("path-exists")
const execa = require("execa")

test("main", async t => {
	await execa("./cli.js", ["build", "fixtures/index.ts", "fixtures/dist/index.min.js"])
	t.true(await pathExists("fixtures/dist/index.min.js"))
})
