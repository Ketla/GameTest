async function fetchAndScoreBoard() {
  const apiKey = '$2a$10$lx.0aczVGbFUh6i4EKyM..Hu00fZbSaq528KFgAgZAxoav8D7Ddb.';
  const collectionId = '65aa7e311f5677401f210fed';
  const matchHistoryDiv = document.getElementById('matchHistory');
  const loadingMessage = document.getElementById('loadingMessage');

  try {
    const listResponse = await fetch(`https://api.jsonbin.io/v3/c/${collectionId}/bins`, {
      method: 'GET',
      headers: {
        'X-Master-Key': apiKey
      }
    });

    if (!listResponse.ok) {
      throw new Error(`HTTP error! Status: ${listResponse.status}`);
    }

    const listData = await listResponse.json();
    const sortedBins = listData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    for (const bin of sortedBins) {
      const binId = bin.record;

      const binResponse = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: 'GET',
        headers: {
          'X-Master-Key': apiKey
        }
      });

      if (!binResponse.ok) {
        console.error(`Error fetching bin data for ID ${binId}: ${binResponse.status}`);
        continue;
      }

      const binData = await binResponse.json();
      givePointsToPlayers(binData.record);
      calculatePlayerPerformance(binData.record);
      updateTotalPointsWithPerformance(binData.record);
    }

    printHighscoreList(); // Finally, this prints the highscore list
    printHighscoreListHtml()

    if (loadingMessage) {
      matchHistoryDiv.removeChild(loadingMessage);
    }
  } catch (error) {
    console.error('Error fetching match data:', error);
  }

}

document.addEventListener('DOMContentLoaded', () => {
  fetchAndScoreBoard();
});

let totalPointsData = {};

function givePointsToPlayers(scoreboardData) {
  const redScore = scoreboardData.teams.teamRed.finalScore;
  const yellowScore = scoreboardData.teams.teamYellow.finalScore;

  const redResult = redScore > yellowScore ? 'win' : (redScore < yellowScore ? 'lose' : 'draw');
  const yellowResult = yellowScore > redScore ? 'win' : (yellowScore < redScore ? 'lose' : 'draw');

  const assignPoints = (teamPlayers, result) => {
    return teamPlayers.map(player => {
      let points = 0;
      if (result === 'win') {
        points = 6;
      } else if (result === 'draw') {
        points = 2;
      }

      if (totalPointsData[player.playerId]) {
        totalPointsData[player.playerId].points += points;
      } else {
        totalPointsData[player.playerId] = {
          playerId: player.playerId,
          name: player.name,
          points,
        };
      }

      return {
        playerId: player.playerId,
        name: player.name,
        matchPoints: points, // Points gained from this match
        totalPoints: totalPointsData[player.playerId].points, // Total points including this match
      };
    });
  };

  // Process each team and collect their updated points information
  const redTeamUpdates = assignPoints(scoreboardData.teams.teamRed.players, redResult);
  const yellowTeamUpdates = assignPoints(scoreboardData.teams.teamYellow.players, yellowResult);

  // Log a cleaner summary
  console.log(`Match ${scoreboardData.matchId} Points Summary:`);
  [...redTeamUpdates, ...yellowTeamUpdates].forEach(player => {
    console.log(`${player.name} (Player ID: ${player.playerId}) - Match Points: ${player.matchPoints}, Total Points: ${player.totalPoints}`);
  });
}

function calculatePlayerPerformance(scoreboardData) {
  // Define the scoring system based on the provided table
  const scoring = {
    G: {
      goal: 5,
      assist: 2,
      cleanSheet: 4,
      goalsConceded: -1, // For every 2 goals conceded
      card: -2,
      penaltySave: 3,
      ownGoal: -2
    },
    D: {
      goal: 4,
      assist: 2,
      cleanSheet: 4,
      goalsConceded: -1,
      card: -2,
      ownGoal: -2
    },
    A: {
      goal: 3,
      assist: 3,
      card: -2,
      ownGoal: -2
    }
  };

  // Helper function to calculate performance score for a player
  const calculateScore = (player) => {
    let score = 0;
    let positionScoring = scoring[player.position];

    score += (player.goals || 0) * positionScoring.goal;
    score += (player.assists || 0) * positionScoring.assist;
    score -= (player.ownGoals || 0) * positionScoring.ownGoal;
    score -= (player.cards || 0) * positionScoring.card;

    // Check if the player is a goalkeeper or defender
    if (player.position === 'G' || player.position === 'D') {
      // If the final score is 0 for the opponent, it's a clean sheet
      const opponentScore = player.team === 'teamRed' ? scoreboardData.teams.teamYellow.finalScore : scoreboardData.teams.teamRed.finalScore;
      if (opponentScore === 0) {
        score += positionScoring.cleanSheet;
      }

      if (player.position === 'G') {
        score += (player.penaltiesSaved || 0) * positionScoring.penaltySave;
        score += Math.floor((player.goalsConceded || 0) / 2) * positionScoring.goalsConceded;
      }
    }

    return score;
  };

  // Process all players and calculate their performance score
  const processPlayers = (players) => {
    return players.map(player => {
      player.performanceScore = calculateScore(player);
      return player;
    });
  };

  // Calculate performance for both teams
  scoreboardData.teams.teamRed.players = processPlayers(scoreboardData.teams.teamRed.players);
  scoreboardData.teams.teamYellow.players = processPlayers(scoreboardData.teams.teamYellow.players);

  // Log the performance scores for verification
  console.log('Player Performance Scores:');
  scoreboardData.teams.teamRed.players.concat(scoreboardData.teams.teamYellow.players).forEach(player => {
    console.log(`Player ID: ${player.playerId}, Name: ${player.name}, Position: ${player.position}, Performance Score: ${player.performanceScore}`);
  });

  // Return the scoreboard data with updated performance scores
  return scoreboardData;
}

