const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const items = Array.from({ length: 1000000 }, (_, i) => ({
  id: i + 1,
  value: i + 1,
}));

let customSorting = [];      
let selectedByUser = new Set();

app.get('/items', (req, res) => {
  const { skip = 0, limit = 20, search = '' } = req.query;

  let result = items;

  if (search) {
    result = result.filter(item => item.value.toString().includes(search));
  }

  if (customSorting.length > 0) {
    const sorted = customSorting
      .map(id => result.find(item => item.id === id))
      .filter(Boolean);

    const unsorted = result.filter(item => !customSorting.includes(item.id));
    result = [...sorted, ...unsorted];
  }

  const pages = result.slice(Number(skip), Number(skip) + Number(limit));

  res.json(
    pages.map(item => ({
      ...item,
      selected: selectedByUser.has(item.id),
    }))
  );
});

app.post('/save-state', (req, res) => {
  const { selected, order } = req.body;

  if (Array.isArray(selected)) {
    selectedByUser = new Set(selected);
  }

  if (Array.isArray(order)) {
    customSorting = order;
  }

  res.json({ success: true });
});

app.get('/state', (req, res) => {
  res.json({
    selected: Array.from(selectedByUser),
    order: customSorting,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
