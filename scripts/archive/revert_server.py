with open('server.ts', 'r') as f:
    text = f.read()

route = """
app.post('/api/log-error', express.json(), (req, res) => {
  const fs = require('fs');
  fs.writeFileSync('client_error.log', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});
"""

text = text.replace(route, "")

with open('server.ts', 'w') as f:
    f.write(text)

