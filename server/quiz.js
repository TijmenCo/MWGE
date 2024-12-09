const QUIZ_QUESTIONS = [
  {
    id: 'music-1',
    text: 'Which band has the most platinum records?',
    options: [
      'The Beatles',
      'Led Zeppelin',
      'Pink Floyd',
      'Eagles'
    ],
    correctAnswer: 0,
    category: 'music'
  },
  {
    id: 'music-2',
    text: 'Who wrote the song "Imagine"?',
    options: [
      'Paul McCartney',
      'John Lennon',
      'George Harrison',
      'Ringo Starr'
    ],
    correctAnswer: 1,
    category: 'music'
  },
  {
    id: 'games-1',
    text: 'Which video game console has sold the most units worldwide?',
    options: [
      'PlayStation 2',
      'Nintendo DS',
      'Xbox 360',
      'Nintendo Wii'
    ],
    correctAnswer: 0,
    category: 'games'
  },
  {
    id: 'movies-1',
    text: 'Which movie won the Academy Award for Best Picture in 2020?',
    options: [
      '1917',
      'Joker',
      'Parasite',
      'Once Upon a Time in Hollywood'
    ],
    correctAnswer: 2,
    category: 'movies'
  }
];

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
      if (!lobby.scores[username]) {
        lobby.scores[username] = 0;
      }
      lobby.scores[username] += 10;
      correctUsers.push(username);
    }
    results.push({ username, answer: userAnswer });
  });

  io.to(lobbyId).emit('scores_update', lobby.scores);

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