import pool from "../config/db.js";

export const getSubmission = async (req, res) => {

    const { id: testId } = req.params;

    const userId = req.user.id;
    const q = 'SELECT selected, question, answer,status, option1, option2, option3, option4 FROM submission JOIN result ON result.id = submission.resultid JOIN question ON question.id = submission.questionid WHERE result.testid = ? AND result.userid = ?';
    const values = [testId, userId];
    const [rows] = await pool.execute(q, values);
    const q1 = 'SELECT * FROM test WHERE id = ?';
    const [testRow] = await pool.execute(q1, [testId]);
    // if (rows.length === 0) {
    //     return res.status(404).json({ message: 'No submissions found' });
    // }
    // if (testRow.length === 0) {
    //     return res.status(404).json({ message: 'Test not found' });
    // }
    res.status(200).json({ submissions: rows, test: testRow[0] });
}

export const postSubmission = async (req, res) => {
    try {
        const { submissions } = req.body;
        console.log('Received submissions:', submissions);
        
        const testId = req.params.id;
        const id = req.user.id;
        
        if (!submissions || !Array.isArray(submissions)) {
            return res.status(400).json({ message: 'Invalid submissions format' });
        }
        
        // Check if user has already submitted for this test
        const [existingResult] = await pool.execute(
            'SELECT * FROM result WHERE userid = ? AND testid = ?',
            [id, testId]
        );
        
        if (existingResult.length > 0) {
            return res.status(400).json({ message: 'You have already submitted this test' });
        }
        
        const q1 = 'INSERT INTO result(userid, testid, score) VALUES (?, ?, 0)';
        const [result] = await pool.execute(q1, [id, testId]);
        
        const q2 = 'SELECT questionid, answer FROM test_has_ques t JOIN question q ON t.questionid = q.id WHERE testid = ? ORDER BY q.id';
        const [questions] = await pool.execute(q2, [testId]);
        
        console.log('Questions from DB:', questions.length);
        console.log('Submissions received:', submissions.length);
        
        if (questions.length !== submissions.length) {
            return res.status(400).json({ 
                message: `Mismatch in question count. Expected: ${questions.length}, Received: ${submissions.length}` 
            });
        }
        
        var allSub = [];
        let correctAnswers = 0;
        
        for (let i = 0; i < questions.length; i++) {
            if (submissions[i] !== "") {
                let status = (questions[i].answer === submissions[i]);
                if (status) correctAnswers++;
                allSub.push([result.insertId, questions[i].questionid, submissions[i], status]);
            }
        }
        
        // Update the score in result table
        const totalScore = correctAnswers * (await pool.execute('SELECT eachQuesMarks FROM test WHERE id = ?', [testId]))[0][0].eachQuesMarks;
        await pool.execute('UPDATE result SET score = ? WHERE id = ?', [totalScore, result.insertId]);
        
        if (allSub.length > 0) {
            const q3 = 'INSERT INTO submission(resultid, questionid, selected, status) VALUES ?';
            await pool.query(q3, [allSub]);
        }
        
        res.json({ message: 'Submission Successful' });
    } catch (err) {
        console.error('Error in postSubmission:', err);
        res.status(500).json({ message: 'Server error during submission' });
    }
}

