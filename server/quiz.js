import { QUIZ_QUESTIONS } from "./constants/QuizQuestions.js";

export function handleQuizAnswer(io, lobby, lobbyId, username, answer) {
  if (!lobby.quizState) return;

  // Record the user's answer
  lobby.quizState.answers[username] = answer;

  // Update the list of users who have answered
  io.to(lobbyId).emit('quiz_answer_update', {
    answeredUsers: Object.keys(lobby.quizState.answers)
  });

  // Check if everyone has answered or if time has run out
  const totalAnswers = Object.keys(lobby.quizState.answers).length;
  const totalPlayers = lobby.users.length;

  if (totalAnswers === totalPlayers) {
    sendQuizResults(io, lobby, lobbyId);
  }
}

function sendQuizResults(io, lobby, lobbyId) {
  if (!lobby.quizState?.currentQuestion) return;

  const correctAnswer = lobby.quizState.currentQuestion.correctAnswer;
  const results = [];
  const correctUsers = [];

  Object.entries(lobby.quizState.answers).forEach(([username, userAnswer]) => {
    if (userAnswer === correctAnswer) {
      correctUsers.push(username);
    }
    results.push({ username, answer: userAnswer });
  });

  io.to(lobbyId).emit('quiz_results', {
    results,
    correctAnswer,
    correctUsers,
    scores: lobby.scores
  });

  // Clear answers for next question
  lobby.quizState.answers = {};
}

export function startQuizQuestion(io, lobby, lobbyId) {
  // Initialize quiz state if not exists
  if (!lobby.quizState) {
    lobby.quizState = {
      answers: {},
      currentQuestion: null,
      usedQuestions: []
    };
  }

  // Select a random question that hasn't been used
  const availableQuestions = QUIZ_QUESTIONS.filter(q => 
    !lobby.quizState.usedQuestions.includes(q.id)
  );

  let question;
  if (availableQuestions.length === 0) {
    // If all questions have been used, reset and pick a random one
    lobby.quizState.usedQuestions = [];
    question = QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)];
  } else {
    question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
  }

  lobby.quizState.currentQuestion = question;
  lobby.quizState.usedQuestions.push(question.id);
  lobby.quizState.answers = {};

  // Send question to all players
  io.to(lobbyId).emit('quiz_question', {
    id: question.id,
    text: question.text,
    options: question.options
  });
}

export function handleQuizStateRequest(socket, lobby) {
  if (lobby.quizState?.currentQuestion) {
    socket.emit('quiz_question', {
      id: lobby.quizState.currentQuestion.id,
      text: lobby.quizState.currentQuestion.text,
      options: lobby.quizState.currentQuestion.options
    });

    // Also send current state of answers
    socket.emit('quiz_answer_update', {
      answeredUsers: Object.keys(lobby.quizState.answers)
    });
  }
}