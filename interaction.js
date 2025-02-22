document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const gameGrid = document.getElementById('gameGrid');
    const movesDisplay = document.getElementById('moves');
    const maxMovesDisplay = document.getElementById('max-moves');
    const matchesDisplay = document.getElementById('matches');
    const totalPairsDisplay = document.getElementById('total-pairs');
    const timerDisplay = document.getElementById('timer');
    const movesProgressBar = document.getElementById('moves-progress');
    const resetButton = document.getElementById('reset-button');
    const hintButton = document.getElementById('hint-button');
    const difficultyButtons = document.querySelectorAll('.difficulty-button');
    const instructionsButton = document.getElementById('instructions-button');
    const instructionsModal = document.getElementById('instructionsModal');
    const resultModal = document.getElementById('resultModal');
    const closeButton = document.querySelector('.close-button');
    const startGameButton = document.getElementById('start-game-button');
    const playAgainButton = document.getElementById('play-again-button');
    
    // Game configuration
    const difficulties = {
        easy: { rows: 4, cols: 4, maxMoves: 25 },
        medium: { rows: 4, cols: 5, maxMoves: 30 },
        hard: { rows: 5, cols: 6, maxMoves: 45 }
    };
    
    // Extended emoji set for different difficulties
    const allEmojis = [
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
        '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🦄', '🐙', '🦋', '🦀',
        '🐢', '🦓', '🦒', '🐬', '🦩', '🦜', '🦚', '🦉', '🐝', '🦂'
    ];
    
    // Game state
    let cards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let moves = 0;
    let maxMoves = difficulties.easy.maxMoves;
    let totalPairs = 8;
    let gameStarted = false;
    let timerInterval;
    let seconds = 0;
    let hintsRemaining = 2;
    let currentDifficulty = 'easy';
    let gameOver = false;
    
    // Event Listeners
    resetButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset the game?')) {
            startGame(currentDifficulty);
        }
    });
    
    hintButton.addEventListener('click', useHint);
    
    difficultyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const difficulty = e.target.dataset.difficulty;
            difficultyButtons.forEach(btn => btn.classList.remove('selected'));
            e.target.classList.add('selected');
            currentDifficulty = difficulty;
            startGame(difficulty);
        });
    });
    
    instructionsButton.addEventListener('click', () => {
        instructionsModal.style.display = 'flex';
    });
    
    closeButton.addEventListener('click', () => {
        instructionsModal.style.display = 'none';
    });
    
    startGameButton.addEventListener('click', () => {
        instructionsModal.style.display = 'none';
        startGame(currentDifficulty);
    });
    
    playAgainButton.addEventListener('click', () => {
        resultModal.style.display = 'none';
        startGame(currentDifficulty);
    });
    
    // Show instructions on first load
    instructionsModal.style.display = 'flex';
    
    // Game Functions
    function startGame(difficulty) {
        // Clear previous game state
        clearInterval(timerInterval);
        flippedCards = [];
        matchedPairs = 0;
        moves = 0;
        seconds = 0;
        gameStarted = false;
        gameOver = false;
        
        // Set configuration based on difficulty
        const config = difficulties[difficulty];
        maxMoves = config.maxMoves;
        const gridSize = config.rows * config.cols;
        totalPairs = gridSize / 2;
        
        // Update display elements
        movesDisplay.textContent = moves;
        maxMovesDisplay.textContent = maxMoves;
        matchesDisplay.textContent = matchedPairs;
        totalPairsDisplay.textContent = totalPairs;
        timerDisplay.textContent = seconds;
        movesProgressBar.style.width = '100%';
        hintButton.textContent = `Use Hint (${hintsRemaining})`;
        hintButton.disabled = hintsRemaining <= 0;
        
        // Update grid class for proper sizing
        gameGrid.className = `game-grid ${difficulty}`;
        
        // Create and shuffle cards
        createCards(config.rows, config.cols);
        
        // Reset hints for new game
        hintsRemaining = difficulty === 'easy' ? 2 : (difficulty === 'medium' ? 3 : 4);
        hintButton.textContent = `Use Hint (${hintsRemaining})`;
        hintButton.disabled = false;
    }
    
    function createCards(rows, cols) {
        gameGrid.innerHTML = '';
        
        // Get enough unique emojis for the pairs
        const pairsNeeded = (rows * cols) / 2;
        const gameEmojis = allEmojis.slice(0, pairsNeeded);
        
        // Create pairs and shuffle
        const cardValues = [...gameEmojis, ...gameEmojis];
        shuffleArray(cardValues);
        
        // Create card elements
        cards = cardValues.map((value, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.index = index;
            
            const cardContent = document.createElement('div');
            cardContent.className = 'card-content';
            cardContent.textContent = value;
            
            card.appendChild(cardContent);
            gameGrid.appendChild(card);
            
            card.addEventListener('click', () => flipCard(card, index, value));
            
            return {
                element: card,
                value: value,
                index: index
            };
        });
    }
    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    function startTimer() {
        timerInterval = setInterval(() => {
            seconds++;
            timerDisplay.textContent = seconds;
        }, 1000);
    }
    
    function flipCard(cardElement, index, value) {
        // Prevent actions if game is over or card is already matched/flipped
        if (gameOver || 
            cardElement.classList.contains('matched') || 
            cardElement.classList.contains('flipped') ||
            flippedCards.length >= 2) {
            return;
        }
        
        // Remove hint styling if present
        cards.forEach(card => card.element.classList.remove('hint'));
        
        // Start timer on first move
        if (!gameStarted) {
            gameStarted = true;
            startTimer();
        }
        
        // Flip card
        cardElement.classList.add('flipped');
        flippedCards.push({element: cardElement, value: value, index: index});
        
        // Process move when two cards are flipped
        if (flippedCards.length === 2) {
            processTurn();
        }
    }
    
    function processTurn() {
        moves++;
        movesDisplay.textContent = moves;
        updateProgressBar();
        
        if (flippedCards[0].value === flippedCards[1].value) {
            // Match found
            handleMatch();
        } else {
            // No match
            setTimeout(() => {
                flippedCards.forEach(card => {
                    card.element.classList.remove('flipped');
                });
                flippedCards = [];
            }, 1000);
        }
        
        // Check for game over conditions
        checkGameStatus();
    }
    
    function handleMatch() {
        setTimeout(() => {
            flippedCards.forEach(card => {
                card.element.classList.add('matched');
            });
            flippedCards = [];
            matchedPairs++;
            matchesDisplay.textContent = matchedPairs;
        }, 500);
    }
    
    function updateProgressBar() {
        const progressPercentage = ((maxMoves - moves) / maxMoves) * 100;
        movesProgressBar.style.width = `${Math.max(progressPercentage, 0)}%`;
        
        // Change color based on remaining moves
        if (progressPercentage < 25) {
            movesProgressBar.style.backgroundColor = '#e74c3c';
        } else if (progressPercentage < 50) {
            movesProgressBar.style.backgroundColor = '#f39c12';
        } else {
            movesProgressBar.style.backgroundColor = '#3498db';
        }
    }
    
    function checkGameStatus() {
        // Win condition
        if (matchedPairs === totalPairs) {
            endGame(true);
        }
        // Lose condition
        else if (moves >= maxMoves) {
            endGame(false);
        }
    }
    
    function endGame(won) {
        gameOver = true;
        clearInterval(timerInterval);
        
        // Show all cards if player lost
        if (!won) {
            showAllCards();
        }
        
        // Calculate score
        const score = calculateScore(won);
        
        // Show result modal
        const resultTitle = document.getElementById('result-title');
        const resultMessage = document.getElementById('result-message');
        const resultStats = document.getElementById('result-stats');
        
        resultTitle.textContent = won ? '🎉 Victory! 🎉' : 'Game Over';
        resultTitle.style.color = won ? '#2ecc71' : '#e74c3c';
        
        resultMessage.textContent = won 
            ? `Congratulations! You've found all pairs!`
            : `Sorry! You've run out of moves. Try again?`;
        
        resultStats.innerHTML = `
            <p><strong>Difficulty:</strong> ${currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)}</p>
            <p><strong>Pairs found:</strong> ${matchedPairs}/${totalPairs}</p>
            <p><strong>Moves used:</strong> ${moves}/${maxMoves}</p>
            <p><strong>Time taken:</strong> ${seconds} seconds</p>
            <p><strong>Final score:</strong> ${score} points</p>
        `;
        
        resultModal.style.display = 'flex';
    }
    
    function showAllCards() {
        cards.forEach(card => {
            if (!card.element.classList.contains('matched')) {
                card.element.classList.add('flipped');
            }
        });
    }
    
    function calculateScore(won) {
        if (!won) return 0;
        
        // Base score depends on difficulty
        const difficultyMultiplier = 
            currentDifficulty === 'easy' ? 1 :
            currentDifficulty === 'medium' ? 1.5 : 2;
        
        // Time bonus - faster is better
        const timeBonus = Math.max(1, 300 - seconds);
        
        // Move efficiency bonus
        const moveEfficiency = Math.max(0, maxMoves - moves);
        
        // Calculate final score
        return Math.floor((totalPairs * 100 + timeBonus + moveEfficiency * 10) * difficultyMultiplier);
    }
    
    function useHint() {
        if (hintsRemaining <= 0 || gameOver || !gameStarted) return;
        
        hintsRemaining--;
        hintButton.textContent = `Use Hint (${hintsRemaining})`;
        if (hintsRemaining <= 0) {
            hintButton.disabled = true;
        }
        
        // If one card is flipped, show its match
        if (flippedCards.length === 1) {
            const matchValue = flippedCards[0].value;
            const unflippedCards = cards.filter(card => 
                !card.element.classList.contains('flipped') && 
                !card.element.classList.contains('matched') &&
                card.value === matchValue
            );
            
            if (unflippedCards.length > 0) {
                unflippedCards[0].element.classList.add('hint');
            }
        }
        // If no cards flipped, show a random pair
        else if (flippedCards.length === 0) {
            const unmatched = cards.filter(card => 
                !card.element.classList.contains('matched')
            );
            
            if (unmatched.length >= 2) {
                // Find a random value that has both cards unmatched
                const values = [...new Set(unmatched.map(card => card.value))];
                const randomValue = values[Math.floor(Math.random() * values.length)];
                
                const pairCards = unmatched.filter(card => card.value === randomValue);
                if (pairCards.length >= 2) {
                    pairCards[0].element.classList.add('hint');
                    pairCards[1].element.classList.add('hint');
                }
            }
        }
    }   
        function handleMatch() {
            setTimeout(() => {
                flippedCards.forEach(card => {
                    card.element.classList.add('matched');
                });
                flippedCards = [];
                matchedPairs++;
                matchesDisplay.textContent = matchedPairs;
    
                // Check for game completion after each match
                checkGameStatus(); // Add this line
            }, 500);
        }
    
        function checkGameStatus() {
            // Win condition
            if (matchedPairs === totalPairs) {
                endGame(true); // Ensure this is called when all pairs are matched
            }
            // Lose condition
            else if (moves >= maxMoves) {
                endGame(false);
            }
        }
    
        function endGame(won) {
            gameOver = true;
            clearInterval(timerInterval);
            
            if (!won) {
                showAllCards();
            }
            
            const score = calculateScore(won);
            let ratingStars = '';
            
            if (won) {
                ratingStars = calculateMemoryRating(moves, maxMoves);
            }
    
            const resultTitle = document.getElementById('result-title');
            const resultMessage = document.getElementById('result-message');
            const resultStats = document.getElementById('result-stats');
            
            resultTitle.textContent = won ? '🎉 Victory! 🎉' : 'Game Over';
            resultTitle.style.color = won ? '#2ecc71' : '#e74c3c';
            
            resultMessage.textContent = won 
                ? `Congratulations! You've found all pairs!`
                : `Sorry! You've run out of moves. Try again?`;
            
            resultStats.innerHTML = `
                <p><strong>Difficulty:</strong> ${currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)}</p>
                <p><strong>Pairs found:</strong> ${matchedPairs}/${totalPairs}</p>
                <p><strong>Moves used:</strong> ${moves}/${maxMoves}</p>
                <p><strong>Time taken:</strong> ${seconds} seconds</p>
                ${won ? `<div class="star-rating">Memory Rating: ${ratingStars}</div>` : ''}
                <p><strong>Final score:</strong> ${score} points</p>
            `;
            
            resultModal.style.display = 'flex'; // Ensure the modal is displayed
        }
    
        // New rating calculation function
        function calculateMemoryRating(movesUsed, maxAllowedMoves) {
            const efficiency = ((maxAllowedMoves - movesUsed) / maxAllowedMoves) * 100;
            
            if (efficiency >= 80) return '★★★★★ (Photographic Memory!)';
            if (efficiency >= 60) return '★★★★☆ (Excellent!)';
            if (efficiency >= 40) return '★★★☆☆ (Good Job!)';
            if (efficiency >= 20) return '★★☆☆☆ (Keep Practicing!)';
            return '★☆☆☆☆ (Better Luck Next Time!)';
        }
    
    // Initialize the game
    startGame('easy');
});