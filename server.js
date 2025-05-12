const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const dbConfig = {
    user: 'adminadmin',
    password: 'Admin12345',
    server: 'firewardentracker.database.windows.net',
    database: 'FireWardenTracker',
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

app.post('/FireWardenTracker_add', async (req, res) => {
    const { PersonId, UserType, FirstName, MiddleInitial, LastName, DateOfBirth, Email, Password, Phone, Location, ShowOnTable } = req.body;

    try {
        await sql.connect(dbConfig);

        await sql.query`INSERT INTO FireWardens (
            PersonId,
            UserType,
            FirstName,
            MiddleInitial,
            LastName,
            DateOfBirth,
            Email,
            Password,
            Phone,
            Location,
            ShowOnTable
        ) VALUES (
                     ${PersonId},
                     ${UserType},
                     ${FirstName},
                     ${MiddleInitial},
                     ${LastName},
                     ${DateOfBirth},
                     ${Email},
                     ${Password},
                     ${Phone},
                     ${Location},
                     ${ShowOnTable}
                 )`;

        res.status(200).json({ message: 'Successfully added a warden' });
    } catch (err) {
        console.error('Error adding warden:', err);
        res.status(500).json({ error: 'Error adding warden', details: err.message });
    }
});

app.get('/FireWardenTracker_get_all', async (req, res) => {
    try {
        await sql.connect(dbConfig);

        const result = await sql.query`SELECT * FROM FireWardens`;
        console.log('Wardens Loaded');
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error getting wardens:', err);
        res.status(500).json({ error: 'Error getting wardens' });
    }
});

app.post('/FireWardenTracker_authenticate', async (req, res) => {
    const { email, password } = req.body;
    console.log('Received email:', email);
    console.log('Received password:', password);
    try {
        await sql.connect(dbConfig);

        const result = await sql.query`SELECT usertype, PersonId FROM FireWardens WHERE Email = ${email} AND password = ${password}`;
        
        if (result.recordset.length === 0) {
            res.status(401).json({ error: 'Invalid credentials' });
        } else {
            res.status(200).json({
                message: 'Successfully authenticated',
                userType: result.recordset[0].usertype,
                personId: result.recordset[0].PersonId
            });
        }
    } catch (err) {
        console.error('Error authenticating user:', err);
        res.status(500).json({ error: 'Error authenticating user' });
    }
});


app.get('/FireWarden_Locations', async (req, res) => {
    try {
        await sql.connect(dbConfig);

        const result = await sql.query`SELECT * FROM Locations`;
        console.log('Locations Loaded');
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error getting locations:', err);
        res.status(500).json({ error: 'Error getting locations' });
    }
});

app.get('/FireWardenTracker_with_Location', async (req, res) => {
    try {
        await sql.connect(dbConfig);

        const result = await sql.query(`
            SELECT 
                fw.PersonId,
                fw.FirstName,
                fw.MiddleInitial,
                fw.LastName,
                fw.DateOfBirth,
                fw.Email,
                fw.Password,
                fw.Phone,
                l.Location AS Location
                fw.LastUpdated
            FROM FireWardens fw
            JOIN Locations l ON fw.LocationId = l.Id
        `);

        console.log('Wardens with Locations Loaded');
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error getting wardens with locations:', err);
        res.status(500).json({ error: 'Error getting wardens with locations' });
    }
});


app.post('/FireWardenTracker_update_location', async (req, res) => {
    const { PersonId, Location } = req.body;

    try {
        await sql.connect(dbConfig);

        await sql.query`UPDATE FireWardens
                        SET
                            Location = ${Location},
                            LastUpdated = CONVERT(datetimeoffset(0), SYSDATETIMEOFFSET())
                        WHERE PersonId = ${PersonId}`;

        res.status(200).json({ message: 'Successfully updated location' });
    } catch (err) {
        console.error('Error updating location:', err);
        res.status(500).json({ error: 'Error updating location' });
    }
});

app.post('/FireWardenTracker_update', async (req, res) => {
    const { PersonId, FirstName, MiddleInitial, LastName, DateOfBirth, Email, Password, Phone, ShowOnTable } = req.body;

    try {
        await sql.connect(dbConfig);

        // Dynamically build the SET clause and parameters
        const updates = [];
        const params = {};
        
        if (PersonId) {
            updates.push('PersonId = @PersonId');
            params.PersonId = PersonId;
        }
        if (FirstName) {
            updates.push('FirstName = @FirstName');
            params.FirstName = FirstName;
        }
        if (MiddleInitial) {
            updates.push('MiddleInitial = @MiddleInitial');
            params.MiddleInitial = MiddleInitial;
        }
        if (LastName) {
            updates.push('LastName = @LastName');
            params.LastName = LastName;
        }
        if (DateOfBirth) {
            updates.push('DateOfBirth = @DateOfBirth');
            params.DateOfBirth = DateOfBirth;
        }
        if (Email) {
            updates.push('Email = @Email');
            params.Email = Email;
        }
        if (Password) {
            updates.push('Password = @Password');
            params.Password = Password;
        }
        if (Phone) {
            updates.push('Phone = @Phone');
            params.Phone = Phone;
        }
        if (ShowOnTable !== undefined) {
            updates.push('ShowOnTable = @ShowOnTable');
            params.ShowOnTable = Boolean(ShowOnTable); // Ensure it's a boolean
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields provided for update' });
        }

        const query = `UPDATE FireWardens SET ${updates.join(', ')} WHERE PersonId = @PersonId`;
        params.PersonId = PersonId;

        const request = new sql.Request();
        for (const [key, value] of Object.entries(params)) {
            request.input(key, value);
        }

        await request.query(query);

        res.status(200).json({ message: 'Successfully updated warden' });
    } catch (err) {
        console.error('Error updating warden:', err);
        res.status(500).json({ error: 'Error updating warden' });
    }
});

app.delete('/FireWardenTracker_remove', async (req, res) => {
    const { PersonId } = req.body;

    try {
        await sql.connect(dbConfig);

        await sql.query`DELETE FROM FireWardens WHERE PersonId = ${PersonId}`;

        res.status(200).json({ message: 'Successfully removed warden' });
    } catch (err) {
        console.error('Error removing warden:', err);
        res.status(500).json({ error: 'Error removing warden' });
    }
});

app.listen(port, async () => {
    console.log(`Server running on port ${port}`);

    try {
        await sql.connect(dbConfig);

        console.log('Connected to the database');
        const result = await sql.query`SELECT * FROM Locations`;
        console.log("all locations", result.recordset);
    } catch (err) {// Handle connection errors
        console.error('Error getting wardens on startup:', err);
    }
});

app.post('/FireWardenTracker_change_password', async (req, res) => {
    const { PersonId, newPassword } = req.body;

    try {
        await sql.connect(dbConfig);

        await sql.query`UPDATE FireWardens SET Password = ${newPassword} WHERE PersonId = ${PersonId}`;

        res.status(200).json({ message: 'Successfully changed password' });
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ error: 'Error changing password' });
    }   
})

app.post ('/FireWardenTracker_Update_User_Details', async (req, res) => {
    const { PersonId, Email, Password, Phone } = req.body;

    try {
        await sql.connect(dbConfig);

        await sql.query`UPDATE FireWardens
                        SET
                            Email = ${Email},
                            Password = ${Password},
                            Phone = ${Phone}
                        WHERE PersonId = ${PersonId}`;

        res.status(200).json({ message: 'Successfully updated user details' });
    } catch (err) {
        console.error('Error updating user details:', err);
        res.status(500).json({ error: 'Error updating user details' });
    }
}
);