function updateTotalPointsWithPerformance(scoreboardData) {
  // Update the totalPointsData with performance scores
  ['teamRed', 'teamYellow'].forEach(teamKey => {
    scoreboardData.teams[teamKey].players.forEach(player => {
      // If the player already exists in totalPointsData, update their performance score
      if (totalPointsData[player.playerId]) {
        // Initialize performanceScore if it does not exist
        if (typeof totalPointsData[player.playerId].performanceScore !== 'number') {
          totalPointsData[player.playerId].performanceScore = 0;
        }
        // Accumulate the performance score
        totalPointsData[player.playerId].performanceScore += player.performanceScore;
      } else {
        // If it's a new player, add them to totalPointsData
        totalPointsData[player.playerId] = {
          playerId: player.playerId,
          name: player.name,
          points: 0, // Initialize points
          performanceScore: player.performanceScore || 0, // Initialize performance score
        };
      }
    });
  });
}

function printHighscoreList() {
  // Original Highscore List based on total points
  console.log("Highscore List (sorted by total points, most on top):");
  const highscoreList = Object.values(totalPointsData);
  highscoreList.sort((a, b) => b.points - a.points || b.performanceScore - a.performanceScore);
  highscoreList.forEach((player) => {
    console.log(`Player ID: ${player.playerId}, Name: ${player.name}, Total Points: ${player.points}`);
  });

  // Performance Score List based on performance scores
  console.log("\nPerformance Score List (sorted by performance score):");
  const performanceScoreList = [...highscoreList]; // Clone the original list to keep the order intact for performance scores
  performanceScoreList.sort((a, b) => b.performanceScore - a.performanceScore);
  performanceScoreList.forEach((player) => {
    console.log(`Player ID: ${player.playerId}, Name: ${player.name}, Performance Score: ${player.performanceScore}`);
  });

  // Weighted Highscore List (70% points - 30% performance score)
  console.log("\nWeighted Highscore List (70% points - 30% performance score):");
  const weightedHighscoreList = highscoreList.map(player => ({
    ...player,
    weightedScore: player.points * 0.7 + player.performanceScore * 0.3
  }));
  weightedHighscoreList.sort((a, b) => b.weightedScore - a.weightedScore);
  weightedHighscoreList.forEach((player) => {
    console.log(`Player ID: ${player.playerId}, Name: ${player.name}, Weighted Score: ${player.weightedScore.toFixed(2)}`);
  });
}

function printHighscoreListHtml() {
  const scoreboardDiv = document.getElementById('scoreboard');
  
  // Helper function to generate HTML for a list
  function generateListHTML(title, players, scoreType) {
    let html = `<h2>${title}</h2><ul>`;
    players.forEach(player => {
      const scoreText = scoreType === 'weighted' ? player.weightedScore.toFixed(2) : player[scoreType];
      html += `<li>${player.name} - ${scoreType.charAt(0).toUpperCase() + scoreType.slice(1)}: ${scoreText}</li>`;
    });
    html += '</ul>';
    return html;
  }

  // Sort and prepare the data for each list
  const highscoreList = Object.values(totalPointsData).sort((a, b) => b.points - a.points || b.performanceScore - a.performanceScore);
  const performanceScoreList = [...highscoreList].sort((a, b) => b.performanceScore - a.performanceScore);
  const weightedHighscoreList = highscoreList.map(player => ({
    ...player,
    weightedScore: player.points * 0.7 + player.performanceScore * 0.3
  })).sort((a, b) => b.weightedScore - a.weightedScore);

  // Generate and insert HTML for each list
  const highscoreHTML = generateListHTML("Points List (W=6, D=2, L=0)", highscoreList, 'points');
  const performanceScoreHTML = generateListHTML("Performance Score List", performanceScoreList, 'performanceScore');
  const weightedHighscoreHTML = generateListHTML("Weighted Highscore List (70% points - 30% performance score)", weightedHighscoreList, 'weighted');

  // Combine HTML for all lists and update the DOM
  scoreboardDiv.innerHTML = highscoreHTML + performanceScoreHTML + weightedHighscoreHTML;
}



















