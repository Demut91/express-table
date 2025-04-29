import React, { useCallback, useEffect, useRef, useState } from "react"

import axios from "axios"
import TableDragger from "table-dragger"

import "./styles.css"

const PAGE_SIZE = 20
const API_URL = "http://localhost:4000"

function App() {
	const [items, setItems] = useState([])
	const [search, setSearch] = useState("")
	const [skip, setSkip] = useState(0)
	const [more, setHasMore] = useState(true)
	const [loading, setLoading] = useState(false)
	const [selected, setSelected] = useState(new Set())
	const isLoadingRef = useRef(false)
	const observer = useRef()
	const tableRef = useRef()

	const loadItems = useCallback(async () => {
		if (loading || !more || isLoadingRef.current) return
		isLoadingRef.current = true
		setLoading(true)

		const res = await axios.get(`${API_URL}/items`, {
			params: { skip, limit: PAGE_SIZE, search },
		})

		const newItems = res.data
		setItems((prev) => [...prev, ...newItems])
		setSkip((prev) => prev + newItems.length)
		if (newItems.length < PAGE_SIZE) setHasMore(false)

		setLoading(false)
		isLoadingRef.current = false
	}, [skip, search, loading, more])

	const lastItemRef = useCallback(
		(node) => {
			if (loading) return
			if (observer.current) observer.current.disconnect()

			observer.current = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting && more) {
					loadItems()
				}
			})

			if (node) observer.current.observe(node)
		},
		[loading, more, loadItems],
	)

	const handleSearch = (e) => {
		setSearch(e.target.value)
		setItems([])
		setSkip(0)
		setHasMore(true)
	}

	const toggleSelect = (id) => {
		setSelected((prev) => {
			const newSet = new Set(prev)
			newSet.has(id) ? newSet.delete(id) : newSet.add(id)
			return newSet
		})
	}

	useEffect(() => {
		loadItems()
	}, [search])

	useEffect(() => {
		const loadState = async () => {
			const res = await axios.get(`${API_URL}/state`)
			const { selected } = res.data
			setSelected(new Set(selected))
		}

		loadState()
	}, [])

	useEffect(() => {
		const saveState = async () => {
			await axios.post(`${API_URL}/save-state`, {
				selected: Array.from(selected),
			})
		}

		if (selected.size > 0) {
			saveState()
		}
	}, [selected])

	const draggerRef = useRef(null)

	useEffect(() => {
		if (tableRef.current) {
			if (draggerRef.current) {
				draggerRef.current.destroy()
			}

			const dragger = new TableDragger(tableRef.current, {
				dragHandler: "button",
				onlyBody: true,
				mode: "row",
			})

			dragger.on("drop", (from, to) => {
				const currentItems = [...items]

				const movedItem = currentItems[from - 1]
				let beforeItem = null
				let afterItem = null

				if (to === 1) {
					afterItem = currentItems[0]
				} else {
					beforeItem = currentItems[to - 2]
					afterItem = currentItems[to - 1]
				}

				if (!movedItem) return

				axios.post(`${API_URL}/reorder`, {
					movedId: movedItem.id,
					beforeId: beforeItem?.id || null,
					afterId: afterItem?.id || null,
				})
			})

			draggerRef.current = dragger
		}
	}, [items])

	return (
		<div className="container">
			<h1>Express numbers table</h1>

			<input type="text" value={search} onChange={handleSearch} placeholder="Поиск..." />

			<table ref={tableRef}>
				<thead>
					<tr>
						<th>
							Dragging<button style={{ display: "none" }}></button>
						</th>
						<th>ID</th>
						<th>Value</th>
						<th>Checked</th>
					</tr>
				</thead>
				<tbody>
					{items.map((item, index) => (
						<tr
							key={item.id}
							ref={index === items.length - 1 ? lastItemRef : null}
							style={{ background: selected.has(item.id) ? "#d7f4fc" : "#fff" }}
							data-id={item.id}
						>
							<th>
								<button>↕</button>
							</th>
							<td>{item.id}</td>
							<td>{item.value}</td>
							<td>
								<input
									type="checkbox"
									checked={selected.has(item.id)}
									onChange={() => toggleSelect(item.id)}
								/>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{loading && <p>Loading...</p>}
		</div>
	)
}

export default App
