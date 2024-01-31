async function fetchAndDisplayAllMatches() {
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
      addMatchToHistory(binData.record);
    }

    if (loadingMessage) {
      matchHistoryDiv.removeChild(loadingMessage);
    }
  } catch (error) {
    console.error('Error fetching match data:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchAndDisplayAllMatches();
});

function addMatchToHistory(matchData) {
  const matchHistoryDiv = document.getElementById('matchHistory');
  const matchContainer = document.createElement('div');
  matchContainer.className = 'match-container';

  const scoreboard = document.createElement('div');
  scoreboard.className = 'match-scoreboard';

  const teamRedDiv = document.createElement('div');
  teamRedDiv.className = 'match-team match-team-red';
  teamRedDiv.innerHTML = `
    <div class="match-team-name">${matchData.teams.teamRed.teamName}</div>
    <div class="match-score">${matchData.teams.teamRed.finalScore}</div>
  `;

  const teamYellowDiv = document.createElement('div');
  teamYellowDiv.className = 'match-team match-team-yellow';
  teamYellowDiv.innerHTML = `
    <div class="match-score">${matchData.teams.teamYellow.finalScore}</div>
    <div class="match-team-name">${matchData.teams.teamYellow.teamName}</div>
  `;

  scoreboard.appendChild(teamRedDiv);
  scoreboard.appendChild(teamYellowDiv);

  const matchDetailsDiv = document.createElement('div');
  matchDetailsDiv.className = 'match-details';
  matchDetailsDiv.innerHTML = `<span class="match-date">Date: ${matchData.date}</span>`;

  const matchTopDiv = document.createElement('div');
  matchTopDiv.className = 'match-top';
  matchTopDiv.appendChild(scoreboard);
  matchTopDiv.appendChild(matchDetailsDiv);

  const matchPlayersDiv = document.createElement('div');
  matchPlayersDiv.className = 'match-players';

  const matchStatsDiv = document.createElement('div');
  matchStatsDiv.className = 'match-stats';
  matchStatsDiv.style.display = 'none';

// Function to add stats for a team in a table format
const addTeamStats = (team) => {
  let tableHTML = `<h3>${team.teamName}</h3>`;
  tableHTML += `<table class="stats-table"><thead><tr><th>Player</th><th>Goals</th><th>Assists</th><th>Own Goals</th><th>Cards</th><th>Penalties Saved</th></tr></thead><tbody>`;
  
  team.players.forEach(player => {
    // Use player.position directly since it's provided in the data
    tableHTML += `<tr>`;
    tableHTML += `<td>${player.name} (${player.position})</td>`; // Position added next to the name
    tableHTML += `<td>${player.goals}</td>`;
    tableHTML += `<td>${player.assists}</td>`;
    tableHTML += `<td>${player.ownGoals}</td>`;
    tableHTML += `<td>${player.cards}</td>`;
    tableHTML += `<td>${player.penaltiesSaved}</td>`;
    tableHTML += `</tr>`;
  });
  
  tableHTML += `</tbody></table>`;
  return tableHTML;
};


  let statsContent = '';
  if (matchData.teams.teamRed) {
    statsContent += addTeamStats(matchData.teams.teamRed);
  }
  if (matchData.teams.teamYellow) {
    statsContent += addTeamStats(matchData.teams.teamYellow);
  }

  matchStatsDiv.innerHTML = statsContent;

  

  matchPlayersDiv.appendChild(matchStatsDiv);

  // Create the "See Match Info" button and event listener
  const infoButton = document.createElement('button');
  infoButton.className = 'match-info-btn';
  infoButton.textContent = 'See Match Info';
  infoButton.addEventListener('click', () => {
    if (matchStatsDiv.style.display === 'none') {
      matchStatsDiv.style.display = 'block';
    } else {
      matchStatsDiv.style.display = 'none';
    }
  });

  // Append the info button to the details div
  matchDetailsDiv.appendChild(infoButton);

  // Append top div and players div to the match container
  matchContainer.appendChild(matchTopDiv);
  matchContainer.appendChild(matchPlayersDiv);

  // Prepend the match container to the match history div
  matchHistoryDiv.insertBefore(matchContainer, matchHistoryDiv.firstChild);
}

document.getElementsByClassName('goToDashboardButton')[0].addEventListener('click', function() {
  window.location.href = 'live.html';
});
