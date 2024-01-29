async function fetchAndDisplayAllMatches() {
  const apiKey = '$2a$10$lx.0aczVGbFUh6i4EKyM..Hu00fZbSaq528KFgAgZAxoav8D7Ddb.'; 
  const collectionId = '65aa7e311f5677401f210fed'; 
  const matchHistoryDiv = document.getElementById('matchHistory');
  const loadingMessage = document.getElementById('loadingMessage'); // Get the loading message element

  try {
    // Step 1: Fetch the list of all bins in the collection
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
    // Sort the bins by createdAt in descending order (most recent first)
    const sortedBins = listData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));


    // No need to access .record on listData, listData itself is the array
    for (const bin of sortedBins) {
      const binId = bin.record; // Extract the bin ID

      const binResponse = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: 'GET',
        headers: {
          'X-Master-Key': apiKey
        }
      });

      if (!binResponse.ok) {
        console.error(`Error fetching bin data for ID ${binId}: ${binResponse.status}`);
        continue; // Skip to the next bin
      }

      const binData = await binResponse.json();
      addMatchToHistory(binData.record); // Assuming binData.record contains the match data
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

  // Create the container for the match
  const matchContainer = document.createElement('div');
  matchContainer.className = 'match-container';

  // Construct the scoreboard
  const scoreboard = document.createElement('div');
  scoreboard.className = 'match-scoreboard';

  // Team Red
  const teamRedDiv = document.createElement('div');
  teamRedDiv.className = 'match-team match-team-red';
  teamRedDiv.innerHTML = `
    <div class="match-team-name">${matchData.teams.teamRed.teamName}</div>
    <div class="match-score">${matchData.teams.teamRed.finalScore}</div>
  `;

  // Team Yellow
  const teamYellowDiv = document.createElement('div');
  teamYellowDiv.className = 'match-team match-team-yellow';
  teamYellowDiv.innerHTML = `
    <div class="match-score">${matchData.teams.teamYellow.finalScore}</div>
    <div class="match-team-name">${matchData.teams.teamYellow.teamName}</div>
  `;

  // Append teams to the scoreboard
  scoreboard.appendChild(teamRedDiv);
  scoreboard.appendChild(teamYellowDiv);

  // Match details
  const matchDetailsDiv = document.createElement('div');
  matchDetailsDiv.className = 'match-details';
  matchDetailsDiv.innerHTML = `
    <span class="match-date">Date: ${matchData.date}</span>
  `;

  // Buttons
  const editButton = document.createElement('button');
  editButton.className = 'edit-match-btn';
  editButton.textContent = 'Edit Match';
  editButton.addEventListener('click', () => {
    editMatch(matchData.matchId);
  });

  const infoButton = document.createElement('button');
  infoButton.className = 'match-info-btn';
  infoButton.textContent = 'See Match Info';
  infoButton.addEventListener('click', () => {
    seeMatchInfo(matchData.matchId);
  });

  // Append buttons to match details
  matchDetailsDiv.appendChild(editButton);
  matchDetailsDiv.appendChild(infoButton);

  // Append scoreboard and details to match container
  matchContainer.appendChild(scoreboard);
  matchContainer.appendChild(matchDetailsDiv);

  // Prepend the match container to the match history div
  matchHistoryDiv.insertBefore(matchContainer, matchHistoryDiv.firstChild);
}

document.getElementsByClassName('goToDashboardButton')[0].addEventListener('click', function() {
  window.location.href = 'live.html';
});