const express = require('express');
const app = express();
const port = process.env.PORT || ${{ values.applicationPort }};

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from ${{ values.name }}!',
    namespace: '${{ values.namespace }}',
    port: port,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`${{ values.name }} listening on port ${port}`);
});