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

	result.sort((a, b) => (a.sortOrder ?? a.id) - (b.sortOrder ?? b.id))

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
	const { movedId, beforeId, afterId } = req.body

	const movedItem = items.find((i) => i.id === movedId)
	const beforeItem = items.find((i) => i.id === beforeId)
	const afterItem = items.find((i) => i.id === afterId)

	if (!movedItem) {
		return res.status(400).json({ error: "Moved item not found" })
	}

	if (beforeItem && afterItem) {
		movedItem.sortOrder = (beforeItem.sortOrder + afterItem.sortOrder) / 2
	} else if (beforeItem && !afterItem) {
		movedItem.sortOrder = beforeItem.sortOrder + 1
	} else if (!beforeItem && afterItem) {
		movedItem.sortOrder = afterItem.sortOrder - 1
	} else {
		movedItem.sortOrder = 0
	}

	res.json({ success: true })
})

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`)
})
