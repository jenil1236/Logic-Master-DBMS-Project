// import pool from "../config/db.js";

// export const getSubmission = async (req, res) => {
//     // console.log('called get');
//     const testId = req.params.id;
//     const test = await Test.findById(testId).populate('questions');
//     const user = await User.findById(req.user._id);
//     const submission = user.submissions.find(s => s.test_id.equals(testId));
//     // console.log(submission);
//     res.render("submission", { test, submission, page: "submission" });
// }
export const getSubmission = async (req, res) => {
    // console.log('called get');
    const testId = req.params.id;
    const userId = req.user._id;
    const q = 'SELECT selected, question, answer,status FROM submission JOIN result ON result.id = submission.resultid JOIN question ON question.id = submission.questionid WHERE result.testid = ? AND result.userid = ?';
    const values = [testId, userId];
    const [rows] = await pool.execute(q, values);
    const q1 = 'SELECT * FROM test WHERE id = ?';
    const [testRow] = await pool.execute(q1, [testId]);
    if (rows.length === 0) {
        return res.status(404).json({ message: 'No submissions found' });
    }
    if (testRow.length === 0) {
        return res.status(404).json({ message: 'Test not found' });
    }
    res.status(200).json({ submissions: rows, test: testRow[0] });
}

// export const postSubmission = async (req, res) => {
//     // const { submissions, questions } = req.body; // Array from frontend
//     const { submissions } = req.body; // Array from frontend
//     // console.log(submissions);

//     const testId = req.params.id;
//     // console.log(testId);

//     const id = req.user._id;
//     // 1. Transform submissions into the correct schema format
//     const formattedSubmissions = submissions.map(sub => ({
//         answer: sub.answer || "",
//         question: sub.question,
//         isMarked: sub.isMarked || false
//     }));

//     formattedSubmissions.sort((a, b) => a.question.toString().localeCompare(b.question.toString()));

//     // 2. Find the user first (to avoid overwriting existing submissions)
//     const user = await User.findById(id);

//     if (!user) {
//         return res.status(404).send("User not found");
//     }
//     user.submissions.push({
//         test_id: testId,
//         submittedAns: formattedSubmissions
//     });        // 3. Check if the user already submitted this test

//     // 4. Save the updated user
//     await user.save();

//     const submission = user.submissions.find(s => s.test_id.equals(testId));
//     if (!submission)
//         return res.status(404).send("Submission not found");
//     const test = await Test.findOne({ _id: testId }).populate("questions");
//     const answers = submission.submittedAns;
//     const questions = test.questions;
//     let score = 0;
//     for (let i = 0; i < questions.length; i++) {
//         if (questions[i]._type === "SCQ") {
//             if (questions[i].answer === answers[i].answer) {
//                 score += 3;
//                 answers[i].score = 3;
//             }
//         }
//         else if (questions[i]._type === "MCQ" && answers[i].answer.length > 0) {
//             const correctAns = questions[i].answer;
//             const givenAns = answers[i].answer;
//             let count = 0;
//             let falseAns = false;
//             for (const a of givenAns) {
//                 if (correctAns.indexOf(a) === -1) {
//                     // score -= 2;
//                     answers[i].score = 0;
//                     falseAns = true;
//                     break;
//                 }
//                 else count++;
//             }
//             if (!falseAns && count === correctAns.length) {
//                 score += 4;
//                 answers[i].score = 4;
//             }
//             else if (!falseAns) {
//                 score += count;
//                 answers[i].score = count;
//             }
//         }
//     }
//     submission.score = score;
//     submission.questions = questions;
//     await user.save();
//     res.redirect(`/submission/${testId}`);
// }
export const postSubmission = async (req, res) => {
    const { submissions } = req.body;
    // console.log(submissions);
    const testId = req.params.id;
    // console.log(testId);
    const id = req.user._id;
    // const q0 = 'SELECT * FROM test WHERE id = ?';
    // const [testRow] = await pool.execute(q0, [testId]);
    // const eachQuesMarks = testRow[0].eachQuesMarks;
    const q1 = 'INSERT INTO result(userid, testid, score) VALUES (?, ?, 0)';
    const [result] = await pool.execute(q1, [id, testId]);
    const q2 = 'SELECT questionid, answer FROM test_has_ques t JOIN question q ON t.questionid = q.id WHERE testid = ?';
    const [questions] = await pool.execute(q2, [testId]);
    var allSub = [];
    for (let i = 0; i < questions.length; i++) {
        if (submissions[i] !== "") {
            let status = (questions[i].answer === submissions[i]);
            allSub.push([result.insertId, questions[i].questionid, submissions[i], status]);
        }
    }
    const q3 = 'INSERT INTO submission(resultid, questionid, selected, status) VALUES ?';
    await pool.query(q3, [allSub]);
    // const q4 = 'UPDATE result SET score = ? WHERE id = ?';
    // await pool.execute(q4, [score, result.insertId]);
    res.json({ message: 'Submission Succesful' });
}

