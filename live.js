document.addEventListener('DOMContentLoaded', async () => {
    const statusElement = document.getElementById('uploadStatus');
    if (statusElement) {
        statusElement.textContent = 'Updating team info... hold on...'; // Update status message
    }
    await fetchAndUpdateTeams();
    if (statusElement) {
        statusElement.textContent = ''; // Clear the status message after updating is complete
    }
});

async function fetchAndUpdateTeams() {
  await fetchAndDisplayTeam('65a7e72bdc7465401894b7a7', 'playersBench', 'benchTeamLockStatusId', false); // Fetch and display team Bench without inputs
  await fetchAndDisplayTeam('65a7e70adc7465401894b78a', 'playersYellow', 'yellowTeamLockStatusId'); // Fetch and display team Yellow with inputs
  await fetchAndDisplayTeam('65a7e6c71f5677401f1f48c1', 'playersRed', 'redTeamLockStatusId'); // Fetch and display team Red with inputs
  // Add event listeners for score updates here
}



async function fetchAndDisplayTeam(binId, elementId, lockStatusElementId, includeInputs = true) {
  try {
      const apiKey = '$2a$10$lx.0aczVGbFUh6i4EKyM..Hu00fZbSaq528KFgAgZAxoav8D7Ddb.'; // Replace with your actual API key
      const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
          method: 'GET',
          headers: {
              'X-Master-Key': apiKey
          }
      });

      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const team = data.record[Object.keys(data.record)[0]]; // Assuming the team data is the first property of the record
      const isTeamLocked = data.record[Object.keys(data.record)[1]] || false; // Set to false if undefined

      console.log(`Is ${elementId} Team Locked:`, isTeamLocked);

        // Update HTML element for lock status
        const lockStatusElement = document.getElementById(lockStatusElementId);
        if (lockStatusElement) {
            lockStatusElement.textContent += isTeamLocked ? ' [LOCKED]' : ' (unlocked)'; // Update text
            lockStatusElement.classList.toggle('locked', isTeamLocked); // Toggle a class for styling if needed
        }

      const playersElement = document.getElementById(elementId);
      if (!playersElement) {
          console.error(`Element with ID ${elementId} does not exist.`);
          return;
      }
      playersElement.innerHTML = ''; // Clear existing content

      if (includeInputs) {
          // Logic for teams with input fields
          team.forEach(user => {
              const userRow = document.createElement('tr');
              userRow.setAttribute('data-user-id', user.id); // Set the user's ID as a data attribute

              const positionAbbreviation = user.position ? user.position[0] : '';

              userRow.innerHTML = `
              <td>${user.name} (${positionAbbreviation})</td>
              <td><input type="number" class="goals stat-input" placeholder="0" data-user="${user.name}" /></td>
              <td><input type="number" class="assists" placeholder="0" data-user="${user.name}" /></td>
              <td><input type="number" class="own-goals stat-input" placeholder="0" data-user="${user.name}" /></td>
              <td><input type="number" class="cards" placeholder="0" data-user="${user.name}" /></td>
              <td><input type="number" class="penalties-saved" placeholder="0" data-user="${user.name}" /></td>
          `;
          
              playersElement.appendChild(userRow);

              userRow.querySelectorAll('.stat-input').forEach(input => {
                input.addEventListener('change', calculateTotalScore);
            });
          });
      } else {
          // Logic for the bench without input fields
          team.forEach(user => {
              const userListItem = document.createElement('li');
              userListItem.textContent = user.name;
              playersElement.appendChild(userListItem);
          });
      }
  } catch (error) {
      console.error('Error fetching and displaying team data:', error);
  }
}


function calculateTotalScore() {
  let scoreRed = 0;
  let scoreYellow = 0;

  // Add goals for Team Red
  document.querySelectorAll('#playersRed .goals').forEach(input => {
      const value = parseInt(input.value) || 0;
      scoreRed += value;
  });

  // Add own goals from Team Yellow to Team Red's score
  document.querySelectorAll('#playersYellow .own-goals').forEach(input => {
      const value = parseInt(input.value) || 0;
      scoreRed += value;
  });

  // Add goals for Team Yellow
  document.querySelectorAll('#playersYellow .goals').forEach(input => {
      const value = parseInt(input.value) || 0;
      scoreYellow += value;
  });

  // Add own goals from Team Red to Team Yellow's score
  document.querySelectorAll('#playersRed .own-goals').forEach(input => {
      const value = parseInt(input.value) || 0;
      scoreYellow += value;
  });

  // Update the total score in the Match Summary
  document.getElementById('totalScore').textContent = `${scoreRed} - ${scoreYellow}`;
}

