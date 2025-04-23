const express = require("express")
const cors = require("cors")
const app = express()
const PORT = 4000

app.use(cors())
app.use(express.json())

const items = Array.from({ length: 1000000 }, (_, i) => ({
	id: i + 1,
	value: i + 1,
	sortOrder: i + 1,
}))

let selectedByUser = new Set()

app.get("/items", (req, res) => {
	const { skip = 0, limit = 20, search = "" } = req.query

	let result = items

	if (search) {
		result = result.filter((item) => item.value.toString().includes(search))
	}

	result.sort((a, b) => (a.sortOrder || a.id) - (b.sortOrder || b.id))

	const pages = result.slice(Number(skip), Number(skip) + Number(limit))

	res.json(
		pages.map((item) => ({
			...item,
			selected: selectedByUser.has(item.id),
		})),
	)
})

app.post("/save-state", (req, res) => {
	const { selected } = req.body

	if (Array.isArray(selected)) {
		selectedByUser = new Set(selected)
	}

	res.json({ success: true })
})

app.get("/state", (req, res) => {
	res.json({ selected: Array.from(selectedByUser) })
})

app.post("/reorder", (req, res) => {
	const { from, to, search = "" } = req.body

	if (typeof from !== "number" || typeof to !== "number") {
		return res.status(400).json({ error: "Invalid indices" })
	}

	let filteredItems = items
		.filter((item) => item.value.toString().includes(search))
		.sort((a, b) => (a.sortOrder ?? a.id) - (b.sortOrder ?? b.id))

	if (from < 0 || from >= filteredItems.length || to < 0 || to >= filteredItems.length) {
		return res.status(400).json({ error: "Index out of bounds" })
	}

	const movedItem = filteredItems.splice(from, 1)[0]
	filteredItems.splice(to, 0, movedItem)

	const before = filteredItems[to - 1] ?? null
	const after = filteredItems[to + 1] ?? null

	if (before && after) {
		movedItem.sortOrder = (before.sortOrder + after.sortOrder) / 2
	} else if (!before && after) {
		movedItem.sortOrder = after.sortOrder - 1
	} else if (before && !after) {
		movedItem.sortOrder = before.sortOrder + 1
	}

	res.json({ success: true })
})

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`)
})
