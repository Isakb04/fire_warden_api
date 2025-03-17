const express = require('express');
const sql = require('mssql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

app.use(bodyParser.json());

app.use(cors({
    origin: 'https://thankful-plant-06e390d10.6.azurestaticapps.net',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

app.use(bodyParser.json());
app.options('/FireWardenTracker_add', cors());

const dbConfig = {
    user: 'adminadmin',
    password: 'Admin12345',
    server: 'firewardentracker.database.windows.net',
    database: 'firewardentracker',
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

app.post('/FireWardenTracker_add', async (req, res) => {
    const { Personid, FirstName, MiddleInitial, LastName, DateOfBirth, Email, password, Phone, Location } = req.body;

    try {
        await sql.connect(dbConfig);

        await sql.query` INSERT INTO FireWardens (
                Personid,
                FirstName,
                MiddleInitial,
                LastName,
                DateOfBirth,
                Email,
                password,
                Phone,
                Location
            )
            VALUES (
                ${Personid},
                ${FirstName},
                ${MiddleInitial},
                ${LastName},
                ${DateOfBirth},
                ${Email},
                ${password},
                ${Phone},
                ${Location}
            )`;

        res.status(200).send('Successfully added a warden');
    }
    catch (err) {
        console.error('Error adding warden:', err);
        res.status(500).send('Error adding warden');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});