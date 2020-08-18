/* global Scratch */
/// <reference types="scratch-env"/>

class ExampleExtension implements ScratchExtension {
	getInfo(): ExtensionMetadata {
		return {
			id: "Example Extension",
			name: "Greeter",
			blocks: [{
				opcode: "greet",
				blockType: Scratch.BlockType.REPORTER,
				text: "Greet [name]",
				arguments: {
					name: {
						type: Scratch.ArgumentType.STRING,
						defaultValue: "Richie"
					}
				}
			}]
		}
	}

	helloWorld({ name }: { name: string }): string {
		return `Hello ${name}!`
	}
}

Scratch.extensions.register(new ExampleExtension())