async function collectAndUploadMatchData() {
        const yellowTeamLockStatusElement = document.getElementById('yellowTeamLockStatusId');
    const redTeamLockStatusElement = document.getElementById('redTeamLockStatusId');

    const isYellowTeamLocked = yellowTeamLockStatusElement && yellowTeamLockStatusElement.textContent.includes('[LOCKED]');
    const isRedTeamLocked = redTeamLockStatusElement && redTeamLockStatusElement.textContent.includes('[LOCKED]');

    if (!isYellowTeamLocked || !isRedTeamLocked) {
        alert('Both teams must be locked before saving the match.');
        return; // Exit the function if either team is not locked
    }

  // Collect Match Data
  const matchData = collectMatchData();

  const statusElement = document.getElementById('uploadStatus');
    statusElement.textContent = 'Uploading match data...'; // Update status message

  // Replace with your actual API key and collection's ID
  const apiKey = '$2a$10$lx.0aczVGbFUh6i4EKyM..Hu00fZbSaq528KFgAgZAxoav8D7Ddb.'; 
  const collectionId = '65aa7e311f5677401f210fed'; 

  try {
      // Upload Match Data
      const response = await fetch('https://api.jsonbin.io/v3/b', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'X-Master-Key': apiKey,
              'X-Collection-Id': collectionId
          },
          body: JSON.stringify(matchData)
      });

      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      await unlockTeams(); // Reset isTeamLocked to false for each team
    
        resetInputFields(); // Reset the input fields after successful data upload

      const responseData = await response.json();
      console.log('Match data uploaded successfully:', responseData);
      alert('Match data saved successfully.')
      statusElement.textContent = 'Match data uploaded successfully.'; // Update status message
  } catch (error) {
      console.error('Error uploading match data:', error);
      statusElement.textContent = 'Error uploading match data. Please try again.'; // Update status message
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const saveButton = document.getElementById('saveDataButton');
  
  if (saveButton) {
      saveButton.addEventListener('click', () => {
          // Add a confirmation dialog
          if (window.confirm("Are you sure all data is correct and match is ready to save?")) {
              collectAndUploadMatchData();
          }
      });
  }
});


function collectMatchData() {
  // Assuming you have elements for match ID and date
  const matchId = `match-${new Date().getTime()}`;
  const matchDate = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format

  const teamRedScore = document.getElementById('totalScore').textContent.split(' - ')[0];
  const teamYellowScore = document.getElementById('totalScore').textContent.split(' - ')[1];

  const teamRedPlayers = collectTeamData('playersRed');
  const teamYellowPlayers = collectTeamData('playersYellow');

  return {
      matchId: matchId,
      date: matchDate,
      teams: {
          teamRed: {
              teamName: 'Team Red',
              finalScore: parseInt(teamRedScore),
              players: teamRedPlayers
          },
          teamYellow: {
              teamName: 'Team Yellow',
              finalScore: parseInt(teamYellowScore),
              players: teamYellowPlayers
          }
      }
  };
}

function collectTeamData(teamElementId) {
    const players = [];
    const teamElement = document.getElementById(teamElementId);

    teamElement.querySelectorAll('tr[data-user-id]').forEach(playerRow => {
        const playerId = playerRow.getAttribute('data-user-id');
        const playerInfo = playerRow.querySelector('td').textContent;
        const playerName = playerInfo.split(' (')[0];
        const playerPosition = playerInfo.includes('(') ? playerInfo.split(' (')[1].slice(0, -1) : ''; // Extract the full position name

        const goals = parseInt(playerRow.querySelector('.goals').value) || 0;
        const assists = parseInt(playerRow.querySelector('.assists').value) || 0;
        const ownGoals = parseInt(playerRow.querySelector('.own-goals').value) || 0;
        const cards = parseInt(playerRow.querySelector('.cards').value) || 0;
        const penaltiesSaved = parseInt(playerRow.querySelector('.penalties-saved').value) || 0;

        players.push({
            playerId: playerId,
            name: playerName,
            position: playerPosition, // Include the player's position
            goals: goals,
            assists: assists,
            ownGoals: ownGoals,
            cards: cards,
            penaltiesSaved: penaltiesSaved
        });
    });

    return players;
}


function resetInputFields() {
    // Reset all input fields within the playersRed and playersYellow sections
    document.querySelectorAll('#playersRed input, #playersYellow input').forEach(input => {
        input.value = ''; // Reset each input field to an empty string
    });
  
    // Reset the total score display
    const totalScoreSpan = document.getElementById('totalScore');
    if (totalScoreSpan) {
      totalScoreSpan.textContent = '0 - 0'; // Set the initial score
    }
  }  

document.getElementsByClassName('goToMatchHistoryButton')[0].addEventListener('click', function() {
    window.location.href = 'match_history.html';
});

async function unlockTeams() {
    // IDs of the bins for each team
    const teamBinIds = ['65a7e72bdc7465401894b7a7', '65a7e70adc7465401894b78a', '65a7e6c71f5677401f1f48c1'];
    const apiKey = '$2a$10$lx.0aczVGbFUh6i4EKyM..Hu00fZbSaq528KFgAgZAxoav8D7Ddb.'; // API Key

    for (const binId of teamBinIds) {
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            // Modify the data to set isTeamLocked to false
            data.record.isTeamLocked = false;

            // Update the bin with the modified data
            await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': apiKey
                },
                body: JSON.stringify(data.record)
            });
        } catch (error) {
            console.error(`Error unlocking team with bin ID ${binId}:`, error);
        }
    }
}