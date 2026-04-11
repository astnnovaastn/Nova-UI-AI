import React, { useState, useEffect } from 'react';
import './TicTacToeWidget.css';

const TicTacToeWidget = ({ onClose }) => {
  const [gameMode, setGameMode] = useState(null);
  const [gameBoard, setGameBoard] = useState(Array(9).fill(''));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [gameActive, setGameActive] = useState(true);
  const [playerSymbol, setPlayerSymbol] = useState('X');
  const [aiSymbol, setAiSymbol] = useState('O');
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [gameStats, setGameStats] = useState({ wins: 0, losses: 0, draws: 0 });
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [symbolSelected, setSymbolSelected] = useState(false);

  const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  const checkWin = (board) => {
    for (let condition of winningConditions) {
      if (board[condition[0]] && board[condition[0]] === board[condition[1]] && board[condition[0]] === board[condition[2]]) {
        return board[condition[0]];
      }
    }
    return null;
  };

  const checkDraw = (board) => board.every(cell => cell !== '');

  const getRandomMove = (board) => {
    const emptyCells = board.map((cell, idx) => cell === '' ? idx : null).filter(val => val !== null);
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  };

  const getBestMove = (board) => {
    // Check if AI can win
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = aiSymbol;
        if (checkWin(board) === aiSymbol) {
          board[i] = '';
          return i;
        }
        board[i] = '';
      }
    }
    // Block player from winning
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = playerSymbol;
        if (checkWin(board) === playerSymbol) {
          board[i] = '';
          return i;
        }
        board[i] = '';
      }
    }
    // Take center if available
    if (board[4] === '') return 4;
    // Take corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => board[i] === '');
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }
    // Take any available
    return getRandomMove(board);
  };

  const makeAIMove = (board) => {
    if (aiDifficulty === 'easy') {
      return getRandomMove(board);
    } else if (aiDifficulty === 'medium') {
      return Math.random() > 0.5 ? getBestMove(board) : getRandomMove(board);
    } else {
      return getBestMove(board);
    }
  };

  const makeMove = (index) => {
    if (gameBoard[index] !== '' || !gameActive || currentPlayer !== playerSymbol) return;

    const newBoard = [...gameBoard];
    newBoard[index] = playerSymbol;
    setGameBoard(newBoard);
    setMoveHistory([...moveHistory, { move: index, player: playerSymbol }]);

    const winner = checkWin(newBoard);
    if (winner) {
      endGame('player');
      return;
    }
    if (checkDraw(newBoard)) {
      endGame('draw');
      return;
    }

    setCurrentPlayer(aiSymbol);
    setTimeout(() => {
      const aiMove = makeAIMove(newBoard);
      newBoard[aiMove] = aiSymbol;
      setGameBoard(newBoard);
      setMoveHistory(prev => [...prev, { move: aiMove, player: aiSymbol }]);

      const aiWinner = checkWin(newBoard);
      if (aiWinner) {
        endGame('ai');
        return;
      }
      if (checkDraw(newBoard)) {
        endGame('draw');
        return;
      }
      setCurrentPlayer(playerSymbol);
    }, 500);
  };

  const endGame = (result) => {
    setGameActive(false);
    if (result === 'player') {
      setGameStats(prev => ({ ...prev, wins: prev.wins + 1 }));
    } else if (result === 'ai') {
      setGameStats(prev => ({ ...prev, losses: prev.losses + 1 }));
    } else if (result === 'draw') {
      setGameStats(prev => ({ ...prev, draws: prev.draws + 1 }));
    }
  };

  const newGame = () => {
    setGameBoard(Array(9).fill(''));
    setCurrentPlayer(playerSymbol);
    setGameActive(true);
    setMoveHistory([]);
  };

  const startAIGame = () => {
    setGameMode('ai');
    setGameActive(true);
    setGameBoard(Array(9).fill(''));
    setCurrentPlayer(playerSymbol);
    setMoveHistory([]);
  };

  const selectSymbol = (symbol) => {
    setPlayerSymbol(symbol);
    setAiSymbol(symbol === 'X' ? 'O' : 'X');
    setSelectedSymbol(symbol);
    setSymbolSelected(true);
    startAIGame();
  };

  if (!gameMode) {
    return (
      <div className="tictactoe-widget">
        <div className="tictactoe-header">
          <div className="tictactoe-logo">
            <i className="fas fa-gamepad"></i>
          </div>
          <div>
            <h3 className="tictactoe-title">Tic Tac Toe</h3>
            <p className="tictactoe-brand">AI Challenge</p>
          </div>
          <div className="tictactoe-status">
            <div className="status-indicator active"></div>
          </div>
        </div>

        <div className="tictactoe-content">
          <div className="game-mode-selection">
            <h4 className="game-mode-title">Select Game Mode</h4>
            <div className="mode-buttons">
              <button className="mode-btn" onClick={() => setGameMode('ai')}>
                <i className="fas fa-robot"></i> Play AI
              </button>
              <button className="mode-btn" onClick={() => setGameMode('multiplayer')}>
                <i className="fas fa-users"></i> Multiplayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameMode === 'ai' && !symbolSelected) {
    return (
      <div className="tictactoe-widget">
        <div className="tictactoe-header">
          <div className="tictactoe-logo">
            <i className="fas fa-gamepad"></i>
          </div>
          <div>
            <h3 className="tictactoe-title">Tic Tac Toe</h3>
            <p className="tictactoe-brand">AI Challenge</p>
          </div>
        </div>

        <div className="tictactoe-content">
          <div className="symbol-selection">
            <h4 className="symbol-title">Choose Your Symbol</h4>
            <div className="symbol-buttons">
              <button className="symbol-btn" onClick={() => selectSymbol('X')}>X</button>
              <button className="symbol-btn" onClick={() => selectSymbol('O')}>O</button>
            </div>
          </div>

          <div className="ai-difficulty-selection">
            <h4 className="difficulty-title">AI Difficulty</h4>
            <div className="difficulty-buttons">
              {['easy', 'medium', 'hard'].map(level => (
                <button 
                  key={level}
                  className={`difficulty-btn ${aiDifficulty === level ? 'selected' : ''}`}
                  onClick={() => setAiDifficulty(level)}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tictactoe-widget">
      <div className="tictactoe-header">
        <div className="tictactoe-logo">
          <i className="fas fa-gamepad"></i>
        </div>
        <div>
          <h3 className="tictactoe-title">Tic Tac Toe</h3>
          <p className="tictactoe-brand">{gameMode === 'ai' ? 'vs AI (' + aiDifficulty + ')' : 'Multiplayer'}</p>
        </div>
        <div className="tictactoe-status">
          <div className={`status-indicator ${gameActive ? 'active' : ''}`}></div>
        </div>
      </div>

      <div className="tictactoe-content">
        <div className="game-container">
          <div className="game-info">
            <span>{currentPlayer === playerSymbol ? 'Your Turn' : 'AI Turn'}</span>
          </div>

          <div className="game-board">
            {gameBoard.map((cell, idx) => (
              <button
                key={idx}
                className={`cell ${cell} ${!gameActive ? 'disabled' : ''}`}
                onClick={() => makeMove(idx)}
                disabled={!gameActive || cell !== ''}
              >
                {cell}
              </button>
            ))}
          </div>

          <div className="game-controls">
            <button className="control-btn" onClick={newGame}>
              <i className="fas fa-redo"></i> New Game
            </button>
            {gameMode === 'ai' && (
              <button className="control-btn" onClick={() => setGameMode(null)}>
                <i className="fas fa-arrow-left"></i> Back
              </button>
            )}
          </div>

          <div className="score-display">
            <div className="score-item">
              <span className="score-label">Wins</span>
              <span className="score-value">{gameStats.wins}</span>
            </div>
            <div className="score-item">
              <span className="score-label">Losses</span>
              <span className="score-value">{gameStats.losses}</span>
            </div>
            <div className="score-item">
              <span className="score-label">Draws</span>
              <span className="score-value">{gameStats.draws}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicTacToeWidget;
