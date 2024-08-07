const express = require('express');
const app = express();
const path = require('path')
const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, '/client/build')));
app.get("*",(req, res) => {
res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
})

app.listen(PORT, () => {
    console.log(`Serveur demarré en écoute sur le port ${PORT}!`)
});

